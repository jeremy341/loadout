// Records domain for the reviewer site: review payouts, guidelines acknowledgement, self-review exceptions, the ships snapshot,
// erasure requests and age exceptions. The pure rules come first and need no database (records-data.test.ts). The Prisma functions
// below them are thin: each write runs in one transaction with its AuditEvent (lib/platform/audit.ts). Nothing here executes an
// erasure; it records the request and lists the ones that are due.
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { USD_PER_TEN_ORE } from "./review";
import { checkException } from "../reviewer/desk/records-age";
import { normaliseHandle } from "../reviewer/desk/records-erasure";

// ---- Pure rules ----

export const ERASURE_DELAY_MS = 7 * 24 * 60 * 60 * 1000;
export const SHIP_COUNT_KEY_MAX = 40;
export const SHIP_COUNT_KEYS_MAX = 50;
export const ACK_VERSION_MAX = 40;

export type Check = { ok: true } | { ok: false; reason: string };

// Sample data falls back in only when the table is empty AND the server runs in development. Production shows the real list,
// even when it is empty.
export function sampleFallbackAllowed(input: { nodeEnv: string | undefined; rowCount: number }): boolean {
  return input.nodeEnv === "development" && input.rowCount === 0;
}

// Ore are whole and positive. Cents come from the total, converted once: 4.35 USD per ten Ore (lib/platform/review.ts).
export function payoutCents(ore: number): number {
  return Math.round(ore * USD_PER_TEN_ORE * 10);
}

export function checkPayoutAmount(ore: unknown): Check {
  if (typeof ore !== "number" || !Number.isSafeInteger(ore) || ore <= 0) return { ok: false, reason: "Enter a whole number of Ore above zero." };
  return { ok: true };
}

export function checkPayoutKind(kind: unknown): Check {
  const text = typeof kind === "string" ? kind.trim() : "";
  if (!text) return { ok: false, reason: "Name what the payout is for." };
  if (text.length > 80) return { ok: false, reason: "Keep the payout name under 80 characters." };
  return { ok: true };
}

export type PayoutRowLike = { reviewerId: string; status: string; amountOre: number };
export type ReviewerPayoutTotal = { paidOre: number; pendingOre: number; paidUsdCents: number; pendingUsdCents: number };

// Sums Ore per reviewer and status first, then converts to cents once. Cancelled rows count for nothing.
export function reviewerPayoutTotals(rows: readonly PayoutRowLike[]): Map<string, ReviewerPayoutTotal> {
  const totals = new Map<string, { paid: number; pending: number }>();
  for (const row of rows) {
    if (row.status !== "paid" && row.status !== "pending") continue;
    const have = totals.get(row.reviewerId) ?? { paid: 0, pending: 0 };
    if (row.status === "paid") have.paid += row.amountOre;
    else have.pending += row.amountOre;
    totals.set(row.reviewerId, have);
  }
  return new Map(
    [...totals.entries()].map(([id, sum]) => [
      id,
      { paidOre: sum.paid, pendingOre: sum.pending, paidUsdCents: payoutCents(sum.paid), pendingUsdCents: payoutCents(sum.pending) },
    ]),
  );
}

export function checkGuidelinesVersion(version: unknown): Check {
  const text = typeof version === "string" ? version.trim() : "";
  if (!text || text.length > ACK_VERSION_MAX) return { ok: false, reason: "Name the guidelines version." };
  return { ok: true };
}

// Whether the reviewer has read this version. Each version is acknowledged on its own.
export function hasAcknowledged(acknowledged: readonly string[], version: string): boolean {
  return acknowledged.includes(version);
}

// The guard compares a number (lib/guidelines.ts), the table keeps the version as text. The highest numeric version acknowledged is what
// counts, so a reviewer who acknowledged version 2 is fine for a required version 1. Text that is not a whole number is ignored.
export function highestGuidelinesVersion(versions: readonly string[]): number | null {
  let highest: number | null = null;
  for (const text of versions) {
    const value = Number(text.trim());
    if (!Number.isSafeInteger(value) || value < 0) continue;
    if (highest === null || value > highest) highest = value;
  }
  return highest;
}

