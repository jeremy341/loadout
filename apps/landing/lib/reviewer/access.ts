// Who may do what on the reviewer site. Pure functions only (no Next, no database), so the rules can be unit tested.
// lib/platform/session.ts feeds them the signed-in person, the owner list from the environment and the person's role grants.
//
// Adapted from Pixl's internal dashboard (references/pixl/apps/internal-dashboard/lib/roles.ts): five roles, nothing else.
// - Owner:     LOADOUT_OWNER_EMAILS only (the environment). Everything, including managing staff. No table grants it, so
//              nothing written to the database can create an owner.
// - Reviewer:  a "reviewer" role grant. It may carry the review markers below and nothing else.
// - Helper:    a "helper" grant (support tickets).
// - Fulfiller: a "fulfiller" grant (the shop-order queue).
// A person with none of these has no access at all, and the reviewer site answers 404 for them.
// - Integrity reviewer (Pixl's Fraud reviewer): a "fraud_review" grant with no reviewer grant. Sees the Integrity reviews tab
//              (AI-usage and double-dip flags) and nothing else: no queue, no verdicts.
// Markers on a reviewer (Pixl's names, LOADOUT spelling): second_pass, reviewer_hardware_only, reviewer_software_only,
// edit_submission, ai_draft, full_queue, no_review. Not ported: the game-side roles, Slack ids, and Pixl's removed roles.
//
// The final (second-pass) reviewer list is the second_pass grant plus an optional environment override,
// LOADOUT_SECOND_PASS_EMAILS (comma separated). The override only promotes someone who is already a reviewer; it never
// makes a reviewer, and no_review still wins.
//
// Self-review: a reviewer may never review a ship they own (owners included). A collaborator or a pending invitee is also
// blocked, except under a SelfReviewException: an unexpired grant scoped to that one project (projectId set). A grant with no
// project never lifts self-review, and an exception never lets anyone review a ship they own. Grants are written by
// records-data.ts grantSelfReviewException, which is audited.

import { buyerDetailsVisible, isOwnPurchase } from "./buyer-rules";

export const REVIEWER = "reviewer";
export const HELPER = "helper";
export const FULFILLER = "fulfiller";
// Promotes a reviewer to final (second-pass) reviewer.
export const SECOND_PASS = "second_pass";
// Restrict a reviewer to one queue. Neither marker means both queues.
export const HARDWARE_ONLY = "reviewer_hardware_only";
export const SOFTWARE_ONLY = "reviewer_software_only";
// Takes reviewing away from an owner, whose review right is otherwise implied.
export const NO_REVIEW = "no_review";
// May edit a submission's title, links and description (final reviewers and owners always may).
export const EDIT_SUBMISSION = "edit_submission";
// May generate the prepared draft note (owners always may).
export const AI_DRAFT = "ai_draft";
// May open any ship in the first-pass queue, not only the first page of it (owners always may).
export const FULL_QUEUE = "full_queue";
// The integrity reviewer: read-only access to the integrity tab. Final reviewers and owners see that tab anyway.
export const FRAUD_REVIEW = "fraud_review";

