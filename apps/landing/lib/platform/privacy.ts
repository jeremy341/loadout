// Privacy rules for 13 to 18 year olds: the data export, the erasure request and the plan for what erasure removes. Pure: no
// database. Every function has a bun test (privacy.test.ts). The reads and writes are in privacy-data.ts.
//
// Erasure does not run here. A request waits ERASURE_DELAY_DAYS so it can be cancelled, and the deletion job (later) acts on it.
// planErasure says what that job will remove and what it keeps as ids only; the test checks both lists against prisma/schema.prisma.
//
// API:
//   ERASURE_DELAY_DAYS 7, EXPORT_FORMAT "loadout-export", EXPORT_VERSION 1
//   ERASURE_REMOVED_MODELS    models whose rows go when the Person row is deleted (direct cascade)
//   ERASURE_KEPT_MODELS       models that keep a person id as plain text (audit and moderation history): ids only
//   erasureScheduledFor(now) -> Date
//   canRequestErasure(openStatuses) -> boolean           false when a request is already open
//   canCancelErasure(status) -> boolean                  only an open request can be cancelled
//   planErasure(personId) -> { personId, removed, kept, revokesKeys }
//   toExportJson(value) -> unknown                       Dates become ISO strings; undefined keys are dropped
//   exportEnvelope(parts, now) -> object                 the top of the export bundle
//   BUILDER_SHIP_FIELDS                                  the only review-payload fields a builder may see (a whitelist)
//   REVIEWER_ONLY_SHIP_FIELDS                            desk fields that must never reach a builder (the test checks they are not whitelisted)
//   redactShipForBuilder(ship) -> object                 drops every field that is not on the builder whitelist
//   builderReviewNotes(ship, viewerId) -> { reviewNote, reviewReason } | {}   a builder sees only their own ship's notes
export const ERASURE_DELAY_DAYS = 7;
export const EXPORT_FORMAT = "loadout-export";
export const EXPORT_VERSION = 1;

const DAY_MS = 86_400_000;

// Direct cascades from Person in prisma/schema.prisma. Tables below these (ShopOrderLine, JournalMedia, ...) go with their parent.
export const ERASURE_REMOVED_MODELS: readonly string[] = Object.freeze([
  "ApiKey",
  "Block",
  "EventRsvp",
  "Fulfiller",
  "Follow",
  "HackatimeLink",
  "HackatimeProject",
  "HoursDay",
  "Impersonation",
  "Idea",
  "IdeaCollabApplication",
  "IdeaVote",
  "JournalEntry",
  "LedgerEntry",
  "Notification",
  "NotificationPref",
  "PollVote",
  "Project",
  "ProjectBookmark",
  "ProjectCollaborator",
  "ProjectComment",
  "ProjectKudos",
  "Referral",
  "RequisitionUse",
  "RoleGrant",
  "Session",
  "ShopOrder",
  "ShopSave",
  "ToolbeltBlock",
]);

// Plain person-id columns with no foreign key. They stay so that moderation and audit history still makes sense; a removed person
// shows only as an id, and nothing else about them is kept in these rows beyond what the record needs.
export const ERASURE_KEPT_MODELS: readonly string[] = Object.freeze([
  "AgeException",
  "AuditEvent",
  "Ban",
  "BanProposal",
  "ErasureRequest",
  "FormSubmission",
  "FulfillmentCommitment",
  "GuidelinesAck",
  "ModAction",
  "News",
  "OrderStatusEvent",
  "ReviewPayout",
  "SelfReviewException",
  // Help-desk tickets outlive the account. The erasure job clears authorSlackId, authorPersonId and the text of the person's tickets and messages.
  "Ticket",
  "Violation",
]);

export function erasureScheduledFor(now: Date): Date {
  return new Date(now.getTime() + ERASURE_DELAY_DAYS * DAY_MS);
}

export function canRequestErasure(openStatuses: readonly string[]): boolean {
  return !openStatuses.includes("requested");
}

export function canCancelErasure(status: string | null | undefined): boolean {
  return status === "requested";
}

export type ErasurePlan = {
  personId: string;
  removed: readonly string[];
  kept: readonly string[];
  revokesKeys: true;
};

export function planErasure(personId: string): ErasurePlan {
  return { personId, removed: ERASURE_REMOVED_MODELS, kept: ERASURE_KEPT_MODELS, revokesKeys: true };
}

// JSON cannot hold a Date or a bigint, and an undefined value is silently dropped by JSON.stringify anyway. This makes the shape
// explicit before the bundle is sent.
export function toExportJson(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map((item) => toExportJson(item));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      out[key] = toExportJson(item);
    }
    return out;
  }
  return value;
}

export function exportEnvelope(parts: Record<string, unknown>, now: Date): Record<string, unknown> {
  // The envelope fields are written last, so a part can never replace the format, version or time.
  return {
    ...(toExportJson(parts) as Record<string, unknown>),
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
  };
}

// ---- Builder view of a review payload ----
// Reviewers see the whole desk payload (review-data.ts DeskShip). A builder sees their own ship's title and status, and the two
// notes a reviewer wrote for them (reviewNote, reviewReason). Everything else the desk reads is reviewer-only: claims, triage,
// holds, first-pass and proposed-ban notes, assignments, the decision facts, the owner's birthday, and any collaborator or
// invite lists. redactShipForBuilder is a whitelist, so a new desk field stays hidden until it is added here on purpose.
export const BUILDER_SHIP_FIELDS: readonly string[] = Object.freeze([
  "id",
  "seq",
  "title",
  "description",
  "track",
  "status",
  "repoUrl",
  "demoUrl",
  "isUpdate",
  "changeNote",
  "resubmitCount",
  "createdAt",
  "submittedAt",
  "firstShippedAt",
  "reshippedAt",
  "reviewNote",
  "reviewReason",
]);

export const REVIEWER_ONLY_SHIP_FIELDS: readonly string[] = Object.freeze([
  "owner",
  "journals",
  "claimedMinutes",
  "facts",
  "selfReviewExceptionIds",
  "approvedMinutes",
  "bannedAt",
  "firstPassBy",
  "firstPassAt",
  "firstPassNote",
  "firstPassMinutes",
  "triage",
  "triageBy",
  "triageNote",
  "triageAt",
  "heldAt",
  "heldBy",
  "holdReason",
  "assignedTo",
  "assignmentRemindedAt",
  "proposedBanBy",
  "proposedBanReason",
  "claimedBy",
  "claimedAt",
  "claimHeartbeatAt",
]);

export function redactShipForBuilder(ship: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(ship).filter(([key]) => BUILDER_SHIP_FIELDS.includes(key)));
}

// A builder sees the reviewer's notes only on their own ship. Anyone else gets an empty object.
export function builderReviewNotes(
  ship: { ownerId?: string; owner?: { id: string }; reviewNote?: string | null; reviewReason?: string | null },
  viewerId: string,
): { reviewNote?: string | null; reviewReason?: string | null } {
  const ownerId = ship.ownerId ?? ship.owner?.id;
  if (!viewerId || ownerId !== viewerId) return {};
  return { reviewNote: ship.reviewNote ?? null, reviewReason: ship.reviewReason ?? null };
}
