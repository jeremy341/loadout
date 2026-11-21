// Who may do what to one ship, and what each move leads to. Pure: no database, no clock of its own (the caller passes `now`).
// The server actions in review-actions.ts load the facts, call these, then write. Pixl's authorizeProjectAction, reviewProject
// gates, holdReview and releaseHold (references/pixl/apps/internal-dashboard/app/actions.ts) are the source; the owner's choices
// are in plans/proposals/review-rules.md. Every function answers { ok: true, ... } or { ok: false, message } in plain words.
//
// API:
//   kindOfTrack(track)                       "hardware" for the Hardware track, else "software" (the desk's two queues)
//   stageOf(ship)                            queue | first-pass | second-pass | proposed-ban | closed
//   authorizeShip(actor, ship, opts?)        Pixl authorizeProjectAction: reviewer, queue scope, self and collaborator and pending invite
//   mayClaim(actor, ship, now)               a claim: queue and role per stage, assignment lock, other reviewer's live claim, hold
//   mayTriage(actor, ship, now)              fraud triage: second pass only, final reviewer or owner, own live claim, no hold
//   mayGiveVerdict(actor, ship, verdict, now) first pass, second pass and proposed ban gates, with what the verdict does
//   secondPassVerdictAllowed(triage, kind)   null blocks everything; fraud allows needs_changes and a ban only
//   mayHold(actor, ship) / mayRelease(actor, ship)
//   mayDecideJournal(actor, ship, now)       per-journal decisions need the live claim at either pass
//   mayAddNote(actor, ship)                  a review note: a ship that has been submitted, not a draft or a banned project
//   mayCorrect(actor, ship) / mayUnship(actor, ship)
//   NEEDS_CHANGES_REASONS, reasonCodeOf(raw)
import { canReleaseHold, claimState, assignmentWindow, canConfirmBan, canGiveSecondPassVerdict, canHold, canReview, placeHold, type Checked, type FraudTriage, type Hold } from "./review-rules";
import { proposedBanDecision, queueAllows, type ReviewQueueScope } from "@/lib/reviewer/access";

export type DeskKind = "software" | "hardware";
export const kindOfTrack = (track: string | null | undefined): DeskKind => (track === "Hardware" ? "hardware" : "software");

export type ReviewActor = { id: string; isOwner: boolean; isReviewer: boolean; canSecondPass: boolean; reviewQueues: ReviewQueueScope };

export type ShipFacts = {
  ownerId: string;
  kind: DeskKind;
  status: string;
  heldAt: Date | null;
  heldBy: string | null;
  holdReason?: string | null;
  claimedBy: string | null;
  claimedAt: Date | null;
  claimHeartbeatAt: Date | null;
  triage: string | null;
  assignedTo: string | null;
  reshippedAt: Date | null;
  proposedBanBy: string | null;
  // There is no collaborator table yet, so the loader returns empty lists. The rules are here for when there is.
  collaboratorIds: readonly string[];
  pendingInviteIds: readonly string[];
};

export type Stage = "queue" | "first-pass" | "second-pass" | "proposed-ban" | "closed";

export function stageOf(ship: Pick<ShipFacts, "status" | "proposedBanBy">): Stage {
  switch (ship.status) {
    case "submitted":
      return "queue";
    case "in-review":
      return "first-pass";
    case "second-pass":
      return ship.proposedBanBy ? "proposed-ban" : "second-pass";
    default:
      return "closed";
  }
}

const deny = (message: string): { ok: false; message: string } => ({ ok: false, message });
const yes = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });

const isFinalReviewer = (actor: ReviewActor): boolean => actor.isOwner || actor.canSecondPass;

// Pixl authorizeProjectAction: a reviewer (an owner set to no_review is not one), inside their queue, and not on a ship they own or
// collaborate on or are invited to. `allowOwn` is the hold exception: the ship's own owner may hold it, a collaborator may not.
export function authorizeShip(actor: ReviewActor, ship: Pick<ShipFacts, "ownerId" | "kind" | "collaboratorIds" | "pendingInviteIds">, opts: { allowOwn?: boolean; ownMessage?: string } = {}): Checked<true> {
  if (!actor.isReviewer) return deny("Your account is set to not review.");
  if (!queueAllows(actor.reviewQueues, ship.kind)) return deny("This project isn't in your review queue.");
  const reviewerId = actor.id;
  if (opts.allowOwn) {
    if (!canHold({ reviewerId, ownerId: ship.ownerId, collaboratorIds: ship.collaboratorIds, pendingInviteIds: ship.pendingInviteIds })) return deny(opts.ownMessage ?? "You can't review a project you collaborate on.");
    return yes(true);
  }
  if (!canReview({ reviewerId, ownerId: ship.ownerId, collaboratorIds: ship.collaboratorIds, pendingInviteIds: ship.pendingInviteIds })) return deny(opts.ownMessage ?? "You can't review a project you own or collaborate on.");
  return yes(true);
}

