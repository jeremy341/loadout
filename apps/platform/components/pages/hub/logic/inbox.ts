import type { NotificationKind, PreviewNotification } from "../../../../lib/notifications";
import { HUB_RULES } from "./rules";
import { isRecord } from "./text";

// Notification filtering, paging and preferences. The inbox itself lives in lib/notifications.ts; this is the pure
// part the Notifications tab and the Overview share.

export const KINDS: { kind: NotificationKind; label: string; help: string }[] = [
  { kind: "review", label: "Reviews", help: "Reviews on your ships and reviews you owe." },
  { kind: "order", label: "Orders", help: "Order updates and quotes." },
  { kind: "social", label: "Community", help: "Followers, friends, likes, comments and ideas." },
  { kind: "project", label: "Projects", help: "Ships and project changes." },
  { kind: "journal", label: "Journals", help: "Journal reminders and replies." },
  { kind: "mission", label: "Missions", help: "Mission progress and Season quests." },
  { kind: "system", label: "System", help: "Welcome notes, achievements and preview messages." },
];

export function kindLabel(kind: NotificationKind): string {
  return KINDS.find((k) => k.kind === kind)?.label ?? "System";
}

export type KindFilter = "all" | NotificationKind;
export type StatusFilter = "all" | "unread";

export interface QuietHours {
  enabled: boolean;
  /** 24-hour "HH:MM". */
  start: string;
  end: string;
}

export interface NotifyPrefs {
  /** Per kind: show it in the inbox. A kind that is off is kept but hidden. */
  inApp: Record<NotificationKind, boolean>;
  quiet: QuietHours;
}

export const DEFAULT_PREFS: NotifyPrefs = {
  inApp: { review: true, order: true, social: true, project: true, journal: true, mission: true, system: true },
  quiet: { enabled: false, start: "22:00", end: "07:00" },
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateQuietHours(quiet: QuietHours): string | null {
  if (!quiet.enabled) return null;
  if (!TIME.test(quiet.start) || !TIME.test(quiet.end)) return "Enter both times as hours and minutes.";
  if (quiet.start === quiet.end) return "The start and end times must be different.";
  return null;
}

function normalizeInApp(raw: unknown): NotifyPrefs["inApp"] {
  const inApp = { ...DEFAULT_PREFS.inApp };
  if (!isRecord(raw)) return inApp;
  for (const { kind } of KINDS) {
    const value = raw[kind];
    if (typeof value === "boolean") inApp[kind] = value;
  }
  return inApp;
}

function normalizeTime(value: unknown, fallback: string): string {
  return typeof value === "string" && TIME.test(value) ? value : fallback;
}

function normalizeQuiet(raw: unknown): QuietHours {
  const q = isRecord(raw) ? raw : {};
  return {
    enabled: q.enabled === true,
    start: normalizeTime(q.start, DEFAULT_PREFS.quiet.start),
    end: normalizeTime(q.end, DEFAULT_PREFS.quiet.end),
  };
}

export function normalizePrefs(raw: unknown): NotifyPrefs {
  if (!isRecord(raw)) return DEFAULT_PREFS;
  return { inApp: normalizeInApp(raw.inApp), quiet: normalizeQuiet(raw.quiet) };
}

/** Notifications of a kind the person turned off are hidden, not deleted. */
export function visibleByPrefs(items: readonly PreviewNotification[], prefs: NotifyPrefs): PreviewNotification[] {
  return items.filter((n) => prefs.inApp[n.kind] !== false);
}

export function unreadCount(items: readonly PreviewNotification[], prefs: NotifyPrefs): number {
  return visibleByPrefs(items, prefs).filter((n) => !n.read).length;
}

/** Newest first; ties keep a stable order by id. */
export function sortNewestFirst(items: readonly PreviewNotification[]): PreviewNotification[] {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a.at);
    const tb = Date.parse(b.at);
    const va = Number.isNaN(ta) ? -Infinity : ta;
    const vb = Number.isNaN(tb) ? -Infinity : tb;
    if (va !== vb) return va < vb ? 1 : -1;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

export function filterNotifications(
  items: readonly PreviewNotification[],
  filters: { kind: KindFilter; status: StatusFilter },
  prefs: NotifyPrefs,
): PreviewNotification[] {
  return sortNewestFirst(
    visibleByPrefs(items, prefs).filter((n) => (filters.kind === "all" || n.kind === filters.kind) && (filters.status === "all" || !n.read)),
  );
}

export interface Page<T> {
  items: T[];
  /** The page actually shown, 1-based, after clamping. */
  page: number;
  pages: number;
  total: number;
  /** 1-based position of the first and last item shown; 0 when empty. */
  from: number;
  to: number;
}

export function paginate<T>(items: readonly T[], page: number, size: number = HUB_RULES.pageSize): Page<T> {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const safe = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), pages) : 1;
  const start = (safe - 1) * size;
  const slice = items.slice(start, start + size);
  return { items: slice, page: safe, pages, total, from: slice.length === 0 ? 0 : start + 1, to: start + slice.length };
}

// Pure edits the page applies through the shared inbox store.

export function setRead(items: readonly PreviewNotification[], id: string, read: boolean): PreviewNotification[] {
  return items.map((n) => (n.id === id ? { ...n, read } : n));
}

export function markAllRead(items: readonly PreviewNotification[]): PreviewNotification[] {
  return items.map((n) => (n.read ? n : { ...n, read: true }));
}

export function removeOne(items: readonly PreviewNotification[], id: string): PreviewNotification[] {
  return items.filter((n) => n.id !== id);
}

/** What a screen reader hears for the unread count. */
export function unreadSentence(count: number): string {
  if (count === 0) return "No unread notifications.";
  return `${count} unread notification${count === 1 ? "" : "s"}.`;
}