// Every role-grant value the site reads. Anything else (including the old "staff" value) grants nothing.
export const STAFF_ROLES = [
  REVIEWER,
  SECOND_PASS,
  HARDWARE_ONLY,
  SOFTWARE_ONLY,
  EDIT_SUBMISSION,
  AI_DRAFT,
  FULL_QUEUE,
  NO_REVIEW,
  FRAUD_REVIEW,
  HELPER,
  FULFILLER,
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type ReviewQueueScope = "software" | "hardware" | "both";

export function reviewQueueScopeFor(roles: readonly string[]): ReviewQueueScope {
  if (roles.includes(HARDWARE_ONLY)) return "hardware";
  if (roles.includes(SOFTWARE_ONLY)) return "software";
  return "both";
}

export function staffRolesOnly(roles: readonly string[] | null | undefined): StaffRole[] {
  const allowed = STAFF_ROLES as readonly string[];
  return [...new Set((roles ?? []).filter((role) => allowed.includes(role)))] as StaffRole[];
}

// A comma-separated list from the environment, trimmed and lower-cased (emails compare case-insensitively).
export function idsFromEnv(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export type AccessPerson = { id: string; email: string };

export type RoleInputs = {
  ownerEmails: string[]; // LOADOUT_OWNER_EMAILS, lower-cased
  roles: readonly string[]; // the person's role grants
  secondPassEmails?: readonly string[]; // LOADOUT_SECOND_PASS_EMAILS, lower-cased (see secondPassFromEnv)
};

// The environment override for final reviewers. Read with the same comma-separated, lower-cased rules as the owner list.
export function secondPassFromEnv(raw: string | undefined = process.env.LOADOUT_SECOND_PASS_EMAILS): string[] {
  return idsFromEnv(raw);
}

export type ReviewerAccess = {
  personId: string;
  isOwner: boolean;
  isReviewer: boolean;
  isHelper: boolean;
  isFulfiller: boolean;
  canSecondPass: boolean;
  // Pixl's canEditSubmission, canAiDraft, canOpenFullQueue and canFraudReview (the integrity tab).
  canEditSubmission: boolean;
  canAiDraft: boolean;
  canOpenFullQueue: boolean;
  canFraudReview: boolean;
  reviewQueues: ReviewQueueScope;
};

// null means no role at all: the person cannot open the site.
export function resolveAccess(person: AccessPerson, input: RoleInputs): ReviewerAccess | null {
  const roles = staffRolesOnly(input.roles);
  const isOwner = input.ownerEmails.includes(person.email.trim().toLowerCase());
  const reviewBlocked = roles.includes(NO_REVIEW);
  const isReviewer = !reviewBlocked && (isOwner || roles.includes(REVIEWER));
  // Final reviewers: an owner, a reviewer with the second_pass marker, or a reviewer named in the environment override.
  const listedForSecondPass = (input.secondPassEmails ?? []).includes(person.email.trim().toLowerCase());
  const canSecondPass = isReviewer && (isOwner || roles.includes(SECOND_PASS) || listedForSecondPass);
  const access: ReviewerAccess = {
    personId: person.id,
    isOwner,
    isReviewer,
    isHelper: isOwner || roles.includes(HELPER),
    isFulfiller: isOwner || roles.includes(FULFILLER),
    canSecondPass,
    // Pixl: owners and final reviewers may edit; a reviewer needs the marker. Owners may draft; a reviewer needs the marker.
    canEditSubmission: isOwner || canSecondPass || (isReviewer && roles.includes(EDIT_SUBMISSION)),
    canAiDraft: isOwner || (isReviewer && roles.includes(AI_DRAFT)),
    canOpenFullQueue: isOwner || (isReviewer && roles.includes(FULL_QUEUE)),
    // The integrity tab needs no reviewer grant: the marker alone is enough, and owners and final reviewers see it anyway.
    canFraudReview: isOwner || canSecondPass || roles.includes(FRAUD_REVIEW),
    reviewQueues: reviewQueueScopeFor(roles),
  };
  return isOwner || isReviewer || access.canFraudReview || access.isHelper || access.isFulfiller ? access : null;
}

// The one place a person's grants become access. The session's viewer (lib/platform/session.ts toViewer), the staff session of the
// reviewer pages and actions (reviewer-dash/lib/session.ts), superadmin and impersonation (lib/platform/impersonation.ts) all call
// this, so a role revoked in the database is revoked for every one of them on the same request. The input is the Person row's id and
// email and the raw grants read from RoleGrant; nothing else (a handle, a display name, an in-memory roster) decides access.
export type StaffPersonInput = AccessPerson & { roles: readonly string[] };

// The second-pass override is read from the environment by default, so every caller (session, impersonation, the staff guard)
// agrees on who is a final reviewer. Tests pass [] to ignore the environment.
export function resolvePersonAccess(
  person: StaffPersonInput,
  owners: readonly string[],
  secondPassEmails: readonly string[] = secondPassFromEnv(),
): ReviewerAccess | null {
  return resolveAccess(
    { id: person.id, email: person.email },
    { ownerEmails: [...owners], roles: person.roles, secondPassEmails: [...secondPassEmails] },
  );
}

// A SelfReviewException row as the review desk reads it (records-data.ts). projectId null is a person-wide grant, which
// never counts toward a ship.
export type SelfReviewGrant = { personId: string; projectId: string | null; expiresAt: Date };

// The person ids a project-scoped, unexpired grant lifts self-review for on this project. An expired, person-wide or
// other-project grant is ignored. Owners are never lifted by this (see canReview in review-rules.ts and
// review-data.ts factsForReviewer, which applies it to collaborators and invitees only).
export function selfReviewExceptionIds(grants: readonly SelfReviewGrant[], projectId: string, now: Date): string[] {
  const ids = grants
    .filter((grant) => grant.projectId === projectId && grant.expiresAt.getTime() > now.getTime())
    .map((grant) => grant.personId);
  return [...new Set(ids)];
}

// What a page, action or API route needs. "staff" means any role at all. { review: "fraud" } is the integrity tab
// (Pixl calls it fraud; the visible words change in the adjustment pass, the requirement name stays).
export type Requirement =
  | "owner"
  | "reviewer"
  | "helper"
  | "fulfiller"
  | "staff"
  | { review: "second_pass" }
  | { review: "edit_submission" }
  | { review: "fraud" }
  | { review: "ai_draft" };

// Owners pass every gate. NO_REVIEW on an owner only takes them out of the review queues (isReviewer is false), and the
// finer checks (canSecondPass) still apply inside an action.
export function satisfies(access: ReviewerAccess, requirement: Requirement): boolean {
  if (requirement === "staff" || access.isOwner) return true;
  if (requirement === "owner") return false;
  if (requirement === "reviewer") return access.isReviewer;
  if (requirement === "helper") return access.isHelper;
  if (requirement === "fulfiller") return access.isFulfiller;
  if (requirement.review === "second_pass") return access.canSecondPass;
  if (requirement.review === "fraud") return access.canFraudReview;
  if (requirement.review === "ai_draft") return access.canAiDraft;
  return access.canEditSubmission;
}

export function describeRequirement(requirement: Requirement): string {
  if (typeof requirement === "string") return requirement;
  if (requirement.review === "second_pass") return "final reviewer";
  if (requirement.review === "fraud") return "integrity reviewer";
  if (requirement.review === "ai_draft") return "draft note";
  return "edit submission";
}

// Where someone lands when they open a page they cannot see (Pixl's landingFor, same order): owners on the Overview,
// reviewers on the review queue, helpers on tickets, fulfillers on orders, integrity reviewers on the integrity tab. The
// Overview itself sends reviewers to their stats. Pixl's /fulfillment spelling is the route here, too.
export function landingFor(access: ReviewerAccess): string {
  if (access.isOwner) return "/";
  if (access.isReviewer) return "/review";
  if (access.isHelper) return "/tickets";
  if (access.isFulfiller) return "/fulfillment";
  if (access.canFraudReview) return "/review/fraud-reviews";
  return "/";
}

// A reviewer restricted to one queue may only open ships of that kind. The page and the actions both apply it.
export function queueAllows(scope: ReviewQueueScope, kind: string | null | undefined): boolean {
  return scope === "both" || kind === scope;
}

// May this person give a verdict on a ship of this kind? A reviewer (not blocked by no_review), inside their queue, and never
// on a ship they own or collaborate on (owners included). The page, the nav counts and every action use this one rule.
export function canReviewShip(access: Pick<ReviewerAccess, "isReviewer" | "reviewQueues">, ship: { kind: string | null | undefined; own?: boolean }): boolean {
  return access.isReviewer && !ship.own && queueAllows(access.reviewQueues, ship.kind);
}

// Marking a ship for the Flagship award (Pixl's Beacon) is a grading call: any reviewer who may open the ship, not its owner.
export function canFlagship(access: Pick<ReviewerAccess, "isReviewer" | "reviewQueues">, ship: { kind: string | null | undefined; own?: boolean }): boolean {
  return canReviewShip(access, ship);
}

// Self-review: the viewer owns the project or collaborates on it, so they would earn from its approval and may not review
// it. This applies to owners too. Ids are the person ids of the viewer's accounts, the owner, and the collaborators.
export function isOwnOrCollaborator(
  viewerIds: readonly string[],
  ownerId: string | null | undefined,
  collaboratorIds: readonly string[],
): boolean {
  const mine = new Set(viewerIds.filter(Boolean));
  if (mine.size === 0) return false;
  if (ownerId && mine.has(ownerId)) return true;
  return collaboratorIds.some((id) => mine.has(id));
}

// A verdict on a first-pass ban proposal, after Pixl's rule: ban decisions are owner-only; a non-owner final reviewer who
// disagrees sends the ship back into the normal pipeline; nobody decides on their own or a collaborator's project; a
// different reviewer than the proposer must decide.
export type ProposedBanDecision =
  | { kind: "deny"; reason: string }
  | { kind: "final" }
  | { kind: "reroute_to_pipeline" }
  | { kind: "needs_changes" };

export function proposedBanDecision(
  viewer: Pick<ReviewerAccess, "isOwner" | "canSecondPass" | "personId">,
  verdict: string,
  context: { own: boolean; proposedById: string },
): ProposedBanDecision {
  if (context.own) return { kind: "deny", reason: "You can't decide on a project you own or collaborate on." };
  if (!viewer.canSecondPass && !viewer.isOwner) return { kind: "deny", reason: "You don't have second-pass review access." };
  if (!viewer.isOwner && (!context.proposedById || context.proposedById === viewer.personId)) {
    return { kind: "deny", reason: "A different reviewer must confirm or overturn this ban proposal." };
  }
  if (verdict === "needs_changes") return { kind: "needs_changes" };
  if (viewer.isOwner) return { kind: "final" };
  if (verdict === "ban") return { kind: "deny", reason: "Only an owner can confirm a ban." };
  if (verdict === "approved") return { kind: "reroute_to_pipeline" };
  return { kind: "deny", reason: "Unknown verdict." };
}

// Buyer details (name, address) are shown only to the fulfiller who claimed that order, or to an owner. Every other
// fulfiller sees the destination country only, so browsing the queue does not hand out young people's addresses.
export type OrderOwnership = { claimedById?: string | null; buyerId?: string | null };

export function claimedBy(order: OrderOwnership, personId: string): boolean {
  const claimer = (order.claimedById ?? "").trim();
  return claimer !== "" && claimer === personId.trim();
}

export function canSeeBuyerDetails(order: OrderOwnership, viewer: Pick<ReviewerAccess, "isOwner" | "personId">): boolean {
  return buyerDetailsVisible({ isOwner: viewer.isOwner, claimedByViewer: claimedBy(order, viewer.personId) });
}

// A fulfiller must never claim or ship their own order. Owners are not exempt.
export function isOwnOrder(order: OrderOwnership, personId: string): boolean {
  return isOwnPurchase(order.buyerId, personId);
}
