"use server";

// The review desk's server actions, against the database. Same shape as ship-actions.ts: (previous state, FormData) -> FormState.
// Every action: a signed in reviewer (requireAccess), the ship loaded fresh, the gate from review-decisions.ts (Pixl's
// authorizeProjectAction and verdict gates), then ONE transaction that changes the status and writes the ledger and the audit row
// together. The status change is an updateMany that names the status it expects; when it matches nothing the transaction is
// thrown away (so a ledger row never survives a lost race) and the reviewer sees "changed while you were working".
// Form fields: `ship` (the number the desk shows) or `projectId` (the id), plus what each action lists below.
//   claimShip / pickUpShip       ship
//   releaseClaim                 ship
//   heartbeat                    ship, awayMinutes (5 or more releases the claim)
//   recordTriage                 ship, decision (not-fraud | fraud), note
//   decideJournal                ship, journalId (or journalSeq), action (approve-all | partial | clarify | reject), keptMinutes or hours, reason
//   reviewVerdict                ship, verdict (approved | needs_changes | ban), note, reasonCode, auditNote, repoOpened ...
//   placeHold / releaseHold      ship, reason
//   correctApprovedHours         ship, hours (the corrected approved total), reason
//   unshipProject                ship, reason
//   addReviewNote                ship, body
import { revalidatePath } from "next/cache";
import { parseAuditNote } from "@/reviewer-dash/lib/auditNote";
import type { Prisma } from "../generated/prisma/client";
import type { FormState } from "./actions";
import { checkReason, recordAudit } from "./audit";
import { db } from "./db";
import { checkLedgerEntry, clawbackPlan } from "./ledger";
import { loadDeskShip, minutesOf, type DeskShip } from "./review-data";
import {
  mayAddNote,
  mayClaim,
  mayCorrect,
  mayDecideJournal,
  mayGiveVerdict,
  mayHold,
  mayRelease,
  mayTriage,
  mayUnship,
  NOTE_STATUSES,
  reasonCodeOf,
  stageOf,
  type ReviewActor,
  type VerdictKind,
} from "./review-decisions";
import {
  CLAIM_AWAY_RELEASE_MINUTES,
  CLAIM_LOCK_MINUTES,
  CLAIM_MAX_MINUTES,
  cleanSeconds,
  correctionDelta,
  creditFor,
  journalDecision,
  recordFraudTriage,
  tenthsOfHour,
  turnedNineteenSinceShipping,
  updateShipCredit,
  validateAuditSections,
  verdictEffect,
  type AuditSections,
  type JournalActionKind,
  type JournalForVerdict,
} from "./review-rules";
import { requireAccess } from "./session";

const text = (value: FormDataEntryValue | null): string => (typeof value === "string" ? value : "");
const error = (message: string, field?: string): FormState => ({ status: "error", message, field });
const NOT_FOUND = "That project was not found.";
const CHANGED = "This project changed while you were working. Reload the page and try again.";
const NOTE_MAX = 1000;

class Race extends Error {}

type Tx = Prisma.TransactionClient;

async function context() {
  const viewer = await requireAccess("reviewer");
  const actor: ReviewActor = {
    id: viewer.id,
    isOwner: viewer.access.isOwner,
    isReviewer: viewer.access.isReviewer,
    canSecondPass: viewer.access.canSecondPass,
    reviewQueues: viewer.access.reviewQueues,
  };
  return { viewer, actor };
}

async function shipFrom(formData: FormData): Promise<DeskShip | null> {
  // `ship` or `projectId`: a number is the desk number (Project.seq), anything else is the project id.
  const raw = (text(formData.get("ship")) || text(formData.get("projectId"))).trim();
  if (/^\d+$/.test(raw)) {
    const seq = Number(raw);
    return Number.isSafeInteger(seq) && seq > 0 ? loadDeskShip({ seq }) : null;
  }
  return raw ? loadDeskShip({ id: raw }) : null;
}

function refresh(ship: Pick<DeskShip, "id">) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${ship.id}`);
}

// One Person-row lock for the rest of the transaction, exactly the lock placeOrder takes (orders-data.ts lockPerson). A balance
// read and the ledger write that follows it must not interleave with a shop order or another clawback for the same builder.
async function lockPerson(tx: Tx, personId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "Person" WHERE "id" = ${personId} FOR UPDATE`;
}

// A guarded write that throws when it matched nothing, so the surrounding transaction rolls back.
function must(result: { count: number }): void {
  if (result.count === 0) throw new Race();
}

async function run(work: () => Promise<FormState>): Promise<FormState> {
  try {
    return await work();
  } catch (caught) {
    if (caught instanceof Race) return error(CHANGED);
    throw caught;
  }
}

