// Privacy reads and writes. Server only (uses the database). The rules are in privacy.ts.
// These are for a signed-in settings page (a session, not an API key). Nothing here deletes data: an erasure request only waits.
//
// API:
//   buildExport(personId, now?) -> object | null       everything held about the person, as one bundle; null when there is no person
//   requestErasure(personId, now?) -> { ok, scheduledFor } | { ok: false, message }   also revokes every API key at once
//   cancelErasure(personId, now?) -> WriteResult
//   erasureStatus(personId) -> { requestedAt, scheduledFor } | null
//   setStatsVisible(personId, on, now?) -> WriteResult  leaderboards and public stats; audited when it changes
//   WriteResult = { ok: true } | { ok: false, message }
//
// The export keeps the person's own data. It never includes a key hash, a session token, a reviewer's note or a
// staff-only field (hold reasons, lapse addresses, ban reasons).
import { recordAudit, type AuditInput } from "./audit";
import { db } from "./db";
import { canCancelErasure, canRequestErasure, erasureScheduledFor, exportEnvelope } from "./privacy";

export type WriteResult = { ok: true } | { ok: false; message: string };

// A reviewer's note is never part of a builder's export, not even on the builder's own projects. Keeping the field list here
// makes that easy to check (privacy-data.test.ts).
export const EXPORT_PROJECT_FIELDS = {
  id: true,
  title: true,
  description: true,
  track: true,
  status: true,
  isUpdate: true,
  approvedMinutes: true,
  changeNote: true,
  repoUrl: true,
  demoUrl: true,
  createdAt: true,
  submittedAt: true,
  firstShippedAt: true,
} as const;

// One audit row for every data download, from Settings or the API. The actor can differ from the person whose data was
// downloaded when staff are impersonating a builder; the API also records which key asked.
export function dataExportAudit(
  personId: string,
  channel: "settings" | "api",
  actorId: string = personId,
  keyId: string | null = null,
): AuditInput {
  return {
    actorId,
    action: "person.data_exported",
    targetType: "Person",
    targetId: personId,
    reason: "A builder downloaded their own data.",
    after: { channel, keyId },
  };
}

export async function buildExport(personId: string, now: Date = new Date()): Promise<Record<string, unknown> | null> {
  const person = await db().person.findUnique({
    where: { id: personId },
    select: {
      id: true,
      email: true,
      displayName: true,
      handle: true,
      bio: true,
      birthday: true,
      hcaId: true,
      verificationStatus: true,
      hcaSyncedAt: true,
      createdAt: true,
      statsVisible: true,
    },
  });
  if (!person) return null;

  const [projects, journal, hackatime, hours, ledger, orders, notifications, prefs, following, followers, blocks, bookmarks, kudos, keys, collaborations, ideas, referrals] =
    await Promise.all([
      db().project.findMany({
        where: { ownerId: personId },
        orderBy: { createdAt: "asc" },
        select: EXPORT_PROJECT_FIELDS,
      }),
      db().journalEntry.findMany({
        where: { authorId: personId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          projectId: true,
          title: true,
          body: true,
          hours: true,
          status: true,
          keptMinutes: true,
          reviewReason: true,
          createdAt: true,
          updatedAt: true,
          media: { select: { kind: true, alt: true, width: true, height: true, byteSize: true, createdAt: true, deletedAt: true } },
        },
      }),
      db().hackatimeLink.findUnique({
        where: { personId },
        select: { hackatimeUserId: true, linkedAt: true, lastSyncAt: true, lastStatus: true },
      }),
      db().hoursDay.findMany({
        where: { personId },
        orderBy: { day: "asc" },
        select: { hackatimeName: true, day: true, seconds: true, source: true },
      }),
      db().ledgerEntry.findMany({
        where: { personId },
        orderBy: { createdAt: "asc" },
        select: { id: true, amountOre: true, status: true, kind: true, reason: true, projectId: true, createdAt: true, confirmedAt: true },
      }),
      db().shopOrder.findMany({
        where: { personId },
        orderBy: { createdAt: "asc" },
        select: {
          number: true,
          status: true,
          totalOre: true,
          region: true,
          createdAt: true,
          updatedAt: true,
          lines: { select: { itemId: true, option: true, quantity: true, unitOre: true } },
          events: { select: { status: true, at: true } },
        },
      }),
      db().notification.findMany({
        where: { personId },
        orderBy: { createdAt: "asc" },
        select: { kind: true, title: true, body: true, href: true, readAt: true, createdAt: true },
      }),
      db().notificationPref.findMany({ where: { personId }, select: { kind: true, enabled: true } }),
      db().follow.findMany({ where: { followerId: personId }, select: { createdAt: true, followee: { select: { handle: true } } } }),
      db().follow.findMany({ where: { followeeId: personId }, select: { createdAt: true, follower: { select: { handle: true } } } }),
      // Only the blocks this person made. Who blocked them is other people's data, so it is not in their export.
      db().block.findMany({ where: { blockerId: personId }, select: { createdAt: true, blocked: { select: { handle: true } } } }),
      db().projectBookmark.findMany({ where: { personId }, select: { projectId: true, createdAt: true } }),
      db().projectKudos.findMany({ where: { personId }, select: { projectId: true, createdAt: true } }),
      db().apiKey.findMany({
        where: { personId },
        select: { id: true, name: true, prefix: true, scopes: true, createdAt: true, lastUsedAt: true, expiresAt: true, revokedAt: true },
      }),
      db().projectCollaborator.findMany({ where: { personId }, select: { projectId: true, status: true, createdAt: true } }),
      db().idea.findMany({ where: { authorId: personId }, orderBy: { createdAt: "asc" }, select: { title: true, body: true, status: true, createdAt: true } }),
      db().referral.findMany({ where: { referrerId: personId }, select: { createdAt: true, qualifiedAt: true } }),
    ]);

  const parts = {
    profile: {
      id: person.id,
      email: person.email,
      displayName: person.displayName,
      handle: person.handle,
      bio: person.bio,
      birthday: person.birthday,
      hackClubAuthId: person.hcaId,
      verificationStatus: person.verificationStatus,
      hackClubAuthSyncedAt: person.hcaSyncedAt,
      joinedAt: person.createdAt,
      statsVisible: person.statsVisible,
    },
    projects,
    journal,
    hackatime: hackatime ? { linked: true, ...hackatime } : { linked: false },
    hours: hours.map((h) => ({ project: h.hackatimeName, day: h.day.toISOString().slice(0, 10), seconds: h.seconds, source: h.source })),
    ledger,
    orders,
    notifications,
    notificationPreferences: prefs,
    following: following.map((f) => ({ handle: f.followee.handle, since: f.createdAt })),
    followers: followers.map((f) => ({ handle: f.follower.handle, since: f.createdAt })),
    blocks: blocks.map((b) => ({ handle: b.blocked.handle, since: b.createdAt })),
    bookmarks,
    kudos,
    apiKeys: keys,
    collaborations,
    ideas,
    referrals,
  };
  const envelope = exportEnvelope(parts, now);
  // The export itself is a privacy-relevant download. Record it after the bundle has been built successfully, so a failed
  // build never produces an audit row claiming the person received their data. The two export routes also record their channel.
  await recordAudit(db(), {
    actorId: personId,
    action: "person.export_downloaded",
    targetType: "Person",
    targetId: personId,
    reason: "Builder downloaded their data export in Settings or the API.",
    after: { generatedAt: now.toISOString() },
  });
  return envelope;
}

