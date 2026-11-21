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
