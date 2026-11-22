// Review rules as pure logic (plans/proposals/review-rules.md). No database, no UI, no clock: every function takes what it needs.
// The reviewer desk and the real verdict writes call these, then write the result. Sources: Plan 01 section 6 and 8, Plan 02
// (10 Ore per approved hour), and Pixl's internal dashboard where the spec says "Pixl, adopted".
// The reviewer site's own status and desk rules stay in review.ts; this file adds the money, time and permission rules.
import { TECHNICAL_FEATURES_MIN } from "@/reviewer-dash/lib/auditNote";
import { AGE_LIMIT, ageOn } from "./eligibility";
import { oreForMinutes, tenthsOfHour } from "./ledger";
import { ORE_PER_HOUR, PARKED_STATUS, TRACK_XP_PER_HOUR, USD_PER_TEN_ORE, type ReviewStatus } from "./review";
import { visibleTextLength } from "./text-evidence";

export type Checked<T> = { ok: true; value: T } | { ok: false; message: string };

// ---- Ore ----

function wholeMinutes(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

// The Ore rules live in ledger.ts: one version for the ledger, the review rules and every display estimate (review.ts creditFor,
// hoursToOre). Hours round to 0.1 first, then the Ore rounds UP to a whole Ore (owner decision, 16 Nov 2026). 100 minutes is
// 1.7 hours, 17 Ore. 90 minutes is 15 Ore. Under 3 minutes is 0 tenths, so 0 Ore. Zero, negative and not-a-number all give 0.
export { tenthsOfHour };

export function creditFor({ approvedMinutes, ratePerHourOre = ORE_PER_HOUR }: { approvedMinutes: number; ratePerHourOre?: number }): number {
  return oreForMinutes(approvedMinutes, ratePerHourOre);
}

// Track XP for approved minutes: 10 per approved hour on the same 0.1 hour rounding, rounded down, all to the project one
// track (Plan 02). Not spendable.
export function trackXpFor(approvedMinutes: number): number {
  return Math.floor((tenthsOfHour(approvedMinutes) * TRACK_XP_PER_HOUR) / 10);
}

// ---- Per-journal decisions (Plan 01 section 6.4) ----

export type JournalActionKind = "approve-all" | "partial" | "clarify" | "reject";
export type JournalDecision = { action: JournalActionKind; keptMinutes: number; resolved: boolean };
export const JOURNAL_ACTION_KINDS: readonly JournalActionKind[] = ["approve-all", "partial", "clarify", "reject"];

// What one journal entry keeps. approve-all keeps everything claimed. partial keeps a whole number of minutes from 0 to the
// claimed minutes. reject (unverifiable) keeps zero. clarify keeps nothing yet and is not a decision: resolved is false, so
// a verdict cannot be given while any entry is waiting on a clarification.
export function journalDecision(entry: { minutes: number }, action: JournalActionKind, keptMinutes?: number): Checked<JournalDecision> {
  const claimed = entry.minutes;
  if (!Number.isInteger(claimed) || claimed <= 0) return { ok: false, message: "The entry must claim a whole number of minutes above zero." };
  switch (action) {
    case "approve-all":
      return { ok: true, value: { action, keptMinutes: claimed, resolved: true } };
    case "reject":
      return { ok: true, value: { action, keptMinutes: 0, resolved: true } };
    case "clarify":
      return { ok: true, value: { action, keptMinutes: 0, resolved: false } };
    case "partial": {
      if (typeof keptMinutes !== "number" || !Number.isFinite(keptMinutes)) return { ok: false, message: "Say how many minutes to keep." };
      if (!Number.isInteger(keptMinutes)) return { ok: false, message: "Keep a whole number of minutes." };
      if (keptMinutes < 0) return { ok: false, message: "Kept minutes cannot be below zero." };
      if (keptMinutes > claimed) return { ok: false, message: `Kept minutes cannot be above the ${claimed} claimed.` };
      return { ok: true, value: { action, keptMinutes, resolved: true } };
    }
    default:
      return { ok: false, message: "That journal action is not known." };
  }
}

// ---- Verdicts ----
// Three verdicts, copied from Pixl's statuses (owner decision, 16 Nov 2026): approve (accepted, credits hours), needs_changes
// (the builder fixes and ships again) and banned (permanent ban of the project). "Does not fit the track" is a needs_changes
// reason. There is no separate reject. A hold is not a verdict; it blocks verdicts until released.

export type NeedsChangesReason = "track" | "readme" | "hours" | "ai" | "other";

export type Verdict =
  // Credits the minutes the per-journal decisions kept. If some entry was cut, `reduced` is true on the effect.
  | { kind: "approve" }
  // Back to the builder with a written reason. Reason "track" is "Does not fit the track" and opens the track again.
  | { kind: "needs_changes"; reason: string; reasonCode?: NeedsChangesReason }
  // Permanent ban of the project. At the first pass this is only a proposal; at the second pass an owner decides.
  | { kind: "banned"; reason: string };

export type ReviewStage = "first-pass" | "second-pass";

export type JournalForVerdict = { minutes: number; action?: JournalActionKind; keptMinutes?: number };

// review.ts status values. "second-pass" there is the second pass (the owner's name); the desk still uses that string.
export type StateChange = Extract<ReviewStatus, "second-pass" | "proposed-ban" | "approved" | "needs-changes" | "banned"> | typeof PARKED_STATUS;

export type VerdictEffect = {
  // Minutes and Ore this verdict credits. Zero unless it approves at the second pass.
  minutes: number;
  hours: number;
  ore: number;
  trackXp: number;
  // confirmed: second-pass approval, Ore is spendable. pending: a first-pass approval, which parks for the fraud score and is
  // not paid yet. null: nothing is credited.
  oreStatus: "confirmed" | "pending" | null;
  // May the builder still claim hours on this project and ship it again? Approved and needs changes: yes. Banned: no.
  claimable: boolean;
  state: StateChange;
  // True when the track is open again (needs changes with the reason "Does not fit the track").
  unlocksTrack: boolean;
  // Some entry kept less than it claimed (an approval for fewer hours).
  reduced: boolean;
  claimedMinutes: number;
};

function empty(claimedMinutes: number, state: StateChange, claimable: boolean, unlocksTrack = false): VerdictEffect {
  return { minutes: 0, hours: 0, ore: 0, trackXp: 0, oreStatus: null, claimable, state, unlocksTrack, reduced: false, claimedMinutes };
}

// Every journal's decision, resolved to kept minutes. Fails while an entry has no action or is waiting on a clarification.
export function keptTotal(journals: readonly JournalForVerdict[]): Checked<{ claimed: number; kept: number; allFull: boolean }> {
  let claimed = 0;
  let kept = 0;
  let allFull = true;
  for (const journal of journals) {
    if (!journal.action) return { ok: false, message: "Every journal entry needs a decision before a verdict." };
    const decision = journalDecision(journal, journal.action, journal.keptMinutes);
    if (!decision.ok) return decision;
    if (!decision.value.resolved) return { ok: false, message: "An entry is waiting on a clarification. Resolve it before a verdict." };
    claimed += journal.minutes;
    kept += decision.value.keptMinutes;
    if (decision.value.keptMinutes !== journal.minutes) allFull = false;
  }
  return { ok: true, value: { claimed, kept, allFull } };
}

function claimedOf(journals: readonly JournalForVerdict[]): number {
  return journals.reduce((sum, journal) => sum + (Number.isInteger(journal.minutes) && journal.minutes > 0 ? journal.minutes : 0), 0);
}

// What a verdict does at a stage. While the ship is held no verdict can be given.
// - approve, first pass: every first-pass approval parks for Robert's fraud score before the second pass (PARKED_STATUS). The
//   recommended hours are checked and the Ore stays pending. Nothing is confirmed.
// - approve, second pass: credits exactly what the journal decisions kept and confirms the Ore.
// - needs_changes: credits nothing, needs a written reason, goes back to the builder at either stage.
// - banned, first pass: only a proposal (state proposed-ban). Second pass: the ban itself, which only an owner may give (use
//   canConfirmBan for who).
//
// An update ship (a project approved before: `priorApprovedMinutes` above zero) is approved only for NEW kept minutes. The kept
// total counts the already-approved entries too, so the check is kept minus what was approved before, and it must reach
// UPDATE_MIN_MINUTES (2.5 hours, the same minimum the ship gate asks of the builder). Otherwise the approval is refused and
// the reviewer is pointed to "needs changes", so an approval never pays nothing.
export function verdictEffect(verdict: Verdict, journals: readonly JournalForVerdict[], opts: { stage: ReviewStage; held?: boolean; priorApprovedMinutes?: number }): Checked<VerdictEffect> {
  if (opts.held) return { ok: false, message: "This ship is on hold. Release the hold before giving a verdict." };
  const claimedMinutes = claimedOf(journals);
  switch (verdict.kind) {
    case "approve": {
      if (journals.length === 0) return { ok: false, message: "There are no journal entries to approve." };
      const total = keptTotal(journals);
      if (!total.ok) return total;
      const { kept, allFull } = total.value;
      if (kept <= 0) return { ok: false, message: "No time was kept. Ask for changes instead of approving." };
      const prior = wholeMinutes(opts.priorApprovedMinutes ?? 0);
      if (prior > 0) {
        const added = updateMinimumMet({ priorApprovedMinutes: prior, totalMinutes: kept });
        if (!added.met) {
          return { ok: false, message: `This is an update to an approved project, and it needs at least 2.5 new approved hours. These decisions keep ${added.newMinutes} new minutes. Choose "needs changes" instead of approving.` };
        }
      }
      const second = opts.stage === "second-pass";
      return {
        ok: true,
        value: {
          minutes: second ? kept : 0,
          hours: second ? tenthsOfHour(kept) / 10 : 0,
          ore: second ? creditFor({ approvedMinutes: kept }) : 0,
          trackXp: second ? trackXpFor(kept) : 0,
          oreStatus: second ? "confirmed" : "pending",
          claimable: true,
          state: second ? "approved" : PARKED_STATUS,
          unlocksTrack: false,
          reduced: !allFull,
          claimedMinutes,
        },
      };
    }
    case "needs_changes": {
      if (!verdict.reason.trim()) return { ok: false, message: "Give the builder a reason." };
      return { ok: true, value: empty(claimedMinutes, "needs-changes", true, verdict.reasonCode === "track") };
    }
    case "banned": {
      if (!verdict.reason.trim()) return { ok: false, message: "Give a reason for the ban." };
      return { ok: true, value: empty(claimedMinutes, opts.stage === "first-pass" ? "proposed-ban" : "banned", false) };
    }
    default:
      return { ok: false, message: "That verdict is not known." };
  }
}

// Review timers (seconds on the repo, on the demo, in total) arrive from the browser, so they are not trusted. A whole number from
// 0 to one day; anything else (negative, not a number, infinite) is 0, and a huge value is cut to the day.
export const EVIDENCE_SECONDS_MAX = 86_400;
export function cleanSeconds(raw: unknown, max: number = EVIDENCE_SECONDS_MAX): number {
  const value = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), max);
}

