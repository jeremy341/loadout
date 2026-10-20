"use client";

import { getPreview, setPreview, uid, usePreviewState } from "./preview-store";

// Preview notification inbox. Any module calls pushNotification when something happens (an order is placed,
// a review is submitted, a friend request is accepted). The Notifications tab reads and manages them.

export const NOTIFICATIONS_KEY = "notifications";

export type NotificationKind = "review" | "order" | "social" | "project" | "journal" | "mission" | "system";

export interface PreviewNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** Platform path to open, e.g. "/orders". */
  href?: string;
  at: string;
  read: boolean;
}

export const SEED_NOTIFICATIONS: PreviewNotification[] = [
  {
    id: "seed_n1",
    kind: "system",
    title: "Welcome to the platform preview",
    body: "Everything here runs on sample data saved in this browser.",
    href: "/overview",
    at: "2026-10-20T08:00:00.000Z",
    read: false,
  },
];

export function pushNotification(input: Omit<PreviewNotification, "id" | "at" | "read">): PreviewNotification {
  const entry: PreviewNotification = { ...input, id: uid("n"), at: new Date().toISOString(), read: false };
  setPreview(NOTIFICATIONS_KEY, [entry, ...getPreview<PreviewNotification[]>(NOTIFICATIONS_KEY, SEED_NOTIFICATIONS)]);
  return entry;
}

export function useNotifications() {
  const [items, setItems] = usePreviewState<PreviewNotification[]>(NOTIFICATIONS_KEY, SEED_NOTIFICATIONS);
  return {
    items,
    unread: items.filter((n) => !n.read).length,
    markRead: (id: string) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    markAllRead: () => setItems((prev) => prev.map((n) => ({ ...n, read: true }))),
    remove: (id: string) => setItems((prev) => prev.filter((n) => n.id !== id)),
    clear: () => setItems([]),
  };
}
