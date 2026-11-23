// The Robert sync job: submit parked ships to Telescreen, poll for the scores that have come back and record them as FraudCheck rows,
// and move a scored ship on to the second pass. Ported in behaviour from Pixl's apps/internal-dashboard/app/api/cron/robert-sync/
// route.ts and lib/robertSync.ts (submitToRobert, applyReview) at upstream 1468ba6942b13add1ac50e1319541a033ee1df38.
//
// Which ships are submitted: only the ships parked after first-pass approval (PARKED_STATUS, "fraud-review"). A ship that first pass
// bounces never reaches Telescreen, as in Pixl. Hardware is never sent automatically: Pixl sends it by hand only.
//
// What is written. Every Robert state change is a new FraudCheck row (checks.ts is append-only):
//   pending   submitted; detail carries externalId and Robert's own project id
//   cleared   scored above 4
//   flagged   scored 4 or less (Robert's fraud band); this row is the alert the final reviewer reads
//   error     the submit failed; detail carries the attempt count and Robert's answer, retried up to ROBERT_MAX_ATTEMPTS
// Progression is the one status write this job makes: a parked ship with any real score moves to "second-pass". Flagged ships move
// with their alert, as in Pixl — a low score never bans or rejects on its own. The sweep runs every time, so a failed move is retried
// and a ship a person already moved is left alone. Nothing is written back to Robert by this job.
//
// Unset LOADOUT_TELESCREEN_URL or LOADOUT_TELESCREEN_KEY: the run answers { disabled: true } and does nothing else. Parked ships stay
// parked until the job is configured.
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { db } from "../db";
import { PARKED_STATUS } from "../review";
import { kindOfTrack } from "../review-decisions";
import { robertConfig, type Env, type RobertConfig } from "./config";
import { latestPerKind, recordCheck, type CheckStore } from "./checks";
import { fetchScoredProjects, robertExternalId, submitProject, type FetchImpl, type RobertDeps, type RobertProject } from "./robert";
import { scoreMoveFor, verdictFor } from "./robert-outcome";

export const ROBERT_SUBMIT_STATES = [PARKED_STATUS] as const;
export const ROBERT_MAX_ATTEMPTS = 5;
export const ROBERT_RETRY_GAP_MS = 15 * 60_000;
export const ROBERT_SUBMIT_BATCH = 50;
const NOTE_MAX = 2000;

type Store = Pick<PrismaClient, "fraudCheck" | "project" | "hackatimeProject">;

export type RobertSyncDeps = { env?: Env; fetch?: FetchImpl; now?: () => Date; client?: Store };

export type RobertSyncSummary =
  | { disabled: true }
  | { disabled: false; candidates: number; submitted: number; submitFailed: number; skipped: number; pending: number; scored: number; advanced: number; writeFailed: number };

// Pure: whether a ship is one the sync sends: a parked software ship. Status spellings vary (fraud_review, fraud-review), so the word
// is canonicalised first.
export function isRobertCandidate(ship: { status: string; track: string | null }): boolean {
  const status = ship.status.trim().toLowerCase().replace(/_/g, "-");
  return (ROBERT_SUBMIT_STATES as readonly string[]).some((s) => s.replace(/_/g, "-") === status) && kindOfTrack(ship.track) === "software";
}

// The one status move a Robert score makes. A parked ship with any real score moves to the second pass; for a flagged score the
// FraudCheck row is the alert. Only a ship still parked moves, so a ship a person already moved is left alone. Returns whether it moved.
export async function advanceIfScored(client: Store, projectId: string, now: Date): Promise<boolean> {
  const latest = await client.fraudCheck.findFirst({ where: { projectId, kind: "robert" }, orderBy: { checkedAt: "desc" } });
  if (!latest || !advancesOn(latest.status)) return false;
  const moved = await client.project.updateMany({ where: { id: projectId, status: PARKED_STATUS }, data: { status: "second-pass", statusChangedAt: now } });
  return moved.count > 0;
}

// Older callers still import this name; the behaviour is now "advance on any score".
export const advanceIfCleared = advanceIfScored;

const isFraudStatusRow = (status: string): status is "cleared" | "flagged" => status === "cleared" || status === "flagged";
const advancesOn = (status: string): boolean => isFraudStatusRow(status) && scoreMoveFor(status) === "advance";

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

type Counters = { candidates: number; submitted: number; submitFailed: number; skipped: number; pending: number; scored: number; advanced: number; writeFailed: number };
type SyncRun = { config: RobertConfig; client: Store; net: RobertDeps; now: Date; summary: Counters };
type NewCheck = Parameters<typeof recordCheck>[0];

const noCounts = (): Counters => ({ candidates: 0, submitted: 0, submitFailed: 0, skipped: 0, pending: 0, scored: 0, advanced: 0, writeFailed: 0 });

const findWaiting = (client: Store) =>
  client.project.findMany({
    where: { status: { in: [...ROBERT_SUBMIT_STATES] }, submittedAt: { not: null } },
    select: { id: true, seq: true, title: true, status: true, track: true, repoUrl: true, demoUrl: true, submittedAt: true, ownerId: true, owner: { select: { slackId: true } } },
    orderBy: { submittedAt: "asc" },
    take: 200,
  });

type WaitingShip = Awaited<ReturnType<typeof findWaiting>>[number];

const newestRobertRow = (client: Store, projectId: string) => client.fraudCheck.findFirst({ where: { projectId, kind: "robert" }, orderBy: { checkedAt: "desc" } });

// Writes one Robert row and counts a failed write.
async function record(run: SyncRun, input: NewCheck): Promise<boolean> {
  const written = await recordCheck(input, run.client as CheckStore);
  if (!written.ok) run.summary.writeFailed += 1;
  return written.ok;
}