// Pending Ore shown to the builder while a ship waits: what the claimed minutes would earn. Never spendable.
export function pendingCredit(claimedMinutes: number): number {
  return creditFor({ approvedMinutes: claimedMinutes });
}

// ---- Structured audit note (Pixl's override-hours justification guidance) ----

// The review form builds a structured note and the server parses it again before writing a verdict. The sections an approval
// needs are derived here from the ship and the verdict, never from a caller-supplied flag: a caller cannot skip a justification
// by rebuilding the note without it. Mirrors reviewer-dash/lib/auditNote.ts (the shared header text and minimum length).
export type AuditSections = { technicalFeatures: string; deflationReason: string; ageJustification: string; notes: string };
export type AuditSectionKey = keyof AuditSections;

export function validateAuditSections(
  sections: AuditSections,
  required: Partial<Record<AuditSectionKey, boolean>>,
): { ok: true } | { ok: false; field: AuditSectionKey; message: string } {
  if (required.technicalFeatures && sections.technicalFeatures.trim().length < TECHNICAL_FEATURES_MIN)
    return { ok: false, field: "technicalFeatures", message: `Describe concrete technical features you checked (min ${TECHNICAL_FEATURES_MIN} characters).` };
  if (required.deflationReason && !sections.deflationReason.trim())
    return { ok: false, field: "deflationReason", message: "Explain why the credited hours were lowered." };
  if (required.ageJustification && !sections.ageJustification.trim())
    return { ok: false, field: "ageJustification", message: "Age justification is required before deciding." };
  if (required.notes && !sections.notes.trim())
    return { ok: false, field: "notes", message: "Additional notes are required." };
  return { ok: true };
}