async function ledgerRow(tx: Tx, input: { personId: string; projectId: string; amountOre: number; status: "pending" | "confirmed"; kind: "approved_hours" | "adjustment"; reason: string; now: Date }) {
  const checked = checkLedgerEntry({ amountOre: input.amountOre, status: input.status, kind: input.kind, reason: input.reason.slice(0, 200) });
  if (!checked.ok) throw new Error(checked.message);
  await tx.ledgerEntry.create({
    data: { personId: input.personId, projectId: input.projectId, amountOre: checked.entry.amountOre, status: checked.entry.status, kind: checked.entry.kind, reason: checked.entry.reason, confirmedAt: input.status === "confirmed" ? input.now : null },
  });
}

// The pending Ore a ship holds is reversed (never edited: the ledger is append-only) when the ship leaves the pipeline or its
// first-pass cycle starts over. The signed sum is reversed, so a leftover of either sign is cleared with a new row.
async function releasePending(tx: Tx, ship: Pick<DeskShip, "id" | "title" | "owner">, why: string, now: Date): Promise<number> {
  why = `${why.replace(/\.$/, "")} (${ship.title}).`;
  const sum = await tx.ledgerEntry.aggregate({ where: { projectId: ship.id, personId: ship.owner.id, status: "pending", kind: { in: ["approved_hours", "adjustment"] } }, _sum: { amountOre: true } });
  const pending = sum._sum.amountOre ?? 0;
  if (pending !== 0) await ledgerRow(tx, { personId: ship.owner.id, projectId: ship.id, amountOre: -pending, status: "pending", kind: "adjustment", reason: why, now });
  return pending;
}

// Minutes as hours to one decimal ("1.7"), the same 0.1 hour rounding the Ore uses, for reasons and notes.
const hoursText = (minutes: number): string => String(tenthsOfHour(minutes) / 10);

const CLEAR_CLAIM = { claimedBy: null, claimedAt: null, claimHeartbeatAt: null } as const;

// Journal decisions in the shape the rules take. An entry approved in an earlier cycle keeps what it was credited.
function forVerdict(ship: DeskShip): JournalForVerdict[] {
  return ship.journals.map((entry) => {
    if (entry.status === "approved" && !entry.reviewAction) return { minutes: entry.minutes, action: "approve-all" as const };
    return { minutes: entry.minutes, action: (entry.reviewAction as JournalActionKind | null) ?? undefined, keptMinutes: entry.keptMinutes ?? undefined };
  });
}

async function audit(tx: Tx, input: { actorId: string; action: string; ship: DeskShip; reason: string; before?: Prisma.InputJsonValue; after?: Prisma.InputJsonValue }) {
  await recordAudit(tx, { actorId: input.actorId, action: input.action, targetType: "project", targetId: input.ship.id, reason: input.reason.slice(0, 500) || "(no note)", before: input.before, after: input.after });
}

// ---- Claims ----

const MAX_ACTIVE_CLAIMS = 10;

// One reviewer cannot park a claim on every ship in the queue. Only live claims count; a heartbeat that keeps refreshing one
// ship must not hide the fact that the reviewer is already holding nine others.
async function activeClaimCount(reviewerId: string, now: Date, excludeShipId: string): Promise<number> {
  const cutoff = new Date(now.getTime() - CLAIM_LOCK_MINUTES * 60_000);
  return db().project.count({
    where: {
      id: { not: excludeShipId },
      claimedBy: reviewerId,
      OR: [{ claimHeartbeatAt: { gte: cutoff } }, { claimHeartbeatAt: null, claimedAt: { gte: cutoff } }],
    },
  });
}

async function claimCapRefusal(actorId: string, shipId: string, now: Date): Promise<string | null> {
  const held = await activeClaimCount(actorId, now, shipId);
  return held >= MAX_ACTIVE_CLAIMS ? `You are already reviewing ${MAX_ACTIVE_CLAIMS} ships. Finish or release one before taking another.` : null;
}

