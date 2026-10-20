import { cadence, journalGate, roundHours } from "./cadence";
import { HOUR_MS, RULES } from "./constants";
import { buildSnapshot, countableReviews, oreFor } from "./scoring";
import type { FlagPenaltyState, Flag, Project, ReceivedReview, Ship, ShipState } from "./types";
import { bomIsComplete, isOpenLicense, isPublicUrl } from "./validate";

// Ship pipeline: checklist, state machine, award lock, flag window, payout.
// Rules: plans/22-peer-review-and-multipliers.md sections 1 and 2, plans/01-product-and-program.md sections 5 to 8,
// plans/02-economy-and-rewards.md sections 10 and 11. Everything here is a pure function of its inputs.

export const AI_USE_OPTIONS = [
  "No AI",
  "Research / explanation",
  "Debugging",
  "Autocomplete",
  "Code generation",
  "Asset generation",
  "Other",
] as const;

/** Hours that count for a project: the tracker must be linked, and allocation never exceeds what it reports. */
export function effectiveHours(project: Pick<Project, "trackerConnected" | "trackerHours" | "allocatedHours">): number {
  if (!project.trackerConnected) return 0;
  return roundHours(Math.max(0, Math.min(project.allocatedHours, project.trackerHours)));
}

/** Hours already used by earlier ships. A rejected ship's hours were never rewarded, so they can be shipped again. */
export function shippedHours(priorShips: readonly Pick<Ship, "state" | "submittedHours">[]): number {
  return roundHours(priorShips.filter((ship) => ship.state !== "rejected").reduce((sum, ship) => sum + ship.submittedHours, 0));
}

export function isActiveShip(ship: Pick<Ship, "state">): boolean {
  return ship.state !== "paid" && ship.state !== "rejected";
}

export interface ChecklistItem {
  id: "source" | "tracker" | "journals" | "bom" | "summary" | "hours" | "ai";
  label: string;
  pass: boolean;
  /** What to do when the item fails, or a short confirmation when it passes. */
  detail: string;
}

export interface ChecklistInput {
  project: Project;
  entries: readonly { hours: number }[];
  priorShips: readonly Pick<Ship, "state" | "submittedHours">[];
  aiUse: readonly string[];
}

export interface Checklist {
  items: ChecklistItem[];
  canSubmit: boolean;
  /** Hours this ship would claim: tracked hours not already used by an earlier ship. */
  newHours: number;
}

export function shipChecklist(input: ChecklistInput): Checklist {
  const { project, entries, priorShips, aiUse } = input;
  const hardware = project.track === "Hardware";
  const tracker = hardware ? "Lapse" : "Hackatime";
  const logged = effectiveHours(project);
  const newHours = roundHours(Math.max(0, logged - shippedHours(priorShips)));
  const hasPrior = priorShips.some((ship) => ship.state !== "rejected");
  const cad = cadence(logged, entries);
  const items: ChecklistItem[] = [];

  const sourceOk = isOpenLicense(project.license) && isPublicUrl(project.repoUrl);
  items.push({
    id: "source",
    label: "Open source with a public source link",
    pass: sourceOk,
    detail: sourceOk
      ? "An open-source licence and a public repository link are set."
      : "Choose an open-source licence and add a public repository link in Details.",
  });

  const trackerOk = project.trackerConnected && logged > 0;
  items.push({
    id: "tracker",
    label: `${tracker} linked with hours allocated`,
    pass: trackerOk,
    detail: trackerOk
      ? `${logged} h allocated from ${tracker}.`
      : `Connect ${tracker} and allocate more than 0 hours in Evidence. ${hardware ? "Hardware needs Lapse." : "Software needs Hackatime."}`,
  });

  const hoursOk = hasPrior ? newHours >= RULES.repeatShipMinNewHours : newHours > 0;
  items.push({
    id: "hours",
    label: hasPrior ? `At least ${RULES.repeatShipMinNewHours} new hours since your last ship` : "Hours to ship",
    pass: hoursOk,
    detail: hoursOk
      ? `${newHours} h not yet used by an earlier ship.`
      : hasPrior
        ? `A repeat ship needs ${RULES.repeatShipMinNewHours} new approved hours and new work. You have ${newHours} h.`
        : "Allocate tracked hours to this project first.",
  });

  const journalsOk = entries.length > 0 && !cad.due;
  items.push({
    id: "journals",
    label: `Journal up to date (one entry per ${RULES.journalEveryHours} h)`,
    pass: journalsOk,
    detail: journalsOk
      ? `${cad.uncovered} h since your last entry, under the ${RULES.journalEveryHours} h limit.`
      : entries.length === 0
        ? "Write at least one journal entry for this project."
        : `${cad.uncovered} h are not covered by an entry. Write one in Journals.`,
  });

  if (hardware) {
    const bomOk = bomIsComplete(project.bom);
    items.push({
      id: "bom",
      label: "Bill of materials with quantities and sources",
      pass: bomOk,
      detail: bomOk
        ? `${project.bom.length} parts listed.`
        : "Add every part with a quantity, unit cost and source in Evidence. Hardware ships need a bill of materials.",
    });
  }

  const summaryOk = project.summary.trim().length > 0;
  items.push({
    id: "summary",
    label: "Summary written",
    pass: summaryOk,
    detail: summaryOk ? "A project summary is set." : "Write a project summary in Details.",
  });

  const aiOk = aiUse.length > 0;
  items.push({
    id: "ai",
    label: "AI use declared",
    pass: aiOk,
    detail: aiOk ? `Declared: ${aiUse.join(", ")}.` : "Every ship declares how AI was used (Plan 01 section 14). Choose No AI if you used none.",
  });

  return { items, canSubmit: items.every((item) => item.pass), newHours };
}