// A builder who turned 19 between shipping and this review. The desk flags it and asks for a written age justification; derive
// it on the server from the stored birthday so a caller cannot drop the flag. Mirrors reviewer-dash/lib/db.ts.
export function turnedNineteenSinceShipping(birthday: Date | null | undefined, shippedAt: Date | null | undefined, now: Date): boolean {
  if (!birthday || !shippedAt || Number.isNaN(birthday.getTime()) || Number.isNaN(shippedAt.getTime())) return false;
  return ageOn(birthday, shippedAt) < AGE_LIMIT && ageOn(birthday, now) >= AGE_LIMIT;
}

// ---- Hold (Pixl, adopted: actions.ts holdReview and releaseHold, lines 3532 to 3660) ----

export const HOLD_REASON_MAX = 500;
export type Hold = { by: string; reason: string; at: Date };

// Who may hold a ship (Pixl: actions.ts holdReview uses authorizeProjectAction with allowOwn: true, lines 226 to 256 and 3548).
// The ship's own owner may hold it. A collaborator (or someone with a pending invite) may not. Other reviewers may, subject to
// the queue rules in canReview.
export function canHold({ reviewerId, ownerId, collaboratorIds = [], pendingInviteIds = [] }: { reviewerId: string; ownerId: string; collaboratorIds?: readonly string[]; pendingInviteIds?: readonly string[] }): boolean {
  if (!reviewerId?.trim()) return false;
  if (reviewerId === ownerId) return true;
  if (collaboratorIds.includes(reviewerId) || pendingInviteIds.includes(reviewerId)) return false;
  return true;
}