// Claim a ship. A queue ship is picked up (submitted -> in-review) in the same step.
export async function claimShip(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const now = new Date();
  const gate = mayClaim(actor, ship.facts, now);
  if (!gate.ok) return error(gate.message);
  const cap = await claimCapRefusal(actor.id, ship.id, now);
  if (cap) return error(cap);
  if (gate.value.stage === "queue") return pickUp(viewer, ship, now);
  return run(async () => {
    const cutoff = new Date(now.getTime() - CLAIM_LOCK_MINUTES * 60_000);
    await db().$transaction(async (tx) => {
      // The assignment columns from the ship the gate read must still match: a ship reserved for another reviewer after that
      // read cannot be claimed here. The same guard is used by pickUp and heartbeat.
      const result = await tx.project.updateMany({
        where: {
          id: ship.id, status: ship.status, heldAt: null,
          assignedTo: ship.assignedTo, reshippedAt: ship.reshippedAt,
          OR: [{ claimedBy: null }, { claimedBy: actor.id }, { claimedAt: null }, { claimHeartbeatAt: { lt: cutoff } }, { claimHeartbeatAt: null, claimedAt: { lt: cutoff } }],
        },
        data: { claimedBy: actor.id, claimedAt: now, claimHeartbeatAt: now },
      });
      must(result);
      await audit(tx, { actorId: actor.id, action: "review.claim", ship, reason: `Claimed ${ship.title}.`, before: { claimedBy: ship.facts.claimedBy }, after: { claimedBy: actor.id, reviewer: viewer.displayName } });
    });
    refresh(ship);
    return { status: "saved", message: "Saved. You have this ship for 30 minutes." };
  });
}

// submitted -> in-review, one updateMany guarded by the status. A fresh cycle starts: the earlier decisions on entries that were not
// approved before are cleared.
export async function pickUpShip(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const now = new Date();
  const gate = mayClaim(actor, ship.facts, now);
  if (!gate.ok) return error(gate.message);
  const cap = await claimCapRefusal(actor.id, ship.id, now);
  if (cap) return error(cap);
  if (gate.value.stage !== "queue") return error("This project was already picked up.");
  return pickUp(viewer, ship, now);
}

async function pickUp(reviewer: { id: string; displayName: string }, ship: DeskShip, now: Date): Promise<FormState> {
  return run(async () => {
    await db().$transaction(async (tx) => {
      must(
        await tx.project.updateMany({
          // The assignment a re-ship earned is part of the guard: if it changed after the gate read, this write matches nothing.
          where: { id: ship.id, status: "submitted", heldAt: null, assignedTo: ship.assignedTo, reshippedAt: ship.reshippedAt },
          data: { status: "in-review", statusChangedAt: now, claimedBy: reviewer.id, claimedAt: now, claimHeartbeatAt: now, firstPassBy: null, firstPassAt: null, firstPassNote: null, firstPassMinutes: null, triage: null, triageBy: null, triageNote: null, triageAt: null, proposedBanBy: null, proposedBanReason: null },
        }),
      );
      await tx.journalEntry.updateMany({ where: { projectId: ship.id, status: { not: "approved" } }, data: { reviewAction: null, keptMinutes: null, reviewReason: null } });
      // The fresh cycle clears the first-pass recommendation, so any pending Ore left from an earlier one goes with it.
      await releasePending(tx, ship, "Pending Ore released: the review started again.", now);
      await audit(tx, { actorId: reviewer.id, action: "review.pickup", ship, reason: `Picked up ${ship.title}.`, before: { status: "submitted" }, after: { status: "in-review", claimedBy: reviewer.id, reviewer: reviewer.displayName } });
    });
    refresh(ship);
    return { status: "saved", message: "Saved. You picked this ship up and have it for 30 minutes." };
  });
}

export async function releaseClaim(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  return run(async () => {
    await db().$transaction(async (tx) => {
      // A first-pass ship nobody has decided goes back to the queue; a second-pass ship simply loses its lock.
      // The ship leaves first-pass review, so a pending row (there should be none: it is written only when the ship goes to the second
      // pass) is reversed with it. A ship in the second pass keeps its pending Ore: it is still waiting for the final verdict.
      const now = new Date();
      const requeued = await tx.project.updateMany({ where: { id: ship.id, status: "in-review", claimedBy: actor.id }, data: { status: "submitted", statusChangedAt: now, ...CLEAR_CLAIM } });
      if (requeued.count > 0) await releasePending(tx, ship, "Pending Ore released: the ship went back to the queue.", now);
      const unlocked = await tx.project.updateMany({ where: { id: ship.id, status: "second-pass", claimedBy: actor.id }, data: CLEAR_CLAIM });
      if (requeued.count > 0 || unlocked.count > 0) await audit(tx, { actorId: actor.id, action: "review.release_claim", ship, reason: `Released ${ship.title}.`, before: { claimedBy: actor.id, status: ship.status }, after: { released: true, requeued: requeued.count > 0, reviewer: viewer.displayName } });
    });
    refresh(ship);
    return { status: "saved", message: "Saved. You gave this ship up." };
  });
}