function claimOf(ship: ShipFacts, actor: ReviewActor, now: Date) {
  return claimState({ reviewerId: ship.claimedBy, claimedAt: ship.claimedAt, lastHeartbeatAt: ship.claimHeartbeatAt, now, viewerId: actor.id });
}

// The first pass is closed to everyone but the reviewer who asked for changes while their 72 hour window runs. Owners are never
// locked out (Pixl reviewAssignment.ts lockedForViewer).
function assignmentLocked(actor: ReviewActor, ship: ShipFacts, now: Date): boolean {
  if (!ship.assignedTo || ship.assignedTo === actor.id || actor.isOwner) return false;
  return !assignmentWindow({ reshippedAt: ship.reshippedAt, now }).backToQueue;
}

const HOLD_MESSAGE = "This ship is on hold. Release the hold before giving a verdict.";

export function mayClaim(actor: ReviewActor, ship: ShipFacts, now: Date): Checked<{ stage: Stage }> {
  const stage = stageOf(ship);
  if (stage === "closed") return deny("This project isn't awaiting review anymore.");
  const own = authorizeShip(actor, ship);
  if (!own.ok) return own;
  if (ship.heldAt) return deny("This project is on hold, so it can't be claimed.");
  if (stage !== "queue" && stage !== "first-pass" && !isFinalReviewer(actor)) return deny("Only an owner or a final reviewer works the second pass.");
  if ((stage === "queue" || stage === "first-pass") && assignmentLocked(actor, ship, now)) {
    return deny("This project is reserved for the reviewer who requested its changes. It goes back to the shared queue if they don't review it within 3 days of the re-ship.");
  }
  const claim = claimOf(ship, actor, now);
  if (claim.blocksViewer) return deny("Another reviewer is already reviewing this.");
  return yes({ stage });
}

// The loader gives the person's own live claim; used by the gates below.
function holdsClaim(actor: ReviewActor, ship: ShipFacts, now: Date): boolean {
  const claim = claimOf(ship, actor, now);
  return claim.state === "active" && claim.holder === actor.id;
}

export function secondPassVerdictAllowed(triage: string | null | undefined, kind: "approve" | "needs_changes" | "banned"): Checked<true> {
  if (triage === "fraud") {
    if (kind === "approve") return deny("The fraud triage says Fraud, so this can't be approved. Ask for changes or ban it.");
    return yes(true);
  }
  return canGiveSecondPassVerdict({ triage: triage as FraudTriage | null | undefined });
}

export function mayTriage(actor: ReviewActor, ship: ShipFacts, now: Date): Checked<true> {
  if (stageOf(ship) !== "second-pass") return deny("A fraud triage belongs to the second pass.");
  const own = authorizeShip(actor, ship);
  if (!own.ok) return own;
  if (!isFinalReviewer(actor)) return deny("Only a final reviewer or an owner can make the fraud triage.");
  // A recorded triage is final: a Fraud call cannot be flipped to Not fraud to unlock an approval. It is cleared only when the
  // ship starts a new cycle (picked up again, or a ban proposal overturned).
  if (ship.triage) return deny("A fraud triage is already recorded on this ship and can't be changed.");
  if (ship.heldAt) return deny(HOLD_MESSAGE);
  if (!holdsClaim(actor, ship, now)) return deny("Start reviewing first, or reclaim this project if your lock expired.");
  return yes(true);
}

export type VerdictKind = "approve" | "needs_changes" | "banned";
export type VerdictPlan = {
  stage: "first-pass" | "second-pass" | "proposed-ban";
  // first-pass: an approval is a recommendation, a ban is only a proposal. second-pass: the verdict is final.
  final: boolean;
  // A first-pass ban, or a ban proposal being made.
  proposal: boolean;
  // A non-owner (or owner) overturning a ban proposal with an approval: back to the second pass, no approval yet.
  reroute: boolean;
};

export function mayGiveVerdict(actor: ReviewActor, ship: ShipFacts, kind: VerdictKind, now: Date): Checked<VerdictPlan> {
  const stage = stageOf(ship);
  if (stage === "queue" || stage === "closed") return deny("This project isn't awaiting review anymore.");
  const own = authorizeShip(actor, ship);
  if (!own.ok) return own;
  if (ship.heldAt) return deny(HOLD_MESSAGE);
  if (stage === "first-pass" && assignmentLocked(actor, ship, now)) return deny("This project is reserved for the reviewer who requested its changes.");
  if (!holdsClaim(actor, ship, now)) return deny("Start reviewing first, or reclaim this project if your lock expired.");

  if (stage === "first-pass") {
    return yes({ stage, final: false, proposal: kind === "banned", reroute: false });
  }
  if (!isFinalReviewer(actor)) return deny("Only an owner or a final reviewer gives the final verdict, in the second pass.");

  if (stage === "proposed-ban") {
    const verdict = kind === "banned" ? "ban" : kind === "approve" ? "approved" : "needs_changes";
    const decision = proposedBanDecision({ isOwner: actor.isOwner, canSecondPass: actor.canSecondPass, personId: actor.id }, verdict, { own: false, proposedById: ship.proposedBanBy ?? "" });
    if (decision.kind === "deny") return deny(decision.reason);
    if (decision.kind === "needs_changes") return yes({ stage, final: true, proposal: false, reroute: false });
    if (kind === "banned") {
      const confirmed = canConfirmBan({ confirmerIsOwner: actor.isOwner });
      if (!confirmed.ok) return confirmed;
      return yes({ stage, final: true, proposal: false, reroute: false });
    }
    // An approval overturns the proposal. The ship goes back to the second pass, where the triage and approval happen normally.
    return yes({ stage, final: false, proposal: false, reroute: true });
  }

  const gate = secondPassVerdictAllowed(ship.triage, kind);
  if (!gate.ok) return gate;
  if (kind === "banned") {
    const confirmed = canConfirmBan({ confirmerIsOwner: actor.isOwner });
    if (!confirmed.ok) return confirmed;
  }
  return yes({ stage, final: true, proposal: false, reroute: false });
}

