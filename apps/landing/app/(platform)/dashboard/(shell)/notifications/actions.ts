"use server";

// Server actions for the notification list, its preferences and the unread count in the account menu. Each one acts only on the
// signed-in person's own rows (the data layer takes the person id, never one from the browser).
import { revalidatePath } from "next/cache";
import { listNotifications, markAllRead, markRead, setPref, unreadCount } from "@/lib/platform/notifications-data";
import { readViewer, requireViewer } from "@/lib/platform/session";

export type NotificationItem = { id: string; title: string; body: string; href: string | null; read: boolean; createdAt: string };
export type NotificationsMore = { items: NotificationItem[]; nextCursor: string | null };
export type ActionResult = { ok: true } | { ok: false; message: string };

// The count for the account menu. Zero for a visitor with no session, so the docs pages can use the menu too.
export async function unreadCountAction(): Promise<number> {
  const viewer = await readViewer();
  return viewer ? unreadCount(viewer.id) : 0;
}

export async function loadMoreNotifications(cursor: string): Promise<NotificationsMore> {
  const viewer = await requireViewer();
  const page = await listNotifications(viewer.id, cursor);
  return {
    items: page.items.map((row) => ({ id: row.id, title: row.title, body: row.body, href: row.href, read: row.read, createdAt: row.createdAt.toISOString() })),
    nextCursor: page.nextCursor,
  };
}

export async function markAllReadAction(): Promise<ActionResult> {
  const viewer = await requireViewer();
  const result = await markAllRead(viewer.id);
  if (result.ok) revalidatePath("/dashboard/notifications");
  return result;
}

export async function markReadAction(id: string): Promise<ActionResult> {
  const viewer = await requireViewer();
  return markRead(viewer.id, [id]);
}

export async function setPrefAction(kind: string, enabled: boolean): Promise<ActionResult> {
  const viewer = await requireViewer();
  return setPref(viewer.id, kind, enabled === true);
}