// Keeps the claim alive. A reviewer who has been away 5 minutes or more gives it up.
export async function heartbeat(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const away = Number(text(formData.get("awayMinutes")) || 0);
  if (Number.isFinite(away) && away >= CLAIM_AWAY_RELEASE_MINUTES) return releaseClaim({ status: "idle" }, formData);
  const now = new Date();
  const cutoff = new Date(now.getTime() - CLAIM_LOCK_MINUTES * 60_000);
  const deadline = new Date(now.getTime() - CLAIM_MAX_MINUTES * 60_000);
  return run(async () => {
    const ok = await db().$transaction(async (tx) => {
      // Same assignment guard as a claim: a re-ship that changed the reservation after the ship was read cannot be kept alive.
      // claimedAt is also bounded so repeated heartbeats cannot hold one ship forever.
      const result = await tx.project.updateMany({
        where: { id: ship.id, claimedBy: actor.id, claimHeartbeatAt: { gte: cutoff }, claimedAt: { gte: deadline }, assignedTo: ship.assignedTo, reshippedAt: ship.reshippedAt },
        data: { claimHeartbeatAt: now },
      });
      if (result.count === 0) return false;
      await audit(tx, { actorId: actor.id, action: "review.heartbeat", ship, reason: `Heartbeat for ${ship.title}.`, after: { claimHeartbeatAt: now.toISOString(), reviewer: viewer.displayName } });
      return true;
    });
    if (!ok) return error("Your claim has lapsed. Reclaim this ship to keep reviewing.");
    refresh(ship);
    return { status: "saved", message: "Saved." };
  });
}

// ---- Fraud triage (second pass only) ----

export async function recordTriage(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const now = new Date();
  const gate = mayTriage(actor, ship.facts, now);
  if (!gate.ok) return error(gate.message);
  const decision = text(formData.get("decision"));
  const recorded = recordFraudTriage({ decision: decision as "fraud" | "not-fraud", by: actor.id, note: text(formData.get("note")), byIsFinalOrOwner: actor.isOwner || actor.canSecondPass });
  if (!recorded.ok) return error(recorded.message, "note");
  return run(async () => {
    await db().$transaction(async (tx) => {
      must(
        await tx.project.updateMany({
          where: { id: ship.id, status: "second-pass", claimedBy: actor.id, heldAt: null, triage: null },
          data: { triage: recorded.value.triage, triageBy: actor.id, triageNote: recorded.value.note, triageAt: now },
        }),
      );
      await audit(tx, { actorId: actor.id, action: "review.triage", ship, reason: recorded.value.note, before: { triage: ship.triage }, after: { triage: recorded.value.triage, reviewer: viewer.displayName } });
    });
    refresh(ship);
    return { status: "saved", message: `Saved. Triage recorded as ${recorded.value.triage === "fraud" ? "Fraud" : "Not fraud"}.` };
  });
}

// ---- Journal decisions ----

export async function decideJournal(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const gate = mayDecideJournal(actor, ship.facts, new Date());
  if (!gate.ok) return error(gate.message);
  const journalId = text(formData.get("journalId")).trim();
  const journalSeq = Number(text(formData.get("journalSeq")).trim());
  const entry = ship.journals.find((item) => (journalId ? item.id === journalId : item.seq === journalSeq));
  if (!entry) return error("That journal entry was not found on this project.");
  if (entry.status === "approved") return error("This entry was approved in an earlier review, so it can't change.");
  const keptRaw = text(formData.get("keptMinutes")).trim();
  const hoursRaw = text(formData.get("hours")).trim();
  const kept = keptRaw !== "" ? Number(keptRaw) : hoursRaw !== "" ? minutesOf(Number(hoursRaw)) : undefined;
  // The desk's credit box sends hours only: all of it approves, none of it rejects as unverifiable, anything between is a part.
  let action = text(formData.get("action")) as JournalActionKind;
  if (!action && kept !== undefined && Number.isFinite(kept)) action = kept >= entry.minutes ? "approve-all" : kept <= 0 ? "reject" : "partial";
  const decision = journalDecision({ minutes: entry.minutes }, action, kept);
  if (!decision.ok) return error(decision.message, "hours");
  const reason = text(formData.get("reason")).replace(/\s+/g, " ").trim().slice(0, 500);
  if ((action === "reject" || (action === "partial" && decision.value.keptMinutes < entry.minutes) || action === "clarify") && !reason) {
    return error(action === "clarify" ? "Say what you need the builder to clarify." : "Explain why the hours were lowered.", "reason");
  }
  const cut = decision.value.keptMinutes < entry.minutes;
  return run(async () => {
    await db().$transaction(async (tx) => {
      must(
        await tx.journalEntry.updateMany({
          where: { id: entry.id, projectId: ship.id, status: { not: "approved" }, project: { status: ship.status, claimedBy: actor.id, heldAt: null } },
          data: { reviewAction: action, keptMinutes: decision.value.keptMinutes, reviewReason: cut || action === "clarify" ? reason : null },
        }),
      );
      await audit(tx, {
        actorId: actor.id,
        action: "review.journal",
        ship,
        reason: reason || `Journal ${entry.seq}: ${action}, ${decision.value.keptMinutes} minutes kept.`,
        before: { journalSeq: entry.seq, reviewAction: entry.reviewAction, keptMinutes: entry.keptMinutes },
        after: { journalSeq: entry.seq, reviewAction: action, keptMinutes: decision.value.keptMinutes, reviewer: viewer.displayName },
      });
    });
    refresh(ship);
    return { status: "saved", message: "Saved." };
  });
}

