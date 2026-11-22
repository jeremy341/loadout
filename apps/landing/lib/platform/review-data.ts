// The review desk's read model. Server only (uses the database). Read only: every write is in review-actions.ts.
//
// API:
//   DESK_STATUSES                          the ship states the desk lists (everything past draft and logging)
//   loadDeskShip({ id } | { seq })         one ship with its owner, journals and review facts, or null
//   listDeskShips()                        every ship in a desk state, oldest wait first
//   listPersonNames(ids)                   id -> display name
//   pendingOreFor(projectId)               sum of pending approved-hours rows for the project
//   listShipAudits(projectId?, limit?)     the review history from AuditEvent rows (action "review.*", audit.ts REVIEW_AUDIT_PREFIX)
//   assignmentView(ship, now)              { reservedFor, hoursLeft, locked, reminderDue } for the first-pass queue
//   factsForReviewer(ship, viewerId)       the ShipFacts a viewer's decision is made on: a collaborator or invitee under a
//                                          SelfReviewException for this project is taken off the lists for that viewer only
//   minutesOf(hours)                       a journal's hours as whole minutes
//
// Team facts: collaboratorIds are the accepted ProjectCollaborator rows, pendingInviteIds the invited ones (team-actions.ts teamFacts).
// Declined rows count for neither, so self-review is enforced by review-rules.ts canReview and canHold through these lists.
// Owners are never lifted by an exception.
//
// Builder redaction: this payload is reviewer-only. Owner fields are id, displayName and birthday (the age flag); no email and no
// slack id. A builder sees only their own reviewNote and reviewReason through the builder pages and api-v1 (privacy.ts).
import type { Prisma } from "../generated/prisma/client";
import { db } from "./db";
import { REVIEW_AUDIT_PREFIX } from "./audit";
import { teamFacts } from "./team-actions";
import { selfReviewExceptionIds, type SelfReviewGrant } from "../reviewer/access";
import { assignmentReminderDue, assignmentWindow } from "./review-rules";
import { kindOfTrack, type DeskKind, type ShipFacts } from "./review-decisions";

export const DESK_STATUSES = ["submitted", "in-review", "second-pass", "needs-changes", "approved", "banned"] as const;

export const minutesOf = (hours: number): number => Math.round(hours * 60);

export type DeskJournal = {
  id: string;
  seq: number;
  title: string;
  body: string;
  hours: number;
  minutes: number;
  status: string;
  reviewAction: string | null;
  keptMinutes: number | null;
  reviewReason: string | null;
  authorId: string;
  createdAt: Date;
};

export type DeskShip = {
  id: string;
  seq: number;
  title: string;
  description: string | null;
  track: string | null;
  kind: DeskKind;
  status: string;
  repoUrl: string | null;
  demoUrl: string | null;
  isUpdate: boolean;
  changeNote: string | null;
  resubmitCount: number;
  createdAt: Date;
  submittedAt: Date | null;
  firstShippedAt: Date | null;
  reshippedAt: Date | null;
  approvedMinutes: number;
  reviewNote: string | null;
  reviewReason: string | null;
  bannedAt: Date | null;
  firstPassBy: string | null;
  firstPassAt: Date | null;
  firstPassNote: string | null;
  firstPassMinutes: number | null;
  triage: string | null;
  triageBy: string | null;
  triageNote: string | null;
  triageAt: Date | null;
  heldAt: Date | null;
  heldBy: string | null;
  holdReason: string | null;
  assignedTo: string | null;
  assignmentRemindedAt: Date | null;
  proposedBanBy: string | null;
  proposedBanReason: string | null;
  // No email. birthday is read on both loads: the reviewer dash shows the "turned 19 since shipping" flag, and the server
  // verdict action derives that same flag itself so a caller cannot drop the age justification.
  owner: { id: string; displayName: string; birthday: Date | null };
  journals: DeskJournal[];
  claimedMinutes: number;
  facts: ShipFacts;
  // Person ids that an active, project-scoped SelfReviewException lifts self-review for on this ship. Read with factsForReviewer.
  selfReviewExceptionIds: string[];
};