export async function requestErasure(personId: string, now: Date = new Date()): Promise<{ ok: true; scheduledFor: Date } | { ok: false; message: string }> {
  return db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Person" WHERE "id" = ${personId} FOR UPDATE`;
    const person = await tx.person.findUnique({ where: { id: personId }, select: { id: true } });
    if (!person) return { ok: false, message: "Sign in to ask for your account to be deleted." } as const;
    const open = await tx.erasureRequest.findFirst({ where: { personId, status: "requested" }, select: { id: true } });
    if (!canRequestErasure(open ? ["requested"] : [])) {
      return { ok: false, message: "A deletion request is already waiting. You can cancel it first." } as const;
    }
    const scheduledFor = erasureScheduledFor(now);
    await tx.erasureRequest.create({ data: { personId, status: "requested", requestedAt: now, scheduledFor } });
    // Keys stop working as soon as the request is made, not when the deletion runs.
    const revoked = await tx.apiKey.updateMany({ where: { personId, revokedAt: null }, data: { revokedAt: now } });
    await recordAudit(tx, {
      actorId: personId,
      action: "person.erasure_requested",
      targetType: "Person",
      targetId: personId,
      reason: "Builder asked for their account to be deleted in Settings.",
      after: { scheduledFor: scheduledFor.toISOString(), keysRevoked: revoked.count },
    });
    return { ok: true, scheduledFor } as const;
  });
}

export async function cancelErasure(personId: string, now: Date = new Date()): Promise<WriteResult> {
  return db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Person" WHERE "id" = ${personId} FOR UPDATE`;
    const open = await tx.erasureRequest.findFirst({ where: { personId, status: "requested" }, select: { id: true, status: true } });
    if (!open || !canCancelErasure(open.status)) return { ok: false, message: "There is no deletion request to cancel." } as const;
    await tx.erasureRequest.update({ where: { id: open.id }, data: { status: "cancelled" } });
    await recordAudit(tx, {
      actorId: personId,
      action: "person.erasure_cancelled",
      targetType: "Person",
      targetId: personId,
      reason: "Builder cancelled their deletion request in Settings.",
      after: { cancelledAt: now.toISOString() },
    });
    return { ok: true } as const;
  });
}

export async function erasureStatus(personId: string): Promise<{ requestedAt: Date; scheduledFor: Date } | null> {
  const row = await db().erasureRequest.findFirst({
    where: { personId, status: "requested" },
    orderBy: { requestedAt: "desc" },
    select: { requestedAt: true, scheduledFor: true },
  });
  return row;
}

export async function setStatsVisible(personId: string, on: boolean, now: Date = new Date()): Promise<WriteResult> {
  return db().$transaction(async (tx) => {
    const person = await tx.person.findUnique({ where: { id: personId }, select: { statsVisible: true, bannedAt: true } });
    if (!person || person.bannedAt) return { ok: false, message: "Sign in to change this setting." } as const;
    if (person.statsVisible === on) return { ok: true } as const;
    await tx.person.update({ where: { id: personId }, data: { statsVisible: on } });
    await recordAudit(tx, {
      actorId: personId,
      action: "person.stats_visibility",
      targetType: "Person",
      targetId: personId,
      reason: "Builder changed leaderboard visibility in Settings.",
      before: { statsVisible: person.statsVisible },
      after: { statsVisible: on, changedAt: now.toISOString() },
    });
    return { ok: true } as const;
  });
}