// ---- Verdicts ----

function verdictKindOf(raw: string): VerdictKind | null {
  if (raw === "approved" || raw === "approve") return "approve";
  if (raw === "needs_changes" || raw === "needs-changes") return "needs_changes";
  if (raw === "ban" || raw === "banned") return "banned";
  return null;
}

export async function reviewVerdict(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const kind = verdictKindOf(text(formData.get("verdict")));
  if (!kind) return error("That verdict is not known.");
  const note = text(formData.get("note")).replace(/\s+/g, " ").trim();
  if (!note) return error("Feedback is required for every verdict.", "note");
  if (note.length > NOTE_MAX) return error(`Keep the feedback under ${NOTE_MAX} characters.`, "note");
  const now = new Date();
  const plan = mayGiveVerdict(actor, ship.facts, kind, now);
  if (!plan.ok) return error(plan.message);
  const { stage, final, proposal, reroute } = plan.value;
  const reasonCode = reasonCodeOf(formData.get("reasonCode"));
  const journals = forVerdict(ship);
  const effect = reroute ? null : verdictEffect(kind === "approve" ? { kind } : kind === "needs_changes" ? { kind, reason: note, reasonCode } : { kind, reason: note }, journals, { stage: stage === "first-pass" ? "first-pass" : "second-pass", priorApprovedMinutes: ship.approvedMinutes });
  if (effect && !effect.ok) return error(effect.message);
  const keptMinutes = journals.reduce((sum, entry) => {
    const decided = entry.action ? journalDecision({ minutes: entry.minutes }, entry.action, entry.keptMinutes) : null;
    return sum + (decided?.ok ? decided.value.keptMinutes : 0);
  }, 0);
  const auditNoteRaw = text(formData.get("auditNote")).slice(0, 4000);
  if (kind === "approve") {
    const parsed = parseAuditNote(auditNoteRaw);
    const sections: AuditSections = {
      technicalFeatures: parsed["TECHNICAL FEATURES"],
      deflationReason: parsed["DEFLATION REASON"],
      ageJustification: parsed["AGE JUSTIFICATION"],
      notes: parsed.NOTES,
    };
    // Which sections are needed comes from the ship and the decisions, not from the caller: a caller cannot drop the age
    // justification by clearing a flag, or hide a deflation by rebuilding the note without its reason section.
    const checked = validateAuditSections(sections, {
      technicalFeatures: true,
      deflationReason: keptMinutes < ship.claimedMinutes,
      ageJustification: turnedNineteenSinceShipping(ship.owner.birthday, ship.firstShippedAt, now),
      notes: true,
    });
    if (!checked.ok) return error(checked.message, checked.field);
  }
  const credit = updateShipCredit({ priorApprovedMinutes: ship.approvedMinutes, totalMinutes: keptMinutes });
  const evidence = {
    auditNote: auditNoteRaw,
    repoOpened: text(formData.get("repoOpened")) === "1",
    demoOpened: text(formData.get("demoOpened")) === "1",
    // The timers come from the browser: whole seconds, zero to a day, nothing else reaches the audit row.
    repoSeconds: cleanSeconds(text(formData.get("repoSeconds"))),
    demoSeconds: cleanSeconds(text(formData.get("demoSeconds"))),
    totalSeconds: cleanSeconds(text(formData.get("totalSeconds"))),
  };
  const base = { claimedMinutes: ship.claimedMinutes, approvedMinutes: keptMinutes, reviewer: viewer.displayName, ...evidence };
  const guard = { id: ship.id, status: ship.status, claimedBy: actor.id, heldAt: null };
  const reviewedAs = { statusChangedAt: now, ...CLEAR_CLAIM };

  return run(async () => {
    await db().$transaction(async (tx) => {
      const before = { status: ship.status };
      if (reroute) {
        // Overturning a ban proposal with an approval: back to the second pass for the triage and the approval.
        must(await tx.project.updateMany({ where: guard, data: { proposedBanBy: null, proposedBanReason: null, triage: null, triageBy: null, triageNote: null, triageAt: null, ...reviewedAs } }));
        await audit(tx, { actorId: actor.id, action: "review.verdict", ship, reason: note, before, after: { ...base, verdict: "ban_overturned", status: "second-pass" } });
        return;
      }
      if (kind === "approve" && stage === "first-pass") {
        must(
          await tx.project.updateMany({
            where: guard,
            data: { status: "second-pass", firstPassBy: actor.id, firstPassAt: now, firstPassNote: note, firstPassMinutes: keptMinutes, reviewNote: null, reviewReason: null, triage: null, triageBy: null, triageNote: null, triageAt: null, ...reviewedAs },
          }),
        );
        if (credit.ore > 0) await ledgerRow(tx, { personId: ship.owner.id, projectId: ship.id, amountOre: credit.ore, status: "pending", kind: "approved_hours", reason: `Pending: ${hoursText(credit.newMinutes)} approved hours recommended at the first pass on ${ship.title}.`, now });
        await audit(tx, { actorId: actor.id, action: "review.verdict", ship, reason: note, before, after: { ...base, verdict: "first_pass_approved", status: "second-pass", pendingOre: credit.ore } });
        return;
      }
      if (kind === "approve") {
        // The second pass: the Ore becomes confirmed. The pending row is reversed, then the confirmed row is written.
        must(
          await tx.project.updateMany({
            where: { ...guard, triage: "not-fraud" },
            data: { status: "approved", approvedMinutes: keptMinutes, reviewNote: note, reviewReason: null, isUpdate: false, assignedTo: null, reshippedAt: null, assignmentRemindedAt: null, proposedBanBy: null, proposedBanReason: null, ...reviewedAs },
          }),
        );
        await tx.journalEntry.updateMany({ where: { projectId: ship.id, reviewAction: { not: null } }, data: { status: "approved" } });
        await releasePending(tx, ship, "Pending Ore released on final approval.", now);
        if (credit.ore > 0) await ledgerRow(tx, { personId: ship.owner.id, projectId: ship.id, amountOre: credit.ore, status: "confirmed", kind: "approved_hours", reason: `Approved: ${hoursText(credit.newMinutes)} new hours on ${ship.title}.`, now });
        await audit(tx, { actorId: actor.id, action: "review.verdict", ship, reason: note, before, after: { ...base, verdict: "approved", status: "approved", ore: credit.ore, newMinutes: credit.newMinutes } });
        return;
      }
      if (kind === "needs_changes") {
        must(
          await tx.project.updateMany({
            where: guard,
            data: { status: "needs-changes", reviewNote: note, reviewReason: reasonCode, assignedTo: ship.assignedTo ?? actor.id, reshippedAt: null, assignmentRemindedAt: null, proposedBanBy: null, proposedBanReason: null, ...reviewedAs },
          }),
        );
        await releasePending(tx, ship, "Pending Ore released: changes were requested.", now);
        await audit(tx, { actorId: actor.id, action: "review.verdict", ship, reason: note, before, after: { ...base, verdict: "needs_changes", status: "needs-changes", reasonCode } });
        return;
      }
      if (proposal) {
        // A first-pass ban is a proposal. Nothing is banned and nothing is credited.
        must(
          await tx.project.updateMany({
            where: guard,
            data: { status: "second-pass", firstPassBy: actor.id, firstPassAt: now, firstPassNote: note, firstPassMinutes: null, proposedBanBy: actor.id, proposedBanReason: note, triage: null, triageBy: null, triageNote: null, triageAt: null, ...reviewedAs },
          }),
        );
        await audit(tx, { actorId: actor.id, action: "review.verdict", ship, reason: note, before, after: { ...base, verdict: "first_pass_banned", status: "second-pass", proposedBy: actor.id } });
        return;
      }
      // A confirmed ban (owner only, checked by the gate).
      must(await tx.project.updateMany({ where: guard, data: { status: "banned", bannedAt: now, proposedBanReason: note, assignedTo: null, reshippedAt: null, ...reviewedAs } }));
      await releasePending(tx, ship, "Pending Ore released: the project was banned.", now);
      await audit(tx, { actorId: actor.id, action: "review.ban", ship, reason: note, before, after: { ...base, verdict: "banned", status: "banned" } });
    });
    refresh(ship);
    const message =
      reroute ? "Saved. The ban proposal was overturned and the ship is back in the second pass."
      : kind === "approve" ? (final ? "Saved. Approved, and the Ore is confirmed." : "Saved. Passed to the second pass. The Ore stays pending.")
      : kind === "needs_changes" ? "Saved. Sent back to the builder."
      : proposal ? "Saved. Ban proposed for an owner to confirm."
      : "Saved. The project is banned.";
    return { status: "saved", message };
  });
}