// Per reviewer: how many payouts are paid and how many are pending, and their Ore. Cancelled rows count for nothing. Counts are the
// reviewer's payouts (one payout is one counted review when the desk logs it that way).
export function payoutCountsByReviewer(rows: readonly { reviewerId: string; status: string; amountOre: number }[]): Map<string, { paid: number; pending: number; paidOre: number; pendingOre: number }> {
  const out = new Map<string, { paid: number; pending: number; paidOre: number; pendingOre: number }>();
  for (const row of rows) {
    if (row.status !== "paid" && row.status !== "pending") continue;
    const have = out.get(row.reviewerId) ?? { paid: 0, pending: 0, paidOre: 0, pendingOre: 0 };
    if (row.status === "paid") {
      have.paid += 1;
      have.paidOre += row.amountOre;
    } else {
      have.pending += 1;
      have.pendingOre += row.amountOre;
    }
    out.set(row.reviewerId, have);
  }
  return out;
}

// A self-review exception is time-limited: the end time is required, must be in the future, and the reason uses the staff rule.
export function checkSelfReviewGrant(draft: { reason: unknown; expiresAt: Date | null }, now: Date): Check {
  const reason = checkReason(draft.reason);
  if (!reason.ok) return { ok: false, reason: reason.message };
  if (!draft.expiresAt || Number.isNaN(draft.expiresAt.getTime())) {
    return { ok: false, reason: "Set an end time. A self-review exception cannot be open-ended." };
  }
  if (draft.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "The end time must be in the future." };
  return { ok: true };
}

export function isSelfReviewActive(row: { expiresAt: Date }, now: Date): boolean {
  return row.expiresAt.getTime() > now.getTime();
}

// Ships snapshot: a flat object of counts by name, each a non-negative whole number.
export function validShipCounts(raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length === 0 || entries.length > SHIP_COUNT_KEYS_MAX) return null;
  const out: Record<string, number> = {};
  for (const [key, value] of entries) {
    if (!key || key.length > SHIP_COUNT_KEY_MAX) return null;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return null;
    out[key] = value;
  }
  return out;
}

export function erasureScheduledFor(requestedAt: Date): Date {
  return new Date(requestedAt.getTime() + ERASURE_DELAY_MS);
}

// A request is due once its scheduled time has passed while it is still open. Due is the deletion job's cue; this module never deletes.
export function isErasureDue(row: { status: string; scheduledFor: Date }, now: Date): boolean {
  return row.status === "requested" && row.scheduledFor.getTime() <= now.getTime();
}

// Cancel is allowed only while the request is open and not yet due. Once the scheduled time passes, the deletion may run, so it is refused.
export function canCancelErasure(row: { status: string; scheduledFor: Date }, now: Date): boolean {
  return row.status === "requested" && now.getTime() < row.scheduledFor.getTime();
}

export type AgeExceptionRowLike = { id: string; reason: string; projectId?: string | null; person: { handle: string | null } };
// The page shape keeps `ship`: the project the exception is for, or empty when it is not for one project.
export function ageExceptionFromRow(row: AgeExceptionRowLike): { id: string; handle: string; ship: string; justification: string } {
  return { id: row.id, handle: row.person.handle ?? "", ship: row.projectId ?? "", justification: row.reason };
}

export function checkAgeExceptionDraft(handle: string, justification: string, existing: readonly { handle: string }[]): Check {
  const result = checkException({ handle, justification }, existing);
  return result.ok ? { ok: true } : { ok: false, reason: result.reason };
}

// ---- Database ----

export type ReviewPayoutRow = {
  id: string;
  reviewerId: string;
  projectId: string | null;
  kind: string;
  amountOre: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
};

export async function createReviewPayout(
  input: { reviewerId: string; projectId: string | null; kind: string; amountOre: number },
  actorId: string,
): Promise<ReviewPayoutRow> {
  const amount = checkPayoutAmount(input.amountOre);
  if (!amount.ok) throw new Error(amount.reason);
  const kind = checkPayoutKind(input.kind);
  if (!kind.ok) throw new Error(kind.reason);
  const name = input.kind.trim();
  return db().$transaction(async (tx) => {
    const row = await tx.reviewPayout.create({
      data: { reviewerId: input.reviewerId, projectId: input.projectId, kind: name, amountOre: input.amountOre },
    });
    await recordAudit(tx, {
      actorId,
      action: "review_payout.create",
      targetType: "review_payout",
      targetId: row.id,
      reason: "Staff logged a reviewer payout on the Pay page.",
      after: { reviewerId: row.reviewerId, kind: row.kind, amountOre: row.amountOre },
    });
    return row;
  });
}

