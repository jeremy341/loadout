// Notification reads and writes. Server only (uses the database). Every write goes through the pure rules in notifications.ts.
// Rows name no sender, so a list never reveals who did something, only what happened.
//
// API:
//   notify(personId, kind, draft)          -> NotifyResult   { ok: true, sent } | { ok: false, message }. sent is false when the
//                                             person is missing or banned, or has turned this kind off. A bad draft returns ok false.
//   listNotifications(personId, cursor?)   -> NotificationPage   newest first, PAGE_SIZE rows; nextCursor is null on the last page
//   unreadCount(personId)                  -> number
//   markRead(personId, ids)                -> WriteResult    only the person's own unread rows are changed
//   markAllRead(personId)                  -> WriteResult
//   getPrefs(personId)                     -> Record<NotificationKind, boolean>   every kind, default on
//   setPref(personId, rawKind, enabled)    -> WriteResult
//   cleanupOldNotifications(now?)          -> number         deletes rows older than RETENTION_DAYS; run from a scheduled job
import { db } from "./db";
import {
  checkMarkReadIds,
  checkNotification,
  checkPrefKind,
  type NotificationDraft,
  type NotificationKind,
  pageOf,
  PAGE_SIZE,
  parseCursor,
  prefsView,
  retentionCutoff,
  isKindEnabled,
} from "./notifications";
import { createRateLimiter } from "./rate-limit";

export type NotifyResult = { ok: true; sent: boolean } | { ok: false; message: string };
export type WriteResult = { ok: true } | { ok: false; message: string };

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: Date;
};
export type NotificationPage = { items: NotificationRow[]; nextCursor: string | null };

// One limiter for every write. The key says which write and who, so one busy person cannot slow someone else.
const writeLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
const SLOW_DOWN = "Slow down a little and try again.";

export async function notify(personId: string, rawKind: NotificationKind, draft: NotificationDraft): Promise<NotifyResult> {
  const check = checkNotification(rawKind, draft);
  if (!check.ok) return check;
  if (!writeLimiter.check(`notify:${personId}`).ok) return { ok: false, message: SLOW_DOWN };
  const { kind, title, body, href } = check.value;

  const person = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  if (!person || person.bannedAt) return { ok: true, sent: false };
  const prefs = await db().notificationPref.findMany({ where: { personId }, select: { kind: true, enabled: true } });
  if (!isKindEnabled(kind, prefs)) return { ok: true, sent: false };

  await db().notification.create({ data: { personId, kind, title, body, href } });
  return { ok: true, sent: true };
}

export async function listNotifications(personId: string, rawCursor?: unknown): Promise<NotificationPage> {
  const cursor = parseCursor(rawCursor);
  const rows = await db().notification.findMany({
    where: { personId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, kind: true, title: true, body: true, href: true, readAt: true, createdAt: true },
  });
  const page = pageOf(rows, PAGE_SIZE);
  return {
    items: page.items.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      href: row.href,
      read: row.readAt !== null,
      createdAt: row.createdAt,
    })),
    nextCursor: page.nextCursor,
  };
}

export async function unreadCount(personId: string): Promise<number> {
  return db().notification.count({ where: { personId, readAt: null } });
}

export async function markRead(personId: string, rawIds: unknown): Promise<WriteResult> {
  const check = checkMarkReadIds(rawIds);
  if (!check.ok) return check;
  if (!writeLimiter.check(`read:${personId}`).ok) return { ok: false, message: SLOW_DOWN };
  await db().notification.updateMany({
    where: { personId, readAt: null, id: { in: check.ids } },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

export async function markAllRead(personId: string): Promise<WriteResult> {
  if (!writeLimiter.check(`read-all:${personId}`).ok) return { ok: false, message: SLOW_DOWN };
  await db().notification.updateMany({ where: { personId, readAt: null }, data: { readAt: new Date() } });
  return { ok: true };
}

export async function getPrefs(personId: string): Promise<Record<NotificationKind, boolean>> {
  const rows = await db().notificationPref.findMany({ where: { personId }, select: { kind: true, enabled: true } });
  return prefsView(rows);
}

export async function setPref(personId: string, rawKind: unknown, enabled: boolean): Promise<WriteResult> {
  const kind = checkPrefKind(rawKind);
  if (!kind) return { ok: false, message: "That notification kind does not exist." };
  if (!writeLimiter.check(`pref:${personId}`).ok) return { ok: false, message: SLOW_DOWN };
  await db().notificationPref.upsert({
    where: { personId_kind: { personId, kind } },
    create: { personId, kind, enabled },
    update: { enabled },
  });
  return { ok: true };
}

export async function cleanupOldNotifications(now: Date = new Date()): Promise<number> {
  const result = await db().notification.deleteMany({ where: { createdAt: { lt: retentionCutoff(now) } } });
  return result.count;
}