// Any reviewer may hold a ship, with a reason of up to 500 characters. A hold has no expiry and is never shown to the builder.
// It blocks every verdict. It does not overwrite another reviewer's hold; an owner may.
export function placeHold({ reason, by, now, existing = null, isOwner = false }: { reason: string; by: string; now: Date; existing?: Hold | null; isOwner?: boolean }): Checked<Hold> {
  const text = reason.trim().slice(0, HOLD_REASON_MAX);
  if (!text) return { ok: false, message: "A reason is required to hold a review." };
  if (existing && existing.by !== by && !isOwner) return { ok: false, message: "Another reviewer already holds this ship." };
  return { ok: true, value: { by, reason: text, at: now } };
}

// Only the reviewer who set the hold, or an owner, releases it.
export function canReleaseHold({ hold, releaserId, isOwner }: { hold: Hold | null; releaserId: string; isOwner: boolean }): boolean {
  if (!hold) return false;
  return isOwner || hold.by === releaserId;
}

// ---- Corrections after approval ----

// An approved total can be corrected later, down or up (owner decision, 16 Nov 2026). The delta is what must be paid (positive)
// or clawed back (negative) against what was already credited; nothing is paid twice. Funding already taken from the payout
// is NOT touched by a correction. Only a change to the funding amount itself reruns fundingSplit.
export function correctionDelta({ previouslyCreditedOre, correctedOre }: { previouslyCreditedOre: number; correctedOre: number }): Checked<{ deltaOre: number; direction: "pay" | "claw_back" | "none" }> {
  if (!Number.isInteger(previouslyCreditedOre) || previouslyCreditedOre < 0) return { ok: false, message: "The credited Ore must be a whole number, zero or more." };
  if (!Number.isInteger(correctedOre) || correctedOre < 0) return { ok: false, message: "The corrected Ore must be a whole number, zero or more." };
  const deltaOre = correctedOre - previouslyCreditedOre;
  return { ok: true, value: { deltaOre, direction: deltaOre > 0 ? "pay" : deltaOre < 0 ? "claw_back" : "none" } };
}