// Any reviewer may hold; the ship's own owner may, a collaborator may not (review-rules.md section 3).
export function mayHold(actor: ReviewActor, ship: ShipFacts, reason: string, now: Date): Checked<Hold> {
  const own = authorizeShip(actor, ship, { allowOwn: true });
  if (!own.ok) return own;
  if (stageOf(ship) === "closed") return deny("Only a ship waiting for review can be held.");
  const existing: Hold | null = ship.heldAt && ship.heldBy ? { by: ship.heldBy, reason: ship.holdReason ?? "", at: ship.heldAt } : null;
  const placed = placeHold({ reason, by: actor.id, now, existing, isOwner: actor.isOwner });
  if (!placed.ok && placed.message.startsWith("Another")) return deny("Another reviewer already holds this review. Only they, or an owner, can change it.");
  return placed;
}

export function mayRelease(actor: ReviewActor, ship: ShipFacts): Checked<true> {
  if (!ship.heldAt) return deny("Nothing is held.");
  const hold: Hold = { by: ship.heldBy ?? "", reason: ship.holdReason ?? "", at: ship.heldAt };
  if (!canReleaseHold({ hold, releaserId: actor.id, isOwner: actor.isOwner })) return deny("Only the reviewer who held this, or an owner, can release it.");
  return yes(true);
}

export function mayDecideJournal(actor: ReviewActor, ship: ShipFacts, now: Date): Checked<true> {
  const stage = stageOf(ship);
  if (stage !== "first-pass" && stage !== "second-pass") return deny("Journal decisions are made while a ship is in review.");
  const own = authorizeShip(actor, ship);
  if (!own.ok) return own;
  if (ship.heldAt) return deny(HOLD_MESSAGE);
  if (stage === "second-pass" && !isFinalReviewer(actor)) return deny("Only an owner or a final reviewer works the second pass.");
  if (!holdsClaim(actor, ship, now)) return deny("Start reviewing first, or reclaim this project if your lock expired.");
  return yes(true);
}

// A review note is written on a ship that is in the review pipeline or has been through it (queue to approved). Not on a draft, a
// banned project, or a status the desk does not know: those would leave audit rows about nothing.
export const NOTE_STATUSES = ["submitted", "in-review", "second-pass", "needs-changes", "approved"] as const;
export function mayAddNote(actor: ReviewActor, ship: ShipFacts): Checked<true> {
  const own = authorizeShip(actor, ship);
  if (!own.ok) return own;
  if (!(NOTE_STATUSES as readonly string[]).includes(ship.status)) return deny("Notes can only be added to a project that has been submitted for review and is not banned.");
  return yes(true);
}

// Corrections after approval: a final reviewer or an owner, not on their own ship, only on an approved project.
export function mayCorrect(actor: ReviewActor, ship: ShipFacts): Checked<true> {
  if (ship.status !== "approved") return deny("Only an approved project can have its hours corrected.");
  const own = authorizeShip(actor, ship);
  if (!own.ok) return own;
  if (!isFinalReviewer(actor)) return deny("Only an owner or a final reviewer can correct approved hours.");
  if (ship.heldAt) return deny(HOLD_MESSAGE);
  return yes(true);
}

// Unship (LOADOUT): an approved project only, owner only. Pixl lets a final reviewer unship from the second pass; LOADOUT narrows it.
export function mayUnship(actor: ReviewActor, ship: ShipFacts): Checked<true> {
  if (ship.status !== "approved") return deny("Only an approved project can be unshipped.");
  const own = authorizeShip(actor, ship);
  if (!own.ok) return own;
  if (!actor.isOwner) return deny("Only an owner can unship an approved project.");
  return yes(true);
}

export const NEEDS_CHANGES_REASONS = ["track", "readme", "hours", "ai", "other"] as const;
export type ReasonCode = (typeof NEEDS_CHANGES_REASONS)[number];
export function reasonCodeOf(raw: unknown): ReasonCode {
  return (NEEDS_CHANGES_REASONS as readonly string[]).includes(raw as string) ? (raw as ReasonCode) : "other";
}
