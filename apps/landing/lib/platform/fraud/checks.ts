// FraudCheck: the evidence rows that the automated fraud and verification checks leave for the review desk. Pixl keeps the same
// facts as columns on its projects row (ai_review_*, robert_*, system_note) and lets the automation move the project; LOADOUT keeps
// them apart on purpose. A check only ever writes a row here. It never writes a verdict, a status or a triage field onto Project:
// "flagged" means "a reviewer should look closely", never "this ship is refused". The desk's decision stays a human one, written to
// the project by lib/platform/review-actions.ts.
//
// The table is append-only. A pending Robert submission that later gets its score is a NEW row, not an update of the pending one,
// so the history of what the machines said and when is never rewritten. The reader gives the newest row per (project, kind).
// Two writers racing on one project can both pass the transition check; the later row simply wins as "latest", which is the
// right answer for an evidence log, so no lock is taken.
//
// API:
//   FRAUD_KINDS / FRAUD_STATUSES             the allowed words (the column is plain text, so the words are held here)
//   canTransition(from, to)                  pure: may a row with status `to` follow one with status `from` (null: none yet)
//   latestPerKind(rows)                      pure: newest row of each kind, in FRAUD_KINDS order
//   clampSummary(text)                       pure: one line, at most SUMMARY_MAX characters
//   recordCheck(input, client?)              append one row; refuses unknown words and a refused transition
//   listChecks(projectId, client?)           every row of one project, newest first
//   latestChecks(projectId, client?)         the newest row per kind
//   latestCheck(projectId, kind, client?)    the newest row of one kind, or null
//   latestChecksForSeq(seq, client?)         the same by the desk's number (Project.seq); [] when the database is not configured
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { databaseConfigured, db } from "../db";

export const FRAUD_KINDS = ["precheck", "robert", "fraudy", "double-dip"] as const;
export type FraudKind = (typeof FRAUD_KINDS)[number];

export const FRAUD_STATUSES = ["pending", "cleared", "flagged", "error", "dismissed"] as const;
export type FraudStatus = (typeof FRAUD_STATUSES)[number];

export const SUMMARY_MAX = 300;

export const isFraudKind = (value: unknown): value is FraudKind => typeof value === "string" && (FRAUD_KINDS as readonly string[]).includes(value);
export const isFraudStatus = (value: unknown): value is FraudStatus => typeof value === "string" && (FRAUD_STATUSES as readonly string[]).includes(value);

// What may follow what. A check starts as pending (it was asked for, no answer yet) or goes straight to an answer, and any row may
// be followed by a fresh run: a re-ship asks again, and a second pending row after a hung first try is how an attempt is counted.
// Not repeating work is the sweeps' job (needsSubmission, needsPrecheck), not this table's. The one wall is "dismissed", which is a
// person's word on a flagged or failed row, so it cannot come out of nothing, out of a pending row or out of a row that was never
// a problem.
export function canTransition(from: FraudStatus | null, to: FraudStatus): boolean {
  if (to === "dismissed") return from === "flagged" || from === "error";
  return true;
}

export type CheckRow = {
  id: string;
  projectId: string;
  kind: string;
  status: string;
  score: number | null;
  summary: string | null;
  detail: unknown;
  checkedAt: Date;
};

export function latestPerKind<T extends { kind: string; checkedAt: Date }>(rows: readonly T[]): T[] {
  const best = new Map<string, T>();
  for (const row of rows) {
    const held = best.get(row.kind);
    if (!held || row.checkedAt.getTime() >= held.checkedAt.getTime()) best.set(row.kind, row);
  }
  const rank = (kind: string) => {
    const at = (FRAUD_KINDS as readonly string[]).indexOf(kind);
    return at === -1 ? FRAUD_KINDS.length : at;
  };
  return [...best.values()].sort((a, b) => rank(a.kind) - rank(b.kind));
}

export function clampSummary(text: string): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length <= SUMMARY_MAX ? one : `${one.slice(0, SUMMARY_MAX - 1).trimEnd()}…`;
}

export type RecordInput = {
  projectId: string;
  kind: FraudKind;
  status: FraudStatus;
  score?: number | null;
  summary?: string | null;
  detail?: Prisma.InputJsonValue | null;
  checkedAt?: Date;
};

export type RecordResult = { ok: true; row: CheckRow } | { ok: false; reason: "unknown_kind" | "unknown_status" | "bad_transition" | "bad_score" };

// The narrow slice of the Prisma client this file needs, so a test can hand in a fake and the data helpers share one shape.
export type CheckStore = Pick<PrismaClient, "fraudCheck" | "project">;

export async function recordCheck(input: RecordInput, client: CheckStore = db()): Promise<RecordResult> {
  if (!isFraudKind(input.kind)) return { ok: false, reason: "unknown_kind" };
  if (!isFraudStatus(input.status)) return { ok: false, reason: "unknown_status" };
  const score = input.score ?? null;
  if (score !== null && !(Number.isInteger(score) && score >= 0 && score <= 100)) return { ok: false, reason: "bad_score" };
  const latest = await client.fraudCheck.findFirst({ where: { projectId: input.projectId, kind: input.kind }, orderBy: { checkedAt: "desc" } });
  const from = latest && isFraudStatus(latest.status) ? latest.status : null;
  if (!canTransition(from, input.status)) return { ok: false, reason: "bad_transition" };
  const row = await client.fraudCheck.create({
    data: {
      projectId: input.projectId,
      kind: input.kind,
      status: input.status,
      score,
      summary: input.summary == null ? null : clampSummary(input.summary),
      // Left out, the column stays NULL (Prisma refuses a bare null for a Json column).
      detail: input.detail == null ? undefined : input.detail,
      ...(input.checkedAt ? { checkedAt: input.checkedAt } : {}),
    },
  });
  return { ok: true, row };
}

export async function listChecks(projectId: string, client: CheckStore = db()): Promise<CheckRow[]> {
  return client.fraudCheck.findMany({ where: { projectId }, orderBy: { checkedAt: "desc" } });
}

export async function latestChecks(projectId: string, client: CheckStore = db()): Promise<CheckRow[]> {
  return latestPerKind(await listChecks(projectId, client));
}

export async function latestCheck(projectId: string, kind: FraudKind, client: CheckStore = db()): Promise<CheckRow | null> {
  return client.fraudCheck.findFirst({ where: { projectId, kind }, orderBy: { checkedAt: "desc" } });
}

// The review desk addresses a real ship by Project.seq, not by the cuid the rows carry. Reading never throws into a page: with no
// database, an unknown seq or a failed query the answer is "no checks", which the panel shows as nothing at all.
export async function latestChecksForSeq(seq: number, client?: CheckStore): Promise<CheckRow[]> {
  if (!client && !databaseConfigured()) return [];
  try {
    const store = client ?? db();
    const project = await store.project.findUnique({ where: { seq }, select: { id: true } });
    return project ? await latestChecks(project.id, store) : [];
  } catch {
    return [];
  }
}