// ---- Hold ----

export async function placeHold(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const now = new Date();
  const placed = mayHold(actor, ship.facts, text(formData.get("reason")), now);
  if (!placed.ok) return error(placed.message, "reason");
  return run(async () => {
    await db().$transaction(async (tx) => {
      // Compare and swap on the hold just read, so a hold placed by someone else in between is not overwritten.
      must(
        await tx.project.updateMany({
          where: { id: ship.id, status: ship.status, heldBy: ship.heldBy },
          data: { heldAt: placed.value.at, heldBy: actor.id, holdReason: placed.value.reason, ...CLEAR_CLAIM },
        }),
      );
      await audit(tx, { actorId: actor.id, action: "review.hold", ship, reason: placed.value.reason, before: { heldBy: ship.heldBy }, after: { held: true, reviewer: viewer.displayName } });
    });
    refresh(ship);
    return { status: "saved", message: "Saved. The ship is on hold." };
  });
}

export async function releaseHold(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const allowed = mayRelease(actor, ship.facts);
  if (!allowed.ok) return error(allowed.message);
  return run(async () => {
    await db().$transaction(async (tx) => {
      must(await tx.project.updateMany({ where: { id: ship.id, heldBy: ship.heldBy, heldAt: { not: null } }, data: { heldAt: null, heldBy: null, holdReason: null } }));
      await audit(tx, { actorId: actor.id, action: "review.release_hold", ship, reason: ship.holdReason ?? "Hold released", before: { heldBy: ship.heldBy }, after: { held: false, reviewer: viewer.displayName } });
    });
    refresh(ship);
    return { status: "saved", message: "Saved. The hold is released." };
  });
}

