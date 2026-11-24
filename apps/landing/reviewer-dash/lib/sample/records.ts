// The records and team-content adapters of the reviewer site: guidelines acknowledgement, reviewer payouts, age exceptions, erasure
// requests (records only, nothing is deleted here), self-review exceptions, the ships snapshot, news, polls and votes. The rules and the
// database writes are in lib/platform/records-data.ts and content-data.ts; this file picks the rows. Re-exported from lib/db.ts.
//
// Database first. The sample answers only in development with an empty table (sampleFallbackAllowed), so a production table that is
// empty stays empty. Writes need a signed-in person: their Person id is what the database keeps, never the sample handle.
import { databaseConfigured, db } from "@/lib/platform/db";
import * as content from "@/lib/platform/content-data";
import * as records from "@/lib/platform/records-data";
import { readViewer } from "@/lib/platform/session";
import { AGE_EXCEPTIONS } from "@/lib/reviewer/desk/records-fixtures";
import { normaliseHandle } from "@/lib/reviewer/desk/records-erasure";
import type { PayoutTotals } from "../db";
import { handleFor } from "../session";
import { store } from "./store";

const sampleAllowed = (rowCount: number): boolean => records.sampleFallbackAllowed({ nodeEnv: process.env.NODE_ENV, rowCount });

// The signed-in person's Person id, when the signed-in staff member is the one the session handle names. The handle is the sample id.
async function signedInPersonId(slackId: string): Promise<string | null> {
  const viewer = await readViewer();
  if (!viewer?.access) return null;
  return handleFor(viewer.access, viewer.displayName) === slackId ? viewer.id : null;
}

async function signedInViewerId(): Promise<string> {
  const viewer = await readViewer();
  if (!viewer?.access) throw new Error("Sign in again to save this.");
  return viewer.id;
}

function requireDatabase(): void {
  if (!databaseConfigured()) throw new Error("No database is connected, so nothing was saved.");
}

// ---- Guidelines acknowledgement (lib/guard.ts requireGuidelinesAck) ----

// The highest guidelines version the reviewer has acknowledged, or null. Sample reviewers start with every version read.
export async function getGuidelinesAck(slackId: string): Promise<number | null> {
  const total = databaseConfigured() ? await db().guidelinesAck.count() : 0;
  if (sampleAllowed(total)) return store.ackedGuidelines.get(slackId) ?? Number.MAX_SAFE_INTEGER;
  if (!databaseConfigured()) return null;
  const personId = await signedInPersonId(slackId);
  if (!personId) return null;
  return records.highestGuidelinesVersion(await records.guidelinesAcknowledged(personId));
}

export async function ackGuidelines(slackId: string, version: number): Promise<void> {
  if (!databaseConfigured()) {
    // Without a database the acknowledgement is kept in the sample store in development only.
    if (process.env.NODE_ENV !== "development") requireDatabase();
    store.ackedGuidelines.set(slackId, version);
    return;
  }
  const personId = await signedInPersonId(slackId);
  if (!personId) throw new Error("Sign in again to acknowledge the guidelines.");
  await records.acknowledgeGuidelines(personId, String(version));
}

// ---- Reviewer payouts (the Pay page and the budget's paid reviews) ----

// Keyed by the reviewer's Person id, in Ore: earnedPixels is paid plus pending, and cut is always 0 (LOADOUT takes no cut).
// The sample has no payouts, so an empty table answers an empty map in every environment.
export async function payoutTotalsBySlackId(): Promise<Map<string, PayoutTotals>> {
  if (!databaseConfigured()) return new Map();
  const rows = await db().reviewPayout.count();
  if (rows === 0) return new Map();
  const totals = await records.reviewerPayoutTotalsFromDb();
  return new Map(
    [...totals].map(([id, t]) => [id, { earnedPixels: t.paidOre + t.pendingOre, paid: t.paidOre, pending: t.pendingOre, cut: 0 }]),
  );
}

export async function logReviewerPayout(input: { reviewerId: string; projectId: string | null; kind: string; amountOre: number }): Promise<{ id: string }> {
  requireDatabase();
  const row = await records.createReviewPayout(input, await signedInViewerId());
  return { id: row.id };
}

export async function markReviewerPayoutPaid(id: string): Promise<void> {
  requireDatabase();
  await records.markReviewPayoutPaid(id, await signedInViewerId());
}

// ---- Age exceptions (the Records page; owner only) ----

export async function listAgeExceptions(): Promise<{ id: string; handle: string; ship: string; justification: string }[]> {
  const total = databaseConfigured() ? await db().ageException.count() : 0;
  if (sampleAllowed(total)) return AGE_EXCEPTIONS.map((row) => ({ ...row }));
  if (!databaseConfigured()) return [];
  return records.listAgeExceptions();
}

export async function addAgeException(handle: string, justification: string, projectId: string | null): Promise<{ id: string }> {
  requireDatabase();
  return records.grantAgeException(normaliseHandle(handle), justification, await signedInViewerId(), projectId);
}

// ---- Erasure requests (records only: a request waits seven days, and nothing here deletes data) ----

export async function listErasureRequests(): Promise<Awaited<ReturnType<typeof records.listErasureRequests>>> {
  if (!databaseConfigured()) return [];
  return records.listErasureRequests();
}

export async function requestErasureFor(handle: string): Promise<{ id: string; scheduledFor: Date }> {
  requireDatabase();
  const person = await db().person.findUnique({ where: { handle: normaliseHandle(handle) }, select: { id: true } });
  if (!person) throw new Error("No builder has that handle.");
  return records.requestErasure(person.id, await signedInViewerId());
}

export async function cancelErasureRequest(id: string): Promise<void> {
  requireDatabase();
  await records.cancelErasure(id, await signedInViewerId());
}

// ---- Self-review exceptions (time-limited; the review gate does not consult these yet) ----

export async function selfReviewExceptionsFor(personId: string) {
  if (!databaseConfigured()) return [];
  return records.activeSelfReviewExceptions(personId);
}

// ---- Ships snapshot (counts by name, recorded with a timestamp) ----

export async function recordShipsCounts(counts: unknown): Promise<{ id: string }> {
  requireDatabase();
  return records.recordShipsSnapshot(counts);
}

export async function latestShipsCounts() {
  if (!databaseConfigured()) return null;
  return records.latestShipsSnapshot();
}

// ---- News, polls and votes ----

export async function listNewsItems(limit = 50) {
  if (!databaseConfigured()) return [];
  return content.listNews(limit);
}

export async function publishNews(input: { title: string; body: string }): Promise<{ id: string }> {
  requireDatabase();
  return content.createNews(input, await signedInViewerId());
}

export async function listPollRows(limit = 50) {
  if (!databaseConfigured()) return [];
  return content.listPolls(limit);
}

export async function createPollRow(input: { question: string; options: string[]; closesAt: Date | null }): Promise<{ id: string }> {
  requireDatabase();
  return content.createPoll(input, await signedInViewerId());
}

// One vote per person, refused a second time by the database (see content.castPollVote).
export async function votePoll(pollId: string, option: number): Promise<void> {
  requireDatabase();
  await content.castPollVote(pollId, await signedInViewerId(), option);
}
