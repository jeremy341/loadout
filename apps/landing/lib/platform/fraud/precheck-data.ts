// The pre-check sweep: find submitted ships that have not been pre-checked since they were last submitted, read their repo, and
// record one FraudCheck row each. Ported in behaviour from Pixl's apps/server/src/precheck/run.ts (runPrecheck) at upstream
// 1468ba6942b13add1ac50e1319541a033ee1df38.
//
// What Pixl does and this does not. Pixl runs the check on ship, and on a clear-cut miss it sends the project back to the maker
// (status needs_changes, a review note, a notification and a Slack DM), at most once per project. LOADOUT writes none of that:
// a miss is a FLAGGED row for the reviewer and the builder is not told anything by the machine. The project's status is never
// touched here.
//
// "Not yet checked" means: no cleared, flagged or dismissed precheck row since the ship's current submittedAt. A re-ship refreshes
// submittedAt, so it is checked again. A run costs a model call, so the sweep is bounded three ways: PRECHECK_BATCH ships a run, at
// most PRECHECK_MAX_ATTEMPTS tries per submission (a pending row is an attempt), and a pending or failed try is left alone for
// PRECHECK_RETRY_GAP_MS. The pending row is written before the work, so a second sweep that overlaps this one sees it and leaves
// the ship alone.
//
// Outcomes: flagged (a confident miss), cleared (nothing missing; the model's notes ride in detail), error (nothing could be read at
// all, so "nothing missing" would be a lie). A link that is not a GitHub repo is not applicable and gets no row. LOADOUT_PRECHECK=off
// answers { disabled: true }. With no model key the fixed rules still run and the row says the README content check was skipped.
import type { PrismaClient } from "../../generated/prisma/client";
import { db } from "../db";
import { kindOfTrack } from "../review-decisions";
import { precheckConfig, type Env, type PrecheckConfig } from "./config";
import { recordCheck, type CheckStore } from "./checks";
import { BLOCKING, evaluate, parseGithubRef, requirementsFor, summaryLine, type AiAnswer, type PrecheckFindings, type ProjectKind, type RepoRef, type Requirement } from "./precheck-rules";
import { askModel, fetchRepoInputs, type PromptInput } from "./precheck-sources";
import type { FetchImpl } from "./robert";

export const PRECHECK_BATCH = 10;
export const PRECHECK_MAX_ATTEMPTS = 3;
export const PRECHECK_RETRY_GAP_MS = 15 * 60_000;
const PRECHECK_STATES = ["submitted", "in-review", "second-pass", "in_review", "second_pass"] as const;

type Store = Pick<PrismaClient, "fraudCheck" | "project">;

// The three things the check reads from outside. Replaceable so the sweep is testable without a network.
export type PrecheckSources = {
  inputs: (ref: RepoRef) => Promise<{ files: string[] | null; readme: string | null }>;
  ask: (p: PromptInput) => Promise<AiAnswer | null>;
};

export function liveSources(config: PrecheckConfig, fetchImpl?: FetchImpl): PrecheckSources {
  return {
    inputs: (ref) => fetchRepoInputs(ref, config.githubToken, fetchImpl),
    ask: (p) => askModel(config, p, fetchImpl),
  };
}

export type PrecheckResult = { status: "cleared" | "flagged" | "error"; summary: string; detail: Record<string, unknown> };

// One ship's pre-check from its inputs to the row to write. Pure apart from the sources it is handed.
export async function precheckShip(
  ship: { name: string; description: string; kind: ProjectKind; ref: RepoRef },
  sources: PrecheckSources,
  model: string,
): Promise<PrecheckResult> {
  const { files, readme } = await sources.inputs(ship.ref);
  // Neither the listing nor the README could be read (rate limit, private repo, GitHub down): nothing was checked.
  if (files === null && readme === null) return { status: "error", summary: "The repo could not be read, so the pre-check did not run; it will be tried again.", detail: { model } };

  const asked: Requirement[] = requirementsFor(ship.kind);
  const ai = readme ? await sources.ask({ kind: ship.kind, name: ship.name, description: ship.description, readme, files, asked }) : null;
  const findings = evaluate({ kind: ship.kind, readme, files, ai, asked });
  return { status: findings.blocking.length > 0 ? "flagged" : "cleared", summary: summaryLine(findings), detail: detailOf(findings, model) };
}