// ---- After approval ----

// A correction after approval pays or claws back only the difference from what was already credited. Raising is allowed.
export async function correctApprovedHours(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const gate = mayCorrect(actor, ship.facts);
  if (!gate.ok) return error(gate.message);
  const hours = Number(text(formData.get("hours")));
  if (!Number.isFinite(hours) || hours < 0 || hours > 2000) return error("Corrected hours must be a number from 0 to 2000.", "hours");
  const reason = checkReason(formData.get("reason"));
  if (!reason.ok) return error(reason.message, "reason");
  const correctedMinutes = minutesOf(hours);
  const delta = correctionDelta({ previouslyCreditedOre: creditFor({ approvedMinutes: ship.approvedMinutes }), correctedOre: creditFor({ approvedMinutes: correctedMinutes }) });
  if (!delta.ok) return error(delta.message);
  return run(async () => {
    const now = new Date();
    let clawback = 0;
    let shortfall = 0;
    let applied = delta.value.deltaOre;
    await db().$transaction(async (tx) => {
      // A downward correction is a clawback, so it reads the builder's confirmed balance. Lock the Person row first, as
      // placeOrder does, so the balance and the ledger row written from it cannot interleave with a concurrent spend.
      await lockPerson(tx, ship.owner.id);
      must(await tx.project.updateMany({ where: { id: ship.id, status: "approved", approvedMinutes: ship.approvedMinutes }, data: { approvedMinutes: correctedMinutes } }));
      if (delta.value.deltaOre < 0) {
        const held = await tx.ledgerEntry.aggregate({ where: { personId: ship.owner.id, status: "confirmed" }, _sum: { amountOre: true } });
        const plan = clawbackPlan({ netEarnedOre: -delta.value.deltaOre, confirmedBalanceOre: held._sum.amountOre ?? 0 });
        clawback = plan.clawbackOre;
        shortfall = plan.shortfallOre;
        applied = -clawback;
      }
      if (applied !== 0) {
        // The shortfall is already-spent Ore: it is named in the ledger reason and the audit row as well as the message.
        const tail = shortfall > 0 ? `: ${clawback} of ${-delta.value.deltaOre} Ore taken back, ${shortfall} Ore already spent.` : "";
        await ledgerRow(tx, { personId: ship.owner.id, projectId: ship.id, amountOre: applied, status: "confirmed", kind: "adjustment", reason: `Hours corrected on ${ship.title} from ${hoursText(ship.approvedMinutes)} to ${hoursText(correctedMinutes)}: ${reason.reason}${tail}`, now });
      }
      await audit(tx, { actorId: actor.id, action: "review.correction", ship, reason: reason.reason, before: { approvedMinutes: ship.approvedMinutes }, after: { approvedMinutes: correctedMinutes, deltaOre: applied, shortfallOre: shortfall, reviewer: viewer.displayName } });
    });
    refresh(ship);
    const message = shortfall > 0
      ? `Saved. ${clawback > 0 ? `Clawed back ${clawback} Ore; ` : ""}${shortfall} Ore was already spent and could not be taken back.`
      : applied === 0 ? "Saved. The Ore is unchanged." : `Saved. ${applied > 0 ? "Paid" : "Clawed back"} ${Math.abs(applied)} Ore.`;
    return { status: "saved", message };
  });
}