// Sends one ship to Telescreen and records the answer: pending when it was taken, error when it was not.
async function submitShip(run: SyncRun, ship: WaitingShip, externalId: string, attempts: number): Promise<void> {
  const names = await run.client.hackatimeProject.findMany({ where: { projectId: ship.id, personId: ship.ownerId }, select: { name: true } });
  const result = await submitProject(
    run.config,
    { seq: ship.seq, name: ship.title, kind: "software", codeUrl: ship.repoUrl, demoUrl: ship.demoUrl, hackatimeProjects: names.map((n) => n.name), journal: [], submittedAt: ship.submittedAt },
    { slackId: ship.owner.slackId },
    run.net,
  );
  if (result.ok) {
    run.summary.submitted += 1;
    await record(run, { projectId: ship.id, kind: "robert", status: "pending", summary: "Sent to Telescreen; waiting for its fraud score.", detail: { externalId, robertProjectId: result.robertProjectId, attempts } });
    return;
  }
  run.summary.submitFailed += 1;
  await record(run, { projectId: ship.id, kind: "robert", status: "error", summary: "Could not send this ship to Telescreen; it will be tried again.", detail: { externalId, attempts, error: result.error } });
}

// The attempt count a ship is sent with, or null when it is not sent this run.
async function submissionAttempts(run: SyncRun, ship: WaitingShip, externalId: string): Promise<number | null> {
  if (!isRobertCandidate(ship)) return null;
  const plan = needsSubmission(await newestRobertRow(run.client, ship.id), externalId, run.now);
  return plan.submit ? plan.attempts : null;
}

// ---- Submit ----
async function submitWaiting(run: SyncRun): Promise<void> {
  const waiting = await findWaiting(run.client);
  run.summary.candidates = waiting.length;
  let sent = 0;
  for (const ship of waiting) {
    const externalId = robertExternalId(ship.seq, ship.submittedAt);
    // The batch cap is checked after the plan, as before: a ship over the cap still reads its newest row first.
    const attempts = await submissionAttempts(run, ship, externalId);
    if (attempts === null || sent >= ROBERT_SUBMIT_BATCH) {
      run.summary.skipped += 1;
      continue;
    }
    sent += 1;
    await submitShip(run, ship, externalId, attempts);
  }
}

// ---- Poll ----
// The newest Robert row of every project, then the ones still pending. Newest first and capped: a project is listed once.
async function pendingRows(client: Store) {
  const recent = await client.fraudCheck.findMany({ where: { kind: "robert" }, orderBy: { checkedAt: "desc" }, take: 1000 });
  const byProject = new Map<string, typeof recent>();
  for (const row of recent) byProject.set(row.projectId, [...(byProject.get(row.projectId) ?? []), row]);
  return [...byProject.values()].map((rows) => latestPerKind(rows)[0]).filter((row) => row && row.status === "pending");
}

type PendingRow = Awaited<ReturnType<typeof pendingRows>>[number];

// The row to write for a pending ship whose score has come back, or null while there is nothing to record yet.
function scoredCheck(row: PendingRow, byExternalId: Map<string, RobertProject>): NewCheck | null {
  const detail = detailOf(row.detail);
  const remote = detail.externalId ? byExternalId.get(detail.externalId) : undefined;
  if (!remote?.review) return null;
  const verdict = verdictFor({ trustScore: remote.review.trustScore, note: remote.review.note ?? "", reviewedAt: remote.review.at, robertState: remote.state });
  if (!verdict) return null;
  const stored: Prisma.InputJsonValue = {
    externalId: detail.externalId ?? null,
    robertProjectId: detail.robertProjectId ?? remote.id ?? null,
    robertState: remote.state,
    reviewedAt: remote.review.at,
    // Robert's reviewer wrote this. It is shown to reviewers as plain text and never copied into the summary or any field a
    // builder can read.
    note: String(remote.review.note ?? "").slice(0, NOTE_MAX),
  };
  return { projectId: row.projectId, kind: "robert", status: verdict.status, score: verdict.score, summary: verdict.summary, detail: stored };
}

async function pollPending(run: SyncRun): Promise<void> {
  const pending = await pendingRows(run.client);
  run.summary.pending = pending.length;
  if (pending.length === 0) return;
  const scored = await fetchScoredProjects(run.config, run.net);
  const byExternalId = new Map(scored.filter((p) => p.externalId).map((p) => [p.externalId as string, p]));
  for (const row of pending) {
    const check = scoredCheck(row, byExternalId);
    if (check && (await record(run, check))) run.summary.scored += 1;
  }
}

// ---- Advance ----
// Every parked ship with a newest Robert row of cleared or flagged moves on; the flagged row stays as the alert. This runs after
// the poll, so a score written above is moved in the same run, and a failed move is retried here.
async function advanceParked(run: SyncRun): Promise<void> {
  const parked = await run.client.project.findMany({ where: { status: PARKED_STATUS }, select: { id: true }, take: 200 });
  for (const ship of parked) {
    if (await advanceIfScored(run.client, ship.id, run.now)) run.summary.advanced += 1;
  }
}

export async function syncRobert(deps: RobertSyncDeps = {}): Promise<RobertSyncSummary> {
  const config = robertConfig(deps.env ?? process.env);
  if (!config) return { disabled: true };
  const run: SyncRun = { config, client: deps.client ?? db(), net: { fetch: deps.fetch }, now: (deps.now ?? (() => new Date()))(), summary: noCounts() };
  await submitWaiting(run);
  await pollPending(run);
  await advanceParked(run);
  return { disabled: false, ...run.summary };
}