export function createShip(input: {
  id: string;
  project: Project;
  version: string;
  changes: string;
  aiUse: string[];
  newHours: number;
  now: number;
}): Ship {
  return {
    id: input.id,
    projectId: input.project.id,
    projectName: input.project.name,
    version: input.version,
    state: "submitted",
    submittedAt: input.now,
    submittedHours: input.newHours,
    approvedHours: null,
    aiUse: input.aiUse,
    changes: input.changes.trim(),
    teamNote: "",
    reviews: [],
    flags: [],
    snapshot: null,
    snapshotCount: 0,
    great: false,
    payout: null,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Gates

export interface ShipCtx {
  now: number;
  /** Time of the latest journal entry on the ship's project, or null when there is none. */
  latestJournalAt: number | null;
  /** Valid reviews of other ships this builder has completed. */
  reviewsDone: number;
  /** Whether the next payout carries the 5% repeated-false-flag deduction. */
  penaltyPending: boolean;
}

export interface LockReadiness {
  countable: number;
  needed: number;
  enoughReviews: boolean;
  journal: ReturnType<typeof journalGate>;
  ready: boolean;
}

/** Plan 22 section 2: the award locks only when 12 countable reviews exist AND the latest journal is 24 hours old. */
export function lockReadiness(ship: Pick<Ship, "reviews">, ctx: Pick<ShipCtx, "now" | "latestJournalAt">): LockReadiness {
  const countable = countableReviews(ship.reviews).length;
  const journal = journalGate(ctx.latestJournalAt, ctx.now);
  const enoughReviews = countable >= RULES.reviewsPerShip;
  return { countable, needed: RULES.reviewsPerShip, enoughReviews, journal, ready: enoughReviews && journal.met };
}

export function pendingFlags(ship: Pick<Ship, "flags">): Flag[] {
  return ship.flags.filter((flag) => flag.status === "pending");
}

export function flagWindowOpen(ship: Pick<Ship, "state" | "snapshot">, now: number): boolean {
  return ship.state === "flag_window" && ship.snapshot !== null && now < ship.snapshot.windowEndsAt;
}

/** Why a ship in the flag window cannot be paid yet. Empty means it can be paid now. */
export function payoutBlockers(ship: Ship, ctx: ShipCtx): string[] {
  if (ship.state === "paid") return [];
  if (ship.state !== "flag_window" || !ship.snapshot) return ["The award has not locked yet."];
  const out: string[] = [];
  const left = (ship.snapshot.windowEndsAt - ctx.now) / HOUR_MS;
  if (left > 0) out.push(`The ${RULES.flagWindowHours}-hour flag window is open for ${roundHours(left)} more hours.`);
  const pending = pendingFlags(ship).length;
  if (pending > 0) out.push(`${pending} pending flag${pending === 1 ? "" : "s"} hold payout until a moderator resolves ${pending === 1 ? "it" : "them"}.`);
  if (ctx.reviewsDone < RULES.reviewsOwed) {
    const owed = RULES.reviewsOwed - ctx.reviewsDone;
    out.push(`You owe ${owed} more review${owed === 1 ? "" : "s"} of other ships before your own payout.`);
  }
  return out;
}

/** Plan 22 section 2: 5% off the final Ore payout when the penalty is pending. Rounded to a whole Ore (draft). */
export function applyPenalty(gross: number, pending: boolean): { penalty: number; net: number } {
  const penalty = pending ? Math.round((gross * RULES.penaltyPercent) / 100) : 0;
  return { penalty, net: gross - penalty };
}

// ---------------------------------------------------------------------------------------------------------------
// Award idempotency

/** One award per ship and snapshot. A new snapshot (after an upheld flag) is a new key. */
export function awardKey(shipId: string, snapshotId: string): string {
  return `ship:${shipId}:snapshot:${snapshotId}`;
}

/** True when this key has not been credited yet. */
export function shouldCredit(creditedKeys: readonly string[], key: string): boolean {
  return !creditedKeys.includes(key);
}

// ---------------------------------------------------------------------------------------------------------------
// Flag penalty

/**
 * Plan 22 section 2: three rejected flags within ten hours deduct 5% from the next final payout.
 * Returns the remaining timestamps and whether this rejection tripped the penalty. The counter resets when it trips
 * (what happens on a fourth rejection is open in the plans, so the preview starts counting again).
 */
export function registerRejectedFlag(log: readonly number[], at: number): { log: number[]; triggered: boolean } {
  const cutoff = at - RULES.penaltyWindowHours * HOUR_MS;
  const recent = [...log.filter((time) => time >= cutoff && time <= at), at];
  if (recent.length >= RULES.penaltyRejectedFlags) return { log: [], triggered: true };
  return { log: recent, triggered: false };
}

export function emptyPenalty(): FlagPenaltyState {
  return { rejectedAt: [], pending: false };
}

// ---------------------------------------------------------------------------------------------------------------
// State machine

export type ShipAction =
  | { type: "pickup" }
  | { type: "approve"; approvedHours: number }
  | { type: "requestChanges"; note: string }
  | { type: "reject"; note: string }
  | { type: "resubmit" }
  | { type: "addReview"; review: ReceivedReview }
  | { type: "flag"; flagId: string; reviewId: string; reason: string }
  | { type: "resolveFlag"; flagId: string; outcome: "upheld" | "rejected" }
  | { type: "setGreat"; value: boolean };

export type ShipEvent =
  | { type: "locked"; snapshotId: string; windowEndsAt: number }
  | { type: "paid"; key: string; gross: number; penalty: number; net: number; penaltyApplied: boolean }
  | { type: "flag_rejected"; at: number }
  | { type: "flag_upheld"; reviewId: string };

export interface ShipResult {
  ship: Ship;
  events: ShipEvent[];
  error: string | null;
}

function fail(ship: Ship, error: string): ShipResult {
  return { ship, events: [], error };
}

function done(ship: Ship, events: ShipEvent[] = []): ShipResult {
  return { ship, events, error: null };
}

type ActionOf<T extends ShipAction["type"]> = Extract<ShipAction, { type: T }>;
type ActionCtx = Pick<ShipCtx, "now">;
type ActionHandlers = { [T in ShipAction["type"]]: (ship: Ship, action: ActionOf<T>, ctx: ActionCtx) => ShipResult };

function pickup(ship: Ship): ShipResult {
  if (ship.state !== "submitted") return fail(ship, "Only a submitted ship can go to the team check.");
  return done({ ...ship, state: "team_check" });
}

function approve(ship: Ship, action: ActionOf<"approve">): ShipResult {
  if (ship.state !== "team_check") return fail(ship, "The team can approve a ship only during the team check.");
  const hours = roundHours(action.approvedHours);
  if (!(hours > 0) || hours > ship.submittedHours + 1e-9) {
    return fail(ship, `Approved hours must be above 0 and at most the ${ship.submittedHours} h submitted.`);
  }
  return done({ ...ship, state: "peer_review", approvedHours: hours });
}

function requestChanges(ship: Ship, action: ActionOf<"requestChanges">): ShipResult {
  if (ship.state !== "team_check") return fail(ship, "Changes can be requested only during the team check.");
  return done({ ...ship, state: "changes_requested", teamNote: action.note.trim() });
}

function reject(ship: Ship, action: ActionOf<"reject">): ShipResult {
  if (ship.state !== "team_check") return fail(ship, "A ship can be rejected only during the team check.");
  return done({ ...ship, state: "rejected", teamNote: action.note.trim() });
}

function resubmit(ship: Ship, _action: ActionOf<"resubmit">, ctx: ActionCtx): ShipResult {
  if (ship.state !== "changes_requested") return fail(ship, "Only a ship with requested changes can be resubmitted.");
  return done({ ...ship, state: "submitted", submittedAt: ctx.now, teamNote: "" });
}

function addReview(ship: Ship, action: ActionOf<"addReview">): ShipResult {
  if (ship.state !== "peer_review" && ship.state !== "flag_window") {
    return fail(ship, "Peer reviews start after the team check and stop counting once paid.");
  }
  if (ship.reviews.some((review) => review.id === action.review.id)) return fail(ship, "That review is already on the ship.");
  return done({ ...ship, reviews: [...ship.reviews, action.review] });
}

/** Why this flag cannot be raised, or null when it can. */
function flagError(ship: Ship, action: ActionOf<"flag">, reason: string, now: number): string | null {
  if (!flagWindowOpen(ship, now)) return "Reviews can be flagged only while the 24-hour flag window is open.";
  if (!ship.snapshot || !ship.snapshot.reviewIds.includes(action.reviewId)) return "Only a counted review can be flagged.";
  if (ship.flags.some((flag) => flag.reviewId === action.reviewId)) return "That review has already been flagged.";
  if (!reason) return "Say why you are flagging this review.";
  if (reason.length > 1000) return "Keep the flag reason to 1,000 characters or fewer.";
  return null;
}

function raiseFlag(ship: Ship, action: ActionOf<"flag">, ctx: ActionCtx): ShipResult {
  const reason = action.reason.trim();
  const error = flagError(ship, action, reason, ctx.now);
  if (error) return fail(ship, error);
  const flag: Flag = { id: action.flagId, reviewId: action.reviewId, reason, at: ctx.now, status: "pending" };
  return done({ ...ship, flags: [...ship.flags, flag] });
}

function resolveFlag(ship: Ship, action: ActionOf<"resolveFlag">, ctx: ActionCtx): ShipResult {
  const flag = ship.flags.find((f) => f.id === action.flagId);
  if (!flag || flag.status !== "pending") return fail(ship, "That flag is not pending.");
  const flags = ship.flags.map((f) => (f.id === flag.id ? { ...f, status: action.outcome, resolvedAt: ctx.now } : f));
  if (action.outcome === "rejected") return done({ ...ship, flags }, [{ type: "flag_rejected", at: ctx.now }]);
  // Upheld: the review is discarded, another peer review is needed, and a new snapshot and window follow (Plan 22 section 2).
  const reviews = ship.reviews.map((review) => (review.id === flag.reviewId ? { ...review, discarded: true } : review));
  const state = ship.state === "flag_window" ? "peer_review" : ship.state;
  return done({ ...ship, flags, reviews, snapshot: null, state }, [{ type: "flag_upheld", reviewId: flag.reviewId }]);
}

function setGreat(ship: Ship, action: ActionOf<"setGreat">): ShipResult {
  if (ship.state === "flag_window" || ship.state === "paid") {
    return fail(ship, "The Great Signal claim has to be settled before the award locks.");
  }
  return done({ ...ship, great: action.value });
}

const ACTION_HANDLERS: ActionHandlers = {
  pickup,
  approve,
  requestChanges,
  reject,
  resubmit,
  addReview,
  flag: raiseFlag,
  resolveFlag,
  setGreat,
};

/** Applies one action. Never mutates its input. `ctx.now` stamps anything the action creates. */
export function applyShipAction(ship: Ship, action: ShipAction, ctx: ActionCtx): ShipResult {
  const handler = ACTION_HANDLERS[action.type] as (ship: Ship, action: ShipAction, ctx: ActionCtx) => ShipResult;
  return handler(ship, action, ctx);
}

/**
 * Moves a ship through every automatic transition its inputs allow: lock the award snapshot when both gates hold,
 * then pay once the flag window has closed, no flag is pending and the review duty is done.
 */
export function evaluateShip(input: Ship, ctx: ShipCtx): { ship: Ship; events: ShipEvent[] } {
  let ship = input;
  const events: ShipEvent[] = [];

  if (ship.state === "peer_review" && ship.approvedHours !== null) {
    const readiness = lockReadiness(ship, ctx);
    if (readiness.ready) {
      const snapshotId = `s${ship.snapshotCount + 1}`;
      const snapshot = buildSnapshot({
        id: snapshotId,
        reviews: ship.reviews,
        hours: ship.approvedHours,
        great: ship.great,
        lockedAt: ctx.now,
      });
      if (snapshot) {
        ship = { ...ship, state: "flag_window", snapshot, snapshotCount: ship.snapshotCount + 1 };
        events.push({ type: "locked", snapshotId, windowEndsAt: snapshot.windowEndsAt });
      }
    }
  }

  if (ship.state === "flag_window" && ship.snapshot && payoutBlockers(ship, ctx).length === 0) {
    const gross = oreFor(ship.snapshot.hours, ship.snapshot.multiplier);
    const { penalty, net } = applyPenalty(gross, ctx.penaltyPending);
    const key = awardKey(ship.id, ship.snapshot.id);
    ship = { ...ship, state: "paid", payout: { key, gross, penalty, net, paidAt: ctx.now } };
    events.push({ type: "paid", key, gross, penalty, net, penaltyApplied: penalty > 0 });
  }

  return { ship, events };
}

// ---------------------------------------------------------------------------------------------------------------
// Stepper

export const STEP_LABELS = ["Draft", "Submitted", "Team check", "Peer review", "Award locked", "Flag window", "Paid"] as const;

export type StepStatus = "done" | "current" | "todo" | "blocked";

export interface StepView {
  label: (typeof STEP_LABELS)[number];
  status: StepStatus;
  detail: string;
}

export function stepIndexFor(state: ShipState | null): number {
  switch (state) {
    case null:
      return 0;
    case "submitted":
      return 1;
    case "team_check":
    case "changes_requested":
    case "rejected":
      return 2;
    case "peer_review":
      return 3;
    case "flag_window":
      return 5;
    case "paid":
      return 6;
  }
}

/** The seven steps of the pipeline, with status text that does not depend on colour. */
export function stepperModel(ship: Ship | null, ctx: Pick<ShipCtx, "now" | "latestJournalAt">): StepView[] {
  const current = stepIndexFor(ship?.state ?? null);
  const blocked = ship?.state === "changes_requested" || ship?.state === "rejected";
  const countable = ship ? countableReviews(ship.reviews).length : 0;
  const details: string[] = [
    ship ? "Submitted" : "Checklist not submitted yet",
    ship ? "Waiting for the team" : "",
    ship?.state === "changes_requested"
      ? "Changes requested"
      : ship?.state === "rejected"
        ? "Rejected, no payout"
        : "Fit and validity check",
    `${Math.min(countable, RULES.reviewsPerShip)} of ${RULES.reviewsPerShip} countable reviews`,
    ship?.snapshot ? "Snapshot recorded" : "12 reviews and a 24 h old journal",
    ship?.snapshot
      ? ctx.now < ship.snapshot.windowEndsAt
        ? `${roundHours((ship.snapshot.windowEndsAt - ctx.now) / HOUR_MS)} h left`
        : "Closed"
      : `${RULES.flagWindowHours} h after the lock`,
    ship?.payout ? `${ship.payout.net} Ore credited` : "Ore after the window closes",
  ];
  return STEP_LABELS.map((label, index) => {
    let status: StepStatus = "todo";
    if (index < current) status = "done";
    else if (index === current) status = blocked ? "blocked" : ship?.state === "paid" ? "done" : "current";
    // The lock step is complete as soon as the snapshot exists, even while the flag window is the current step.
    if (index === 4 && ship?.snapshot && current >= 5) status = "done";
    return { label, status, detail: details[index] };
  });
}

/** One sentence that names the current step, for a live region and for screen readers. */
export function stepperSummary(model: readonly StepView[]): string {
  const idx = model.findIndex((step) => step.status === "current" || step.status === "blocked");
  if (idx === -1) return `All ${model.length} steps complete.`;
  const step = model[idx];
  return `Step ${idx + 1} of ${model.length}: ${step.label}${step.status === "blocked" ? " (stopped)" : ""}. ${step.detail}.`;
}