// ---- Update ships ----

export const UPDATE_NOTE_MIN_CHARS = 100;

// The change note an update ship needs, at least 100 characters once trimmed (Pixl: change note, adopted).
export function checkChangeNote(raw: unknown): Checked<string> {
  const note = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (visibleTextLength(note) < UPDATE_NOTE_MIN_CHARS) return { ok: false, message: `Describe what changed in at least ${UPDATE_NOTE_MIN_CHARS} characters.` };
  return { ok: true, value: note };
}

// An update ship (a repeat ship of an approved project) must add at least 2.5 new approved hours. Owner decision, 16 Nov 2026
// ("reship needs 2.5h minimum"). Pixl has no such rule; LOADOUT adds it. A resubmit after needs changes keeps Pixl's rule and
// has no hour minimum. The new minutes are the total claimed minutes minus the minutes already approved.
export const UPDATE_MIN_MINUTES = 150;
export function updateMinimumMet({ priorApprovedMinutes, totalMinutes }: { priorApprovedMinutes: number; totalMinutes: number }): { met: boolean; newMinutes: number; missingMinutes: number } {
  const newMinutes = Math.max(0, wholeMinutes(totalMinutes) - wholeMinutes(priorApprovedMinutes));
  return { met: newMinutes >= UPDATE_MIN_MINUTES, newMinutes, missingMinutes: Math.max(0, UPDATE_MIN_MINUTES - newMinutes) };
}

// An update ship pays only for new minutes. The credit is the cumulative Ore for the total minus the cumulative Ore already
// earned for the prior approved minutes, so rounding never loses a fraction between ships. Never negative: a total at or
// below the prior approved minutes pays nothing.
export function updateShipCredit({ priorApprovedMinutes, totalMinutes }: { priorApprovedMinutes: number; totalMinutes: number }): { newMinutes: number; ore: number } {
  const prior = wholeMinutes(priorApprovedMinutes);
  const total = wholeMinutes(totalMinutes);
  const newMinutes = Math.max(0, total - prior);
  const ore = Math.max(0, creditFor({ approvedMinutes: total }) - creditFor({ approvedMinutes: prior }));
  return { newMinutes, ore };
}

// ---- Hardware funding at approval (owner confirmed 16 Nov 2026; Pixl: actions.ts line 937) ----

// Funding is taken from the ship's own payout, capped at that payout; the rest is paid. The funding in Ore is rounded to the
// nearest whole Ore, as Pixl does (actions.ts line 937: Math.round, then Math.min with the gross payout). capped is true when
// the funding was larger than the payout, so the builder is not charged more than the ship earned.
export function fundingSplit({ payoutOre, fundingUsd, usdPerTenOre = USD_PER_TEN_ORE }: { payoutOre: number; fundingUsd: number; usdPerTenOre?: number }): { fundingOre: number; paidOre: number; capped: boolean } {
  if (!Number.isFinite(usdPerTenOre) || usdPerTenOre <= 0) throw new RangeError("usdPerTenOre must be above zero.");
  const payout = Number.isInteger(payoutOre) && payoutOre > 0 ? payoutOre : 0;
  if (!Number.isFinite(fundingUsd) || fundingUsd <= 0) return { fundingOre: 0, paidOre: payout, capped: false };
  // The small epsilon keeps values such as 43.5 / 4.35 x 10 from landing on a half and rounding the wrong way.
  const wanted = Math.round((fundingUsd / usdPerTenOre) * 10 + 1e-9);
  const fundingOre = Math.min(wanted, payout);
  return { fundingOre, paidOre: payout - fundingOre, capped: wanted > payout };
}