export async function markReviewPayoutPaid(id: string, actorId: string, now: Date = new Date()): Promise<ReviewPayoutRow> {
  return db().$transaction(async (tx) => {
    const row = await tx.reviewPayout.findUnique({ where: { id } });
    if (!row) throw new Error("That payout does not exist.");
    if (row.status !== "pending") throw new Error("Only a pending payout can be marked paid.");
    const updated = await tx.reviewPayout.update({ where: { id }, data: { status: "paid", paidAt: now } });
    await recordAudit(tx, {
      actorId,
      action: "review_payout.mark_paid",
      targetType: "review_payout",
      targetId: id,
      reason: "Staff marked a reviewer payout as paid.",
      before: { status: row.status },
      after: { status: "paid", paidAt: now.toISOString() },
    });
    return updated;
  });
}

export async function listReviewPayouts(limit = 200): Promise<ReviewPayoutRow[]> {
  return db().reviewPayout.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export async function reviewerPayoutTotalsFromDb(): Promise<Map<string, ReviewerPayoutTotal>> {
  const rows = await db().reviewPayout.findMany({ select: { reviewerId: true, status: true, amountOre: true } });
  return reviewerPayoutTotals(rows);
}

export async function acknowledgeGuidelines(personId: string, version: string, now: Date = new Date()): Promise<void> {
  const check = checkGuidelinesVersion(version);
  if (!check.ok) throw new Error(check.reason);
  const v = version.trim();
  await db().$transaction(async (tx) => {
    const existing = await tx.guidelinesAck.findUnique({ where: { personId_version: { personId, version: v } } });
    if (existing) return;
    await tx.guidelinesAck.create({ data: { personId, version: v, ackedAt: now } });
    await recordAudit(tx, {
      actorId: personId,
      action: "guidelines.acknowledge",
      targetType: "person",
      targetId: personId,
      reason: "Reviewer read and acknowledged the guidelines.",
      after: { version: v },
    });
  });
}

export async function guidelinesAcknowledged(personId: string): Promise<string[]> {
  const rows = await db().guidelinesAck.findMany({ where: { personId }, select: { version: true } });
  return rows.map((row) => row.version);
}

export async function grantSelfReviewException(
  input: { personId: string; projectId: string | null; reason: string; expiresAt: Date | null },
  grantedById: string,
  now: Date = new Date(),
): Promise<{ id: string }> {
  const check = checkSelfReviewGrant({ reason: input.reason, expiresAt: input.expiresAt }, now);
  if (!check.ok) throw new Error(check.reason);
  const expiresAt = input.expiresAt as Date;
  const reason = input.reason.trim();
  return db().$transaction(async (tx) => {
    const row = await tx.selfReviewException.create({
      data: { personId: input.personId, projectId: input.projectId, grantedById, reason, expiresAt },
    });
    await recordAudit(tx, {
      actorId: grantedById,
      action: "self_review.grant",
      targetType: "person",
      targetId: input.personId,
      reason,
      after: { projectId: input.projectId, expiresAt: expiresAt.toISOString() },
    });
    return { id: row.id };
  });
}

export async function activeSelfReviewExceptions(personId: string, now: Date = new Date()) {
  return db().selfReviewException.findMany({ where: { personId, expiresAt: { gt: now } }, orderBy: { expiresAt: "asc" } });
}

export async function recordShipsSnapshot(counts: unknown, now: Date = new Date()): Promise<{ id: string }> {
  const valid = validShipCounts(counts);
  if (!valid) throw new Error("The ships counts must be a flat object of whole numbers.");
  return db().$transaction(async (tx) => {
    const row = await tx.shipsSnapshot.create({ data: { takenAt: now, counts: valid } });
    await recordAudit(tx, {
      actorId: "system",
      action: "ships_snapshot.record",
      targetType: "ships_snapshot",
      targetId: row.id,
      reason: "A ships snapshot was recorded with its counts.",
      after: valid,
    });
    return { id: row.id };
  });
}

export async function latestShipsSnapshot() {
  return db().shipsSnapshot.findFirst({ orderBy: { takenAt: "desc" } });
}

// One open request per person. The schema has no unique index, so the check and the create run in one transaction.
export async function requestErasure(personId: string, actorId: string, now: Date = new Date()): Promise<{ id: string; scheduledFor: Date }> {
  return db().$transaction(async (tx) => {
    const open = await tx.erasureRequest.findFirst({ where: { personId, status: "requested" } });
    if (open) throw new Error("This person already has an erasure request waiting.");
    const scheduledFor = erasureScheduledFor(now);
    const row = await tx.erasureRequest.create({ data: { personId, status: "requested", requestedAt: now, scheduledFor } });
    await recordAudit(tx, {
      actorId,
      action: "erasure.request",
      targetType: "person",
      targetId: personId,
      reason: "Staff requested erasure of a person's data; it waits seven days before it can run.",
      after: { requestId: row.id, scheduledFor: scheduledFor.toISOString() },
    });
    return { id: row.id, scheduledFor };
  });
}

export async function cancelErasure(id: string, actorId: string, now: Date = new Date()): Promise<void> {
  await db().$transaction(async (tx) => {
    const row = await tx.erasureRequest.findUnique({ where: { id } });
    if (!row) throw new Error("That erasure request does not exist.");
    if (!canCancelErasure(row, now)) throw new Error("Only a request that is still scheduled can be cancelled.");
    await tx.erasureRequest.update({ where: { id }, data: { status: "cancelled" } });
    await recordAudit(tx, {
      actorId,
      action: "erasure.cancel",
      targetType: "person",
      targetId: row.personId,
      reason: "Staff cancelled a scheduled erasure request.",
      before: { status: row.status },
      after: { status: "cancelled" },
    });
  });
}

// Requests whose scheduled time has passed and that are still open. Running the deletion is a separate job, not this module.
export async function listDueErasures(now: Date = new Date()) {
  return db().erasureRequest.findMany({ where: { status: "requested", scheduledFor: { lte: now } }, orderBy: { scheduledFor: "asc" } });
}

// Every request, newest first, for the records page. Read only.
export async function listErasureRequests(limit = 100) {
  return db().erasureRequest.findMany({ orderBy: { requestedAt: "desc" }, take: limit });
}

// An age exception is for one builder, and optionally for one of their projects (the page's "ship"). The project must exist.
export async function grantAgeException(
  handle: string,
  justification: string,
  grantedById: string,
  projectId: string | null = null,
): Promise<{ id: string }> {
  const key = normaliseHandle(handle);
  const text = justification.trim();
  return db().$transaction(async (tx) => {
    const person = await tx.person.findUnique({ where: { handle: key }, select: { id: true } });
    if (!person) throw new Error("No builder has that handle.");
    const check = checkAgeExceptionDraft(key, text, []);
    if (!check.ok) throw new Error(check.reason);
    const existing = await tx.ageException.findFirst({ where: { personId: person.id }, select: { id: true } });
    if (existing) throw new Error("This handle already has an exception.");
    if (projectId) {
      const project = await tx.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
      if (!project) throw new Error("That project does not exist.");
      if (project.ownerId !== person.id) throw new Error("That project belongs to someone else.");
    }
    const row = await tx.ageException.create({ data: { personId: person.id, grantedById, reason: text, projectId } });
    await recordAudit(tx, {
      actorId: grantedById,
      action: "age_exception.grant",
      targetType: "person",
      targetId: person.id,
      reason: text,
      after: { handle: key, projectId },
    });
    return { id: row.id };
  });
}

export async function listAgeExceptions(): Promise<{ id: string; handle: string; ship: string; justification: string }[]> {
  // AgeException has a personId but no relation to Person, so the handles are read in one second query.
  const rows = await db().ageException.findMany({ orderBy: { createdAt: "asc" } });
  const people = await db().person.findMany({
    where: { id: { in: [...new Set(rows.map((row) => row.personId))] } },
    select: { id: true, handle: true },
  });
  const handles = new Map(people.map((person) => [person.id, person.handle]));
  return rows.map((row) =>
    ageExceptionFromRow({ id: row.id, reason: row.reason, projectId: row.projectId, person: { handle: handles.get(row.personId) ?? null } }),
  );
}