// Unship an approved project back to a draft (owner only). The clearing list is Pixl's unshipResetFields, in LOADOUT's columns.
export async function unshipProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const gate = mayUnship(actor, ship.facts);
  if (!gate.ok) return error(gate.message);
  const reason = checkReason(formData.get("reason"));
  if (!reason.ok) return error(reason.message, "reason");
  return run(async () => {
    const now = new Date();
    let shortfall = 0;
    await db().$transaction(async (tx) => {
      // The clawback reads the builder's confirmed balance below. Take the same Person-row lock placeOrder takes before that
      // read, so a shop order cannot spend the balance between the check and the clawback ledger row.
      await lockPerson(tx, ship.owner.id);
      must(
        await tx.project.updateMany({
          where: { id: ship.id, status: "approved" },
          data: {
            status: "draft", submittedAt: null, statusChangedAt: now, reviewNote: null, reviewReason: null, approvedMinutes: 0, isUpdate: false, changeNote: null, resubmitCount: 0, firstShippedAt: null, reshippedAt: null,
            firstPassBy: null, firstPassAt: null, firstPassNote: null, firstPassMinutes: null, triage: null, triageBy: null, triageNote: null, triageAt: null,
            assignedTo: null, assignmentRemindedAt: null, proposedBanBy: null, proposedBanReason: null, heldAt: null, heldBy: null, holdReason: null, ...CLEAR_CLAIM,
          },
        }),
      );
      await tx.journalEntry.updateMany({ where: { projectId: ship.id }, data: { status: "logged", reviewAction: null, keptMinutes: null, reviewReason: null } });
      await releasePending(tx, ship, "Pending Ore released: the project was unshipped.", now);
      const credited = await tx.ledgerEntry.aggregate({ where: { projectId: ship.id, personId: ship.owner.id, status: "confirmed", kind: { in: ["approved_hours", "adjustment"] } }, _sum: { amountOre: true } });
      const net = credited._sum.amountOre ?? 0;
      // The clawback stops at what the builder still holds (confirmed earned minus spent, over every project), so the balance never
      // goes negative silently. What was already spent is the shortfall: it is named in the ledger reason, the audit row and the message.
      const held = await tx.ledgerEntry.aggregate({ where: { personId: ship.owner.id, status: "confirmed" }, _sum: { amountOre: true } });
      const plan = clawbackPlan({ netEarnedOre: net, confirmedBalanceOre: held._sum.amountOre ?? 0 });
      shortfall = plan.shortfallOre;
      if (plan.clawbackOre > 0) {
        const tail = plan.shortfallOre > 0 ? `: ${plan.clawbackOre} of ${net} Ore taken back, ${plan.shortfallOre} Ore already spent.` : `: ${plan.clawbackOre} Ore taken back.`;
        await ledgerRow(tx, { personId: ship.owner.id, projectId: ship.id, amountOre: -plan.clawbackOre, status: "confirmed", kind: "adjustment", reason: `Unshipped ${ship.title.slice(0, 60)}${tail}`, now });
      }
      await audit(tx, { actorId: actor.id, action: "review.unship", ship, reason: reason.reason, before: { status: "approved", approvedMinutes: ship.approvedMinutes }, after: { status: "draft", clawedBackOre: plan.clawbackOre, shortfallOre: plan.shortfallOre, reviewer: viewer.displayName } });
    });
    refresh(ship);
    return { status: "saved", message: shortfall > 0 ? `Saved. The project is a draft again. ${shortfall} Ore of what it earned was already spent, so that part was not taken back.` : "Saved. The project is a draft again." };
  });
}

// ---- Notes ----

export async function addReviewNote(_prev: FormState, formData: FormData): Promise<FormState> {
  const { viewer, actor } = await context();
  const ship = await shipFrom(formData);
  if (!ship) return error(NOT_FOUND);
  const own = mayAddNote(actor, ship.facts);
  if (!own.ok) return error(own.message);
  const body = text(formData.get("body")).trim().slice(0, 2000);
  if (!body) return error("Write the note first.", "body");
  return run(async () => {
    await db().$transaction(async (tx) => {
      // The status is checked again inside the transaction, so a ship unshipped to a draft a moment ago gets no note.
      if ((await tx.project.count({ where: { id: ship.id, status: { in: [...NOTE_STATUSES] } } })) === 0) throw new Race();
      await audit(tx, { actorId: actor.id, action: "review.note", ship, reason: body, after: { body, reviewer: viewer.displayName, stage: stageOf(ship.facts) } });
    });
    return { status: "saved", message: "Saved." };
  });
}