// Everything a reviewer may want, with the model's words shortened and kept apart from the fixed labels.
function detailOf(f: PrecheckFindings, model: string): Record<string, unknown> {
  return {
    model,
    findings: f.blocking.map((id) => ({ id, label: BLOCKING[id], evidence: (f.evidence[id as keyof typeof f.evidence] ?? "").slice(0, 300) })),
    notes: f.notes.slice(0, 6).map((n) => n.slice(0, 300)),
    fileNotes: f.fileNotes,
    modelSummary: f.summary.slice(0, 600),
    skipped: f.skipped,
  };
}

export type PrecheckSweepDeps = { env?: Env; fetch?: FetchImpl; now?: () => Date; client?: Store; sources?: PrecheckSources };
export type PrecheckSweepSummary = { disabled: true } | { disabled: false; considered: number; checked: number; flagged: number; failed: number; skipped: number; writeFailed: number };

// Whether a submission still needs a try, from the precheck rows written since it was submitted (newest first). Pure.
export function needsPrecheck(rows: readonly { status: string; checkedAt: Date }[], now: Date): boolean {
  if (rows.some((r) => r.status === "cleared" || r.status === "flagged" || r.status === "dismissed")) return false;
  const attempts = rows.filter((r) => r.status === "pending").length;
  if (attempts >= PRECHECK_MAX_ATTEMPTS) return false;
  const newest = rows[0];
  return !newest || now.getTime() - newest.checkedAt.getTime() >= PRECHECK_RETRY_GAP_MS;
}

export async function sweepPrecheck(deps: PrecheckSweepDeps = {}): Promise<PrecheckSweepSummary> {
  const config = precheckConfig(deps.env ?? process.env);
  if (!config) return { disabled: true };
  const client: Store = deps.client ?? db();
  const now = (deps.now ?? (() => new Date()))();
  const sources = deps.sources ?? liveSources(config, deps.fetch);
  const summary = { considered: 0, checked: 0, flagged: 0, failed: 0, skipped: 0, writeFailed: 0 };

  const ships = await client.project.findMany({
    where: { status: { in: [...PRECHECK_STATES] }, submittedAt: { not: null }, repoUrl: { contains: "github.com", mode: "insensitive" } },
    select: { id: true, title: true, description: true, track: true, repoUrl: true, submittedAt: true },
    orderBy: { submittedAt: "asc" },
    take: 200,
  });
  for (const ship of ships) {
    if (summary.checked + summary.failed >= PRECHECK_BATCH) break;
    const ref = parseGithubRef(ship.repoUrl ?? "");
    if (!ref) continue;
    summary.considered += 1;
    const rows = await client.fraudCheck.findMany({ where: { projectId: ship.id, kind: "precheck", checkedAt: { gte: ship.submittedAt as Date } }, orderBy: { checkedAt: "desc" } });
    if (!needsPrecheck(rows, now)) {
      summary.skipped += 1;
      continue;
    }
    const started = await recordCheck({ projectId: ship.id, kind: "precheck", status: "pending", summary: "Pre-check running.", detail: { model: config.model } }, client as CheckStore);
    // No pending row means no overlap guard and no attempt count, so the model call is not spent.
    if (!started.ok) {
      summary.writeFailed += 1;
      continue;
    }
    try {
      const result = await precheckShip({ name: ship.title, description: ship.description ?? "", kind: kindOfTrack(ship.track), ref }, sources, config.model);
      const written = await recordCheck({ projectId: ship.id, kind: "precheck", status: result.status, summary: result.summary, detail: result.detail as never }, client as CheckStore);
      if (!written.ok) summary.writeFailed += 1;
      if (result.status === "error") summary.failed += 1;
      else summary.checked += 1;
      if (result.status === "flagged") summary.flagged += 1;
    } catch {
      summary.failed += 1;
      await recordCheck({ projectId: ship.id, kind: "precheck", status: "error", summary: "The pre-check failed; it will be tried again.", detail: { model: config.model } }, client as CheckStore);
    }
  }
  return { disabled: false, ...summary };
}
