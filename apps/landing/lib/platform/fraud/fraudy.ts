// Fraudy (fraudy.hackclub.com): an AI-usage check on tracked time. POST check-ai takes a Hackatime user id and one Hackatime project
// and answers with how many seconds were typed by a person, how many by an AI tool, and how much the "AI / 3" rule would take off.
// Ported from Pixl's apps/internal-dashboard/lib/fraudy.ts (fraudyCheckAi, fraudyHours, fraudyCheckKey) at upstream
// 1468ba6942b13add1ac50e1319541a033ee1df38, plus the job that turns the answer into a FraudCheck row.
//
// The credential. Pixl authenticates with one service key (FRAUDY_API_KEY) and names the person by Hackatime id, and so do we:
// LOADOUT_FRAUDY_KEY is the bearer. LOADOUT stores no per-builder Hackatime token (the schema has only HackatimeLink.hackatimeUserId),
// so there is nothing else to send. Fraudy wants an integer id and ours may be any short string, so a builder whose id is not a whole
// number is skipped quietly (no row, no error): there is nothing Fraudy could answer.
//
// What the row says. score is the estimated human share of the tracked time, 0-100. "flagged" means a clear majority of the time was
// AI-assisted (human share under FRAUDY_FLAG_BELOW_PCT); this threshold is LOADOUT's own provisional choice, since Pixl only
// displays the split. The summary is built from numbers only. Nothing in a row changes the ship or the hours that are credited.
//
// Unset LOADOUT_FRAUDY_KEY: the job answers { disabled: true }.
import type { PrismaClient } from "../../generated/prisma/client";
import { db } from "../db";
import { fraudyConfig, type Env, type FraudyConfig } from "./config";
import { recordCheck, type CheckStore } from "./checks";
import type { FetchImpl } from "./robert";

const TIMEOUT_MS = 15_000;
export const FRAUDY_FLAG_BELOW_PCT = 50;
export const FRAUDY_MAX_ATTEMPTS = 3;
export const FRAUDY_RETRY_GAP_MS = 30 * 60_000;
export const FRAUDY_BATCH = 20;
// Fraudy logs every call under the key's owner, so the sweep asks for a bounded number of ships a run.
const FRAUDY_STATES = ["submitted", "in-review", "second-pass", "second_pass", "in_review"] as const;

export type FraudyAiCheck = {
  humanSeconds: number;
  aiSeconds: number;
  /** How much less than the raw total the AI / 3 rule recommends. */
  deflationSeconds: number;
};

export type FraudyDeps = { fetch?: FetchImpl; config?: FraudyConfig | null; env?: Env };

export function fraudyHours(seconds: number): string {
  return (Math.round((seconds / 3600) * 10) / 10).toString();
}