// ---- Claims (Pixl, adopted: db.ts REVIEW_LOCK_MS, ReviewHeartbeat.tsx AWAY_RELEASE_MS, reviewClaimState.ts) ----

export const CLAIM_LOCK_MINUTES = 30;
export const CLAIM_AWAY_RELEASE_MINUTES = 5;
// A heartbeat extends the 30-minute inactivity window, but it must not extend one claim forever. Four hours is long enough to
// finish a review and short enough that a stuck ship returns to the queue rather than blocking the reviewer who was assigned it.
export const CLAIM_MAX_MINUTES = 240;

export type ClaimState = {
  // none: nobody holds it. active: the holder still has it. expired: 30 minutes passed with no heartbeat. released: the
  // holder was away 5 minutes or more.
  state: "none" | "active" | "expired" | "released";
  holder: string | null;
  // Minutes until an active claim lapses without a heartbeat, else 0.
  minutesLeft: number;
  // True when another reviewer holds an active claim, so the viewer cannot start on it.
  blocksViewer: boolean;
};

// The claim is the holder's until 30 minutes after their last heartbeat (the claim time counts as the first heartbeat). It is
// released early once they have been away 5 minutes or more. A timestamp in the future is not a claim. reviewerId is the holder.
export function claimState({ reviewerId, claimedAt, lastHeartbeatAt, awayMinutes = 0, now, viewerId }: { reviewerId: string | null | undefined; claimedAt: Date | null | undefined; lastHeartbeatAt?: Date | null; awayMinutes?: number | null; now: Date; viewerId?: string | null }): ClaimState {
  const holder = reviewerId?.trim() || null;
  const none: ClaimState = { state: "none", holder: null, minutesLeft: 0, blocksViewer: false };
  if (!holder || !claimedAt) return none;
  const claimStart = claimedAt.getTime();
  const heartbeat = lastHeartbeatAt ? lastHeartbeatAt.getTime() : Number.NaN;
  // A heartbeat only moves the start if it is real, newer than the claim and has actually happened. A future
  // timestamp (clock skew or bad data) must not erase an otherwise live claim.
  const usableHeartbeat = Number.isFinite(heartbeat) && heartbeat > claimStart && heartbeat <= now.getTime();
  const start = usableHeartbeat ? heartbeat : claimStart;
  if (!Number.isFinite(start) || start > now.getTime()) return none;
  if (now.getTime() - claimStart >= CLAIM_MAX_MINUTES * 60_000) return { state: "expired", holder, minutesLeft: 0, blocksViewer: false };
  const away = typeof awayMinutes === "number" && Number.isFinite(awayMinutes) ? awayMinutes : 0;
  if (away >= CLAIM_AWAY_RELEASE_MINUTES) return { state: "released", holder, minutesLeft: 0, blocksViewer: false };
  const elapsedMs = now.getTime() - start;
  if (elapsedMs >= CLAIM_LOCK_MINUTES * 60_000) return { state: "expired", holder, minutesLeft: 0, blocksViewer: false };
  const minutesLeft = Math.ceil((CLAIM_LOCK_MINUTES * 60_000 - elapsedMs) / 60_000);
  return { state: "active", holder, minutesLeft, blocksViewer: viewerId !== holder };
}

// ---- Assignment window (Pixl, adopted: reviewAssignment.ts ASSIGNMENT_WINDOW_MS) ----

export const ASSIGNMENT_WINDOW_HOURS = 72;
const HOUR_MS = 3_600_000;

