// The Robert sync job: submit ships that are waiting on fraud triage to Telescreen, then poll for the scores that have come back and
// record them as FraudCheck rows. Ported in behaviour from Pixl's apps/internal-dashboard/app/api/cron/robert-sync/route.ts and
// lib/robertSync.ts (submitToRobert, applyReview) at upstream 1468ba6942b13add1ac50e1319541a033ee1df38.
//
// Which ships are submitted. The brief for this port says "projects in pre-second-pass states", and that is what is done: a ship
// that is submitted or in first-pass review (ROBERT_SUBMIT_STATES) goes to Telescreen, so the score is usually there by the time a
// final reviewer opens it. Pixl is narrower: it sends a project only after its first pass approves it (status fraud_review), so
// Robert's reviewers never see a ship that first pass bounces. LOADOUT has no parking state between first and second pass, so the
// narrow rule would race the human triage; the wide rule trades some Telescreen workload for an earlier score. If that workload
// matters, narrow ROBERT_SUBMIT_STATES to ["second-pass"] and add the triage/first-pass conditions to isRobertCandidate; both are
// in this file and nothing else depends on them. Hardware is never sent automatically: Pixl sends it by hand only, because its
// journal needs a person's judgement.
//
// What is written. Every state change is a new FraudCheck row (checks.ts is append-only):
//   pending   submitted; detail carries externalId and Robert's own project id
//   cleared   scored above 4
//   flagged   scored 4 or less (Robert's fraud band)
//   error     the submit failed; detail carries the attempt count and Robert's answer, retried up to ROBERT_MAX_ATTEMPTS
// Polling reads the pending rows themselves, not the ship's current status, so a ship that has moved on to a verdict still gets its
// score recorded. The ship is never touched, and nothing is written back to Robert.
//
// Unset LOADOUT_TELESCREEN_URL or LOADOUT_TELESCREEN_KEY: the run answers { disabled: true } and does nothing else.
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { db } from "../db";
import { kindOfTrack } from "../review-decisions";
import { robertConfig, type Env } from "./config";
import { latestPerKind, recordCheck, type CheckStore } from "./checks";
import { fetchScoredProjects, robertExternalId, submitProject, type FetchImpl } from "./robert";
import { verdictFor } from "./robert-outcome";

export const ROBERT_SUBMIT_STATES = ["submitted", "in-review", "in_review"] as const;
export const ROBERT_MAX_ATTEMPTS = 5;
export const ROBERT_RETRY_GAP_MS = 15 * 60_000;
export const ROBERT_SUBMIT_BATCH = 50;
const NOTE_MAX = 2000;

type Store = Pick<PrismaClient, "fraudCheck" | "project" | "hackatimeProject">;

export type RobertSyncDeps = { env?: Env; fetch?: FetchImpl; now?: () => Date; client?: Store };

export type RobertSyncSummary =
  | { disabled: true }
  | { disabled: false; candidates: number; submitted: number; submitFailed: number; skipped: number; pending: number; scored: number; writeFailed: number };

// Pure: whether a ship is one the sync sends. Status spellings vary (in_review, in-review), so the word is canonicalised first.
export function isRobertCandidate(ship: { status: string; track: string | null }): boolean {
  const status = ship.status.trim().toLowerCase().replace(/_/g, "-");
  return (ROBERT_SUBMIT_STATES as readonly string[]).some((s) => s.replace(/_/g, "-") === status) && kindOfTrack(ship.track) === "software";
}

type RobertDetail = { externalId?: string; robertProjectId?: string; attempts?: number };
const detailOf = (value: unknown): RobertDetail => (value && typeof value === "object" && !Array.isArray(value) ? (value as RobertDetail) : {});

// Whether this ship needs a (re)submission, given its newest Robert row. Pure, so the retry rules are testable.
export function needsSubmission(
  latest: { status: string; checkedAt: Date; detail: unknown } | null,
  externalId: string,
  now: Date,
): { submit: false } | { submit: true; attempts: number } {
  if (!latest) return { submit: true, attempts: 1 };
  const detail = detailOf(latest.detail);
  // A different external id means the ship was submitted again since (a re-ship), which is a new Robert record.
  if (detail.externalId !== externalId) return { submit: true, attempts: 1 };
  if (latest.status !== "error") return { submit: false };
  const attempts = (Number.isFinite(detail.attempts) ? Number(detail.attempts) : 1) + 1;
  if (attempts > ROBERT_MAX_ATTEMPTS) return { submit: false };
  if (now.getTime() - latest.checkedAt.getTime() < ROBERT_RETRY_GAP_MS) return { submit: false };
  return { submit: true, attempts };
}