const baseSelect = {
  id: true,
  seq: true,
  ownerId: true,
  title: true,
  description: true,
  track: true,
  status: true,
  repoUrl: true,
  demoUrl: true,
  isUpdate: true,
  changeNote: true,
  resubmitCount: true,
  createdAt: true,
  submittedAt: true,
  firstShippedAt: true,
  reshippedAt: true,
  approvedMinutes: true,
  reviewNote: true,
  reviewReason: true,
  bannedAt: true,
  firstPassBy: true,
  firstPassAt: true,
  firstPassNote: true,
  firstPassMinutes: true,
  triage: true,
  triageBy: true,
  triageNote: true,
  triageAt: true,
  heldAt: true,
  heldBy: true,
  holdReason: true,
  assignedTo: true,
  assignmentRemindedAt: true,
  proposedBanBy: true,
  proposedBanReason: true,
  claimedBy: true,
  claimedAt: true,
  claimHeartbeatAt: true,
  collaborators: { select: { personId: true, status: true } },
  journal: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, seq: true, title: true, body: true, hours: true, status: true, reviewAction: true, keptMinutes: true, reviewReason: true, authorId: true, createdAt: true },
  },
} satisfies Prisma.ProjectSelect;

// Both loads take the owner's name and birthday: the action needs the birthday to derive the age-justification flag, and the
// reviewer dash needs it for the same flag it shows to final reviewers.
const projectSelect = { ...baseSelect, owner: { select: { id: true, displayName: true, birthday: true } } } satisfies Prisma.ProjectSelect;
const listSelect = { ...baseSelect, owner: { select: { id: true, displayName: true, birthday: true } } } satisfies Prisma.ProjectSelect;

type Loaded = NonNullable<Awaited<ReturnType<typeof findOne>>>;
type DeskRow = Omit<Loaded, "owner"> & { owner: { id: string; displayName: string; birthday?: Date | null } };

function findOne(where: { id: string } | { seq: number }) {
  return db().project.findUnique({ where, select: projectSelect });
}

// Pure mapping from a loaded project row to the reviewer payload. Exported so the tests can check what reaches reviewers.
export function toDeskShip(row: DeskRow, exceptionIds: readonly string[] = []): DeskShip {
  const journals: DeskJournal[] = row.journal.map((entry) => ({ ...entry, minutes: minutesOf(entry.hours) }));
  const { journal: _journal, collaborators, claimedBy, claimedAt, claimHeartbeatAt, ownerId, ...rest } = row;
  void _journal;
  const team = teamFacts(collaborators);
  return {
    ...rest,
    owner: { id: row.owner.id, displayName: row.owner.displayName, birthday: row.owner.birthday ?? null },
    kind: kindOfTrack(row.track),
    journals,
    claimedMinutes: journals.reduce((sum, entry) => sum + entry.minutes, 0),
    selfReviewExceptionIds: [...exceptionIds],
    facts: {
      ownerId,
      kind: kindOfTrack(row.track),
      status: row.status,
      heldAt: row.heldAt,
      heldBy: row.heldBy,
      holdReason: row.holdReason,
      claimedBy,
      claimedAt,
      claimHeartbeatAt,
      triage: row.triage,
      assignedTo: row.assignedTo,
      reshippedAt: row.reshippedAt,
      proposedBanBy: row.proposedBanBy,
      collaboratorIds: team.collaboratorIds,
      pendingInviteIds: team.pendingInviteIds,
    },
  };
}

// Active, project-scoped grants for the given projects (one query). Expired and person-wide grants are not read.
async function exceptionsByProject(projectIds: readonly string[], now: Date): Promise<SelfReviewGrant[]> {
  if (projectIds.length === 0) return [];
  return db().selfReviewException.findMany({
    where: { projectId: { in: [...projectIds] }, expiresAt: { gt: now } },
    select: { personId: true, projectId: true, expiresAt: true },
  });
}