// The reviewer who asked for changes keeps the ship for 72 hours after the builder ships again. Then it goes back to the
// common queue. At exactly 72 hours it is already back.
export function assignmentWindow({ reshippedAt, now }: { reshippedAt: Date | null | undefined; now: Date }): { deadline: Date | null; msLeft: number; hoursLeft: number; backToQueue: boolean } {
  if (!reshippedAt || !Number.isFinite(reshippedAt.getTime())) return { deadline: null, msLeft: 0, hoursLeft: 0, backToQueue: false };
  const deadline = new Date(reshippedAt.getTime() + ASSIGNMENT_WINDOW_HOURS * HOUR_MS);
  const msLeft = Math.max(0, deadline.getTime() - now.getTime());
  return { deadline, msLeft, hoursLeft: msLeft / HOUR_MS, backToQueue: now.getTime() >= deadline.getTime() };
}

// The assignee gets one reminder a day into the 72 hour window, if the ship is still not overdue and no reminder was sent since
// the re-ship (Pixl, adopted: reviewAssignment.ts ASSIGNMENT_REMIND_AFTER_MS = 24 hours, needsAssignmentReminder).
export const ASSIGNMENT_REMIND_AFTER_HOURS = 24;
export function assignmentReminderDue({ reshippedAt, reminderSentAt, now }: { reshippedAt: Date | null | undefined; reminderSentAt?: Date | null; now: Date }): boolean {
  if (!reshippedAt || !Number.isFinite(reshippedAt.getTime())) return false;
  const start = reshippedAt.getTime();
  if (now.getTime() < start + ASSIGNMENT_REMIND_AFTER_HOURS * HOUR_MS) return false;
  if (now.getTime() >= start + ASSIGNMENT_WINDOW_HOURS * HOUR_MS) return false;
  return !reminderSentAt || reminderSentAt.getTime() < start;
}

// ---- Fraud triage (retired) ----

// The human fraud triage and its second-pass gate are gone (plans/proposals/platform-parity-pixl.md, step 2.3). Robert's score is
// the fraud signal, and it decides whether a parked ship moves on (robert-outcome.ts). FraudTriage is kept only because
// review-decisions.ts still imports it, and canGiveSecondPassVerdict only because that file still calls it. Both come out with
// review-decisions.ts's triage gate.
export type FraudTriage = "not-fraud" | "fraud";

// Always passes. There is no triage to require any more.
export function canGiveSecondPassVerdict(_triage: { triage: FraudTriage | null | undefined }): Checked<true> {
  return { ok: true, value: true };
}

// ---- Reviewer pay (owner decision, 22 Nov 2026; plans/proposals/platform-parity-pixl.md, step 2.7) ----

// Every verdict a reviewer gives writes one ReviewPayout row: 2 Ore for an approval or a confirmed ban, 1 Ore for needs changes. A
// first-pass approval's row stays pending until the final verdict settles it, and nothing is cut: an overturned first pass keeps its
// pay. A first-pass ban is a proposal, not a verdict, so it pays nothing.
export type ReviewPayoutKind = "first-pass-approve" | "approve" | "needs-changes" | "ban";
export type ReviewPayoutRow = { kind: ReviewPayoutKind; amountOre: number; status: "pending" };
export function reviewPayoutFor(kind: ReviewPayoutKind): ReviewPayoutRow {
  return { kind, amountOre: kind === "needs-changes" ? 1 : 2, status: "pending" };
}

// ---- Unship (plans/proposals/platform-parity-pixl.md, step 2.6) ----

// The ship states an owner may unship, back to a draft. Approved ships, and ships still in review (parked for the fraud score, or
// in the second pass). Clawback only ever takes back Ore the ship earned as confirmed credit; a pending first-pass amount is simply
// released, so a ship with no confirmed credit is never clawed back.
export const UNSHIP_FROM_STATUSES = ["fraud-review", "second-pass", "approved"] as const;
export function unshipFrom(status: string): boolean {
  return (UNSHIP_FROM_STATUSES as readonly string[]).includes(status);
}

// ---- Wait (Pixl, adopted: queueWait.ts) ----

// When the ship's wait began. A first ship, or a reship after changes, waits from the FIRST ship. An update ship of an
// approved project is a new submission and starts a new wait at the update.
export function waitStart({ firstShippedAt, updateShippedAt, isUpdate }: { firstShippedAt?: Date | null; updateShippedAt?: Date | null; isUpdate: boolean }): Date | null {
  if (isUpdate) return updateShippedAt ?? firstShippedAt ?? null;
  return firstShippedAt ?? updateShippedAt ?? null;
}