export async function syncRobert(deps: RobertSyncDeps = {}): Promise<RobertSyncSummary> {
  const config = robertConfig(deps.env ?? process.env);
  if (!config) return { disabled: true };
  const client: Store = deps.client ?? db();
  const now = (deps.now ?? (() => new Date()))();
  const net = { fetch: deps.fetch };
  const summary = { candidates: 0, submitted: 0, submitFailed: 0, skipped: 0, pending: 0, scored: 0, writeFailed: 0 };

  // ---- Submit ----
  const waiting = await client.project.findMany({
    where: { status: { in: [...ROBERT_SUBMIT_STATES] }, submittedAt: { not: null } },
    select: { id: true, seq: true, title: true, status: true, track: true, repoUrl: true, demoUrl: true, submittedAt: true, ownerId: true, owner: { select: { slackId: true } } },
    orderBy: { submittedAt: "asc" },
    take: 200,
  });
  summary.candidates = waiting.length;
  let sent = 0;
  for (const ship of waiting) {
    if (!isRobertCandidate(ship)) {
      summary.skipped += 1;
      continue;
    }
    const externalId = robertExternalId(ship.seq, ship.submittedAt);
    const latest = await client.fraudCheck.findFirst({ where: { projectId: ship.id, kind: "robert" }, orderBy: { checkedAt: "desc" } });
    const plan = needsSubmission(latest, externalId, now);
    if (!plan.submit || sent >= ROBERT_SUBMIT_BATCH) {
      summary.skipped += 1;
      continue;
    }
    sent += 1;
    const names = await client.hackatimeProject.findMany({ where: { projectId: ship.id, personId: ship.ownerId }, select: { name: true } });
    const result = await submitProject(
      config,
      { seq: ship.seq, name: ship.title, kind: "software", codeUrl: ship.repoUrl, demoUrl: ship.demoUrl, hackatimeProjects: names.map((n) => n.name), journal: [], submittedAt: ship.submittedAt },
      { slackId: ship.owner.slackId },
      net,
    );
    if (result.ok) {
      summary.submitted += 1;
      const written = await recordCheck(
        { projectId: ship.id, kind: "robert", status: "pending", summary: "Sent to Telescreen; waiting for its fraud score.", detail: { externalId, robertProjectId: result.robertProjectId, attempts: plan.attempts } },
        client as CheckStore,
      );
      if (!written.ok) summary.writeFailed += 1;
    } else {
      summary.submitFailed += 1;
      const written = await recordCheck(
        { projectId: ship.id, kind: "robert", status: "error", summary: "Could not send this ship to Telescreen; it will be tried again.", detail: { externalId, attempts: plan.attempts, error: result.error } },
        client as CheckStore,
      );
      if (!written.ok) summary.writeFailed += 1;
    }
  }

  // ---- Poll ----
  // The newest Robert row of every project, then the ones still pending. Newest first and capped: a project is listed once.
  const recent = await client.fraudCheck.findMany({ where: { kind: "robert" }, orderBy: { checkedAt: "desc" }, take: 1000 });
  const byProject = new Map<string, typeof recent>();
  for (const row of recent) byProject.set(row.projectId, [...(byProject.get(row.projectId) ?? []), row]);
  const pending = [...byProject.values()].map((rows) => latestPerKind(rows)[0]).filter((row) => row && row.status === "pending");
  summary.pending = pending.length;
  if (pending.length > 0) {
    const scored = await fetchScoredProjects(config, net);
    const byExternalId = new Map(scored.filter((p) => p.externalId).map((p) => [p.externalId as string, p]));
    for (const row of pending) {
      const detail = detailOf(row.detail);
      const remote = detail.externalId ? byExternalId.get(detail.externalId) : undefined;
      if (!remote?.review) continue;
      const verdict = verdictFor({ trustScore: remote.review.trustScore, note: remote.review.note ?? "", reviewedAt: remote.review.at, robertState: remote.state });
      if (!verdict) continue;
      const stored: Prisma.InputJsonValue = {
        externalId: detail.externalId ?? null,
        robertProjectId: detail.robertProjectId ?? remote.id ?? null,
        robertState: remote.state,
        reviewedAt: remote.review.at,
        // Robert's reviewer wrote this. It is shown to reviewers as plain text and never copied into the summary or any field a
        // builder can read.
        note: String(remote.review.note ?? "").slice(0, NOTE_MAX),
      };
      const written = await recordCheck({ projectId: row.projectId, kind: "robert", status: verdict.status, score: verdict.score, summary: verdict.summary, detail: stored }, client as CheckStore);
      if (written.ok) summary.scored += 1;
      else summary.writeFailed += 1;
    }
  }
  return { disabled: false, ...summary };
}