/** Key for a Fraudy result: two people can have a same-named Hackatime project. */
export function fraudyCheckKey(hackatimeId: string | number, project: string): string {
  return `${hackatimeId}:${project}`;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Never throws. No key, an id that is not a whole number, a timeout or an error from Fraudy all just mean "no numbers" (null).
export async function fraudyCheckAi(hackatimeId: string | number, project: string, deps: FraudyDeps = {}): Promise<FraudyAiCheck | null> {
  const config = "config" in deps ? deps.config : fraudyConfig(deps.env ?? process.env);
  const id = Number(hackatimeId);
  if (!config || !Number.isInteger(id) || id <= 0 || !project) return null;
  try {
    const response = await (deps.fetch ?? ((input, init) => fetch(input, init)))(config.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ hackatime_id: id, project }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as Record<string, unknown>;
    return { humanSeconds: num(json.human_seconds), aiSeconds: num(json.ai_seconds), deflationSeconds: num(json.recommended_deflation_seconds) };
  } catch {
    return null;
  }
}

// ---- The row ----

export function addChecks(checks: readonly FraudyAiCheck[]): FraudyAiCheck {
  return checks.reduce((sum, c) => ({ humanSeconds: sum.humanSeconds + c.humanSeconds, aiSeconds: sum.aiSeconds + c.aiSeconds, deflationSeconds: sum.deflationSeconds + c.deflationSeconds }), { humanSeconds: 0, aiSeconds: 0, deflationSeconds: 0 });
}

// null when there is no tracked time to split (a share of nothing is not a number).
export function verdictFromSplit(total: FraudyAiCheck): { status: "cleared" | "flagged"; score: number; summary: string } | null {
  const all = total.humanSeconds + total.aiSeconds;
  if (all <= 0) return null;
  const share = Math.round((total.humanSeconds / all) * 100);
  const split = `${fraudyHours(total.humanSeconds)} h by a person, ${fraudyHours(total.aiSeconds)} h AI-assisted`;
  const take = total.deflationSeconds > 0 ? ` The AI / 3 rule would take off ${fraudyHours(total.deflationSeconds)} h.` : "";
  return share < FRAUDY_FLAG_BELOW_PCT
    ? { status: "flagged", score: share, summary: `Fraudy: about ${share}% of the tracked time looks person-typed (${split}).${take}` }
    : { status: "cleared", score: share, summary: `Fraudy: about ${share}% of the tracked time looks person-typed (${split}).${take}` };
}

type Store = Pick<PrismaClient, "fraudCheck" | "project" | "hackatimeProject" | "hackatimeLink">;
export type FraudySweepDeps = FraudyDeps & { client?: Store; now?: () => Date };
export type FraudySweepSummary = { disabled: true } | { disabled: false; considered: number; checked: number; flagged: number; failed: number; skipped: number; writeFailed: number };

// One ship: ask Fraudy about each linked Hackatime project and add the answers up. Returns the failure count too, so a ship where
// Fraudy answered for only some projects is recorded as an error rather than as a split of part of the time.
export async function checkShip(
  hackatimeUserId: string,
  projectNames: readonly string[],
  deps: FraudyDeps,
): Promise<{ total: FraudyAiCheck; failures: number }> {
  const answers: FraudyAiCheck[] = [];
  let failures = 0;
  for (const name of projectNames) {
    const answer = await fraudyCheckAi(hackatimeUserId, name, deps);
    if (answer) answers.push(answer);
    else failures += 1;
  }
  return { total: addChecks(answers), failures };
}

export async function sweepFraudy(deps: FraudySweepDeps = {}): Promise<FraudySweepSummary> {
  const config = fraudyConfig(deps.env ?? process.env);
  if (!config) return { disabled: true };
  const client: Store = deps.client ?? db();
  const now = (deps.now ?? (() => new Date()))();
  const summary = { considered: 0, checked: 0, flagged: 0, failed: 0, skipped: 0, writeFailed: 0 };

  const ships = await client.project.findMany({
    where: { status: { in: [...FRAUDY_STATES] }, submittedAt: { not: null } },
    select: { id: true, ownerId: true, submittedAt: true },
    orderBy: { submittedAt: "asc" },
    take: 200,
  });
  for (const ship of ships) {
    if (summary.checked + summary.failed >= FRAUDY_BATCH) break;
    summary.considered += 1;
    const submittedAt = ship.submittedAt as Date;
    const rows = await client.fraudCheck.findMany({ where: { projectId: ship.id, kind: "fraudy", checkedAt: { gte: submittedAt } }, orderBy: { checkedAt: "desc" } });
    // Done for this ship (an answer since it was submitted), or out of attempts, or tried too recently.
    if (rows.some((r) => r.status === "cleared" || r.status === "flagged" || r.status === "dismissed")) {
      summary.skipped += 1;
      continue;
    }
    const errors = rows.filter((r) => r.status === "error").length;
    if (errors >= FRAUDY_MAX_ATTEMPTS || (rows[0] && now.getTime() - rows[0].checkedAt.getTime() < FRAUDY_RETRY_GAP_MS)) {
      summary.skipped += 1;
      continue;
    }
    const link = await client.hackatimeLink.findUnique({ where: { personId: ship.ownerId }, select: { hackatimeUserId: true } });
    const names = await client.hackatimeProject.findMany({ where: { projectId: ship.id, personId: ship.ownerId }, select: { name: true } });
    // Nothing Fraudy could answer: no link, an id that is not a whole number, or no Hackatime project mapped. Silent, no row.
    if (!link || !/^[1-9]\d*$/.test(link.hackatimeUserId) || names.length === 0) {
      summary.skipped += 1;
      continue;
    }
    const { total, failures } = await checkShip(link.hackatimeUserId, names.map((n) => n.name), { config, fetch: deps.fetch });
    if (failures > 0) {
      summary.failed += 1;
      const failedRow = await recordCheck({ projectId: ship.id, kind: "fraudy", status: "error", summary: "Fraudy could not be reached for this ship; it will be tried again.", detail: { failures, projects: names.length } }, client as CheckStore);
      if (!failedRow.ok) summary.writeFailed += 1;
      continue;
    }
    const verdict = verdictFromSplit(total);
    if (!verdict) {
      summary.skipped += 1;
      continue;
    }
    summary.checked += 1;
    if (verdict.status === "flagged") summary.flagged += 1;
    const written = await recordCheck(
      { projectId: ship.id, kind: "fraudy", status: verdict.status, score: verdict.score, summary: verdict.summary, detail: { humanSeconds: total.humanSeconds, aiSeconds: total.aiSeconds, deflationSeconds: total.deflationSeconds, projects: names.length } },
      client as CheckStore,
    );
    if (!written.ok) summary.writeFailed += 1;
  }
  return { disabled: false, ...summary };
}