// ---- Bans ----

// Only an owner confirms a ban (Pixl: reviewAccess.ts proposedBanDecision, lines 60 to 80). The different-reviewer check that
// Pixl applies to ban proposals is for non-owners only, and owners are exempt from it, as Pixl does. Pixl has no reviewer
// warning count: its warnings are owner notices and the only automatic ladder is for chat content, which LOADOUT does not have.
export function canConfirmBan({ confirmerIsOwner }: { confirmerIsOwner: boolean }): Checked<true> {
  if (!confirmerIsOwner) return { ok: false, message: "Only an owner can confirm a ban." };
  return { ok: true, value: true };
}

// ---- Who may review ----

export type ReviewerRole = "reviewer" | "final-reviewer" | "owner";

// Which roles may give a verdict at each stage. First pass: any reviewer (the queue scope is checked by review.ts canReview).
// Second pass and proposed ban: a final reviewer or an owner (review.ts canReview, where the second pass is the status second-pass).
export function stageAllows(role: ReviewerRole, stage: "first-pass" | "second-pass" | "proposed-ban"): boolean {
  if (role !== "reviewer" && role !== "final-reviewer" && role !== "owner") return false;
  if (stage === "first-pass") return true;
  return role === "final-reviewer" || role === "owner";
}

// Self-review (Pixl: reviewAccess.ts isOwnOrCollaborator, adopted and extended): a reviewer cannot review a ship they own, are
// a collaborator on, or are invited to and have not yet answered, because they would be paid when it is approved. This holds
// for owners too. A ship reserved for the reviewer who asked for changes is closed to other reviewers while the 72 hour window
// runs; a platform owner is never locked out of that reservation (Pixl: reviewAssignment.ts lockedForViewer).
export function canReview({ reviewerId, ownerId, collaboratorIds = [], pendingInviteIds = [], assignedReviewerId = null, assignmentOverdue = false, isPlatformOwner = false }: { reviewerId: string; ownerId: string; collaboratorIds?: readonly string[]; pendingInviteIds?: readonly string[]; assignedReviewerId?: string | null; assignmentOverdue?: boolean; isPlatformOwner?: boolean }): boolean {
  if (!reviewerId?.trim()) return false;
  if (reviewerId === ownerId) return false;
  if (collaboratorIds.includes(reviewerId)) return false;
  if (pendingInviteIds.includes(reviewerId)) return false;
  if (assignedReviewerId && assignedReviewerId !== reviewerId && !assignmentOverdue && !isPlatformOwner) return false;
  return true;
}

// The second pass needs the second-pass role (Pixl: reviewAccess.ts canSecondPass). Pixl does not stop the first-pass reviewer
// from the second pass in general; its different-reviewer check is for ban proposals only (see canConfirmBan). Self-review
// (canReview) still applies on top of this.
export function canSecondPass({ reviewerId, role }: { reviewerId: string; role: ReviewerRole }): boolean {
  if (!reviewerId?.trim()) return false;
  return stageAllows(role, "second-pass");
}

// Every first-pass approval is taken on to the second pass (after the fraud-score park); there is no sampling (owner decision, 16
// Nov 2026; Pixl second_review).
export function goesToSecondPass(firstPassVerdict: "approve" | "needs_changes" | "banned"): boolean {
  return firstPassVerdict === "approve";
}

// The equip gate: the equipping project needs 25 approved hours (Plan 02). Decided by the lead, 16 Nov 2026: the gate is a
// count of approved hours, so it fires whenever they reach 25 on any ship, including an update ship.
export const EQUIP_GATE_MINUTES = 25 * 60;
export function equipGateMet(totalApprovedMinutes: number): boolean {
  return wholeMinutes(totalApprovedMinutes) >= EQUIP_GATE_MINUTES;
}