// The viewer-scoped facts a review decision uses. Without an exception this is the stored facts unchanged. With one, the viewer
// is taken off the collaborator and invitee lists for this ship only, so canReview/canHold/authorizeShip treat them as allowed.
// The owner is never removed, so an exception cannot let anyone review a ship they own.
export function factsForReviewer(ship: Pick<DeskShip, "facts" | "selfReviewExceptionIds">, viewerId: string): ShipFacts {
  if (!ship.selfReviewExceptionIds.includes(viewerId)) return ship.facts;
  return {
    ...ship.facts,
    collaboratorIds: ship.facts.collaboratorIds.filter((id) => id !== viewerId),
    pendingInviteIds: ship.facts.pendingInviteIds.filter((id) => id !== viewerId),
  };
}

export async function loadDeskShip(where: { id: string } | { seq: number }, now: Date = new Date()): Promise<DeskShip | null> {
  const row = await findOne(where);
  if (!row) return null;
  const grants = await exceptionsByProject([row.id], now);
  return toDeskShip(row, selfReviewExceptionIds(grants, row.id, now));
}

export async function listDeskShips(now: Date = new Date()): Promise<DeskShip[]> {
  const rows = await db().project.findMany({
    where: { status: { in: [...DESK_STATUSES] } },
    select: listSelect,
    orderBy: [{ firstShippedAt: "asc" }, { submittedAt: "asc" }, { seq: "asc" }],
  });
  const grants = await exceptionsByProject(
    rows.map((row) => row.id),
    now,
  );
  return rows.map((row) => toDeskShip(row, selfReviewExceptionIds(grants, row.id, now)));
}

export async function listPersonNames(ids: readonly string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const people = await db().person.findMany({ where: { id: { in: unique } }, select: { id: true, displayName: true } });
  return new Map(people.map((person) => [person.id, person.displayName]));
}

export async function pendingOreFor(projectId: string): Promise<number> {
  const sum = await db().ledgerEntry.aggregate({ where: { projectId, status: "pending", kind: { in: ["approved_hours", "adjustment"] } }, _sum: { amountOre: true } });
  return sum._sum.amountOre ?? 0;
}

export type ShipAudit = { id: string; projectId: string; actorId: string; action: string; reason: string; after: Record<string, unknown>; createdAt: Date };

export async function listShipAudits(projectId?: string, limit = 200): Promise<ShipAudit[]> {
  const rows = await db().auditEvent.findMany({
    where: { targetType: "project", action: { startsWith: REVIEW_AUDIT_PREFIX }, ...(projectId ? { targetId: projectId } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
  return rows.map((row) => ({ id: row.id, projectId: row.targetId, actorId: row.actorId, action: row.action, reason: row.reason, after: (row.after as Record<string, unknown> | null) ?? {}, createdAt: row.createdAt }));
}

// First-pass queue flags, computed on read (no cron yet): who the ship is reserved for, how long is left, and whether the 24 hour
// reminder is due. The reminder is delivered later, with notifications.
export function assignmentView(ship: Pick<DeskShip, "assignedTo" | "reshippedAt" | "assignmentRemindedAt">, now: Date) {
  if (!ship.assignedTo) return { reservedFor: null as string | null, hoursLeft: 0, locked: false, reminderDue: false };
  const window = assignmentWindow({ reshippedAt: ship.reshippedAt, now });
  const open = !window.backToQueue;
  return {
    reservedFor: open ? ship.assignedTo : null,
    hoursLeft: open ? window.hoursLeft : 0,
    locked: open,
    reminderDue: assignmentReminderDue({ reshippedAt: ship.reshippedAt, reminderSentAt: ship.assignmentRemindedAt, now }),
  };
}
