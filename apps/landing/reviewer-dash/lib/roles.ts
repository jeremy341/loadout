// Who may do what on the internal dashboard. Pure functions only (no Next,
// no DB) so the role rules are unit-testable; lib/guard.ts feeds them the
// session, the env and the table lookups.
//
// Five roles, nothing else:
// - Owner:     ADMIN_SLACK_IDS env only. Everything, incl. managing staff.
//              There is no table that grants it, so nothing written to the
//              database (by a dashboard bug or a stolen DATABASE_URL) can
//              mint an owner.
// - Reviewer:  an `admins` row holding "review". The row may also carry the
//              review markers below and nothing else.
// - Fraud reviewer: an `admins` row holding "fraud_review" and no "review".
//              Sees the Fraud reviews tab and nothing else - no queue, no
//              verdicts. Final reviewers and owners see that tab anyway.
// - Helper:    `helpers` table (tickets).
// - Fulfiller: `fulfillers` table (shop-order queue).

export const REVIEW = "review";
// Takes reviewing away from an owner, whose review right is otherwise implied.
export const NO_REVIEW = "no_review";
// Promotes a reviewer to final (second-pass) reviewer.
export const SECOND_PASS = "second_pass";
// Lets a reviewer edit a submission's title/image/links/description.
export const EDIT_SUBMISSION = "edit_submission";
// Lets a reviewer generate the AI draft of review notes (owners always can).
export const AI_DRAFT = "ai_draft";
// Restrict a reviewer to one queue. Neither marker = both queues.
export const REVIEW_HARDWARE_ONLY = "review_hardware_only";
export const REVIEW_SOFTWARE_ONLY = "review_software_only";
// Read-only access to the Fraud reviews tab (Robert's scores).
export const FRAUD_REVIEW = "fraud_review";
// Lets a reviewer open any project in the first-pass queue, not just its first
// page (owners always can). See lib/reviewAssignment.ts.
export const FULL_QUEUE = "full_queue";

// The only values an admins.permissions array may hold. Anything else is
// ignored here and stripped by migration 0215_owner_only_admins.sql.
export const REVIEWER_PERMISSIONS = [
  REVIEW,
  SECOND_PASS,
  REVIEW_HARDWARE_ONLY,
  REVIEW_SOFTWARE_ONLY,
  EDIT_SUBMISSION,
  AI_DRAFT,
  NO_REVIEW,
  FRAUD_REVIEW,
  FULL_QUEUE,
] as const;

export type ReviewQueueScope = "software" | "hardware" | "both";

export function reviewQueueScopeFor(permissions?: string[]): ReviewQueueScope {
  if (permissions?.includes(REVIEW_HARDWARE_ONLY)) return "hardware";
  if (permissions?.includes(REVIEW_SOFTWARE_ONLY)) return "software";
  return "both";
}

export function reviewerPermsOnly(permissions: string[] | null | undefined): string[] {
  const allowed = REVIEWER_PERMISSIONS as readonly string[];
  return [...new Set((permissions ?? []).filter((p) => allowed.includes(p)))];
}

export function idsFromEnv(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface Session {
  slackId: string;
  name: string;
  exp: number;
}

export interface RoleInputs {
  ownerIds: string[]; // ADMIN_SLACK_IDS
  secondPassIds: string[]; // SECOND_PASS_SLACK_IDS
  adminPermissions: string[] | null; // the admins row, null when there is none
  isHelper: boolean;
  isFulfiller: boolean;
}

export interface AdminAccess {
  session: Session;
  isOwner: boolean;
  isReviewer: boolean;
  isHelper: boolean;
  isFulfiller: boolean;
  canSecondPass: boolean;
  canEditSubmission: boolean;
  canFraudReview: boolean;
  canAiDraft: boolean;
  canOpenFullQueue: boolean;
  reviewQueues: ReviewQueueScope;
}

// null = no role at all (can't sign in).
export function resolveAccess(session: Session, input: RoleInputs): AdminAccess | null {
  const perms = reviewerPermsOnly(input.adminPermissions);
  const isOwner = input.ownerIds.includes(session.slackId);
  const reviewBlocked = perms.includes(NO_REVIEW);
  const isReviewer = !reviewBlocked && (isOwner || perms.includes(REVIEW));
  // Final reviewers: an explicit SECOND_PASS marker, or SECOND_PASS_SLACK_IDS;
  // with that env unset, owners are the final reviewers.
  const secondPassByEnv =
    input.secondPassIds.length > 0 ? input.secondPassIds.includes(session.slackId) : isOwner;
  const canSecondPass = isReviewer && (perms.includes(SECOND_PASS) || secondPassByEnv);
  const canEditSubmission =
    isOwner || canSecondPass || (isReviewer && perms.includes(EDIT_SUBMISSION));
  const canAiDraft = isOwner || (isReviewer && perms.includes(AI_DRAFT));
  const canOpenFullQueue = isOwner || (isReviewer && perms.includes(FULL_QUEUE));
  const access: AdminAccess = {
    session,
    isOwner,
    isReviewer,
    isHelper: isOwner || input.isHelper,
    isFulfiller: isOwner || input.isFulfiller,
    canSecondPass,
    canEditSubmission,
    canFraudReview: isOwner || canSecondPass || perms.includes(FRAUD_REVIEW),
    canAiDraft,
    canOpenFullQueue,
    reviewQueues: reviewQueueScopeFor(perms),
  };
  return isOwner || isReviewer || access.canFraudReview || input.isHelper || input.isFulfiller ? access : null;
}

// What a page, action or API route needs. "staff" = any role at all.
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

// Owners pass every gate ("everything" per the spec). NO_REVIEW on an owner
// only takes them out of review-queue listings; finer checks inside an action
// (e.g. canSecondPass in reviewProject) still apply.
export function satisfies(access: AdminAccess, req: Requirement): boolean {
  if (req === "staff" || access.isOwner) return true;
  if (req === "owner") return false;
  if (req === "reviewer") return access.isReviewer;
  if (req === "helper") return access.isHelper;
  if (req === "fulfiller") return access.isFulfiller;
  if (req.review === "second_pass") return access.canSecondPass;
  if (req.review === "fraud") return access.canFraudReview;
  if (req.review === "ai_draft") return access.canAiDraft;
  return access.canEditSubmission;
}

export function describeRequirement(req: Requirement): string {
  if (typeof req === "string") return req;
  if (req.review === "second_pass") return "final reviewer";
  if (req.review === "fraud") return "fraud reviewer";
  if (req.review === "ai_draft") return "AI draft";
  return "edit submission";
}
