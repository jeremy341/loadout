// Pure rules for in-app notifications. No database; every function has a bun test (notifications.test.ts).
//
// API:
//   NOTIFICATION_KINDS, NotificationKind
//   TITLE_MAX = 120, BODY_MAX = 500, HREF_MAX = 300, PAGE_SIZE = 20, RETENTION_DAYS = 90, MARK_READ_MAX = 100
//   checkNotification(kind, draft) -> { ok: true, value: { kind, title, body, href } } | { ok: false, message }
//       title is one plain-text line of 1 to 120 characters. body is optional plain text of at most 500. href is optional and must
//       start with "/dashboard/" (no protocol, no "//"). React escapes the text, so nothing here is HTML.
//   clipText(text, max) -> string                 cuts with an ellipsis; use it for names inside titles so a title never overflows
//   isKindEnabled(kind, prefs) -> boolean         prefs: stored rows { kind, enabled }; a missing row means on (the default)
//   prefsView(prefs) -> Record<NotificationKind, boolean>
//   checkPrefKind(raw) -> NotificationKind | null
//   parseCursor(raw) -> string | null             the id of the last row on the previous page, or null
//   checkMarkReadIds(raw) -> { ok: true, ids } | { ok: false, message }   1 to 100 ids, duplicates dropped
//   pageOf(rows, pageSize) -> { items, nextCursor }   rows were fetched with take pageSize + 1
//   retentionCutoff(now) -> Date                  notifications created before this are removed by the cleanup

export const NOTIFICATION_KINDS = [
  "kudos",
  "follow",
  "collab-invite",
  "collab-accepted",
  "idea-application",
  "ship-approved",
  "ship-needs-changes",
  "order-update",
  "referral-qualified",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const TITLE_MAX = 120;
export const BODY_MAX = 500;
export const HREF_MAX = 300;
export const PAGE_SIZE = 20;
export const RETENTION_DAYS = 90;
export const MARK_READ_MAX = 100;

export type NotificationDraft = { title: unknown; body?: unknown; href?: unknown };
export type NotificationValue = { kind: NotificationKind; title: string; body: string; href: string | null };
export type NotificationCheck = { ok: true; value: NotificationValue } | { ok: false; message: string };

// Control characters become spaces, runs of whitespace collapse, the ends are trimmed. A title stays on one line.
function plainLine(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

// A body keeps its line breaks, but other control characters go.
function plainBlock(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const HREF_PATTERN = /^\/dashboard\/[A-Za-z0-9._~\-/?=&%#]*$/;

export function checkNotification(kind: unknown, draft: NotificationDraft): NotificationCheck {
  if (!NOTIFICATION_KINDS.includes(kind as NotificationKind)) return { ok: false, message: "That notification kind does not exist." };
  const title = plainLine(draft.title);
  // Count code points, not UTF-16 units: titles are built with clipText, and an astral character is one character in the UI.
  const titleLength = Array.from(title).length;
  if (titleLength === 0) return { ok: false, message: "A notification needs a title." };
  if (titleLength > TITLE_MAX) return { ok: false, message: `Keep the title under ${TITLE_MAX} characters.` };
  const body = plainBlock(draft.body);
  if (Array.from(body).length > BODY_MAX) return { ok: false, message: `Keep the body under ${BODY_MAX} characters.` };

  let href: string | null = null;
  if (draft.href !== undefined && draft.href !== null && draft.href !== "") {
    if (typeof draft.href !== "string") return { ok: false, message: "The link must be a path." };
    const trimmed = draft.href.trim();
    if (trimmed.length > HREF_MAX || !HREF_PATTERN.test(trimmed) || trimmed.includes("//")) {
      return { ok: false, message: "The link must be a path under /dashboard/." };
    }
    href = trimmed;
  }
  return { ok: true, value: { kind: kind as NotificationKind, title, body, href } };
}

// Cuts text to max characters, ending with an ellipsis when it had to cut. Counts code points, not UTF-16 units.
export function clipText(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return chars.slice(0, Math.max(0, max - 1)).join("") + "…";
}

// A missing row means the kind is on. Preferences are per person and per kind (NotificationPref).
export function isKindEnabled(kind: NotificationKind, prefs: readonly { kind: string; enabled: boolean }[]): boolean {
  const row = prefs.find((pref) => pref.kind === kind);
  return row ? row.enabled : true;
}

export function prefsView(prefs: readonly { kind: string; enabled: boolean }[]): Record<NotificationKind, boolean> {
  const view = {} as Record<NotificationKind, boolean>;
  for (const kind of NOTIFICATION_KINDS) view[kind] = isKindEnabled(kind, prefs);
  return view;
}

export function checkPrefKind(raw: unknown): NotificationKind | null {
  return NOTIFICATION_KINDS.includes(raw as NotificationKind) ? (raw as NotificationKind) : null;
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function parseCursor(raw: unknown): string | null {
  return typeof raw === "string" && ID_PATTERN.test(raw) ? raw : null;
}

export type MarkReadCheck = { ok: true; ids: string[] } | { ok: false; message: string };

export function checkMarkReadIds(raw: unknown): MarkReadCheck {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, message: "Choose at least one notification." };
  const ids = [...new Set(raw)];
  if (ids.some((id) => typeof id !== "string" || !ID_PATTERN.test(id))) return { ok: false, message: "That notification was not found." };
  if (ids.length > MARK_READ_MAX) return { ok: false, message: `Mark up to ${MARK_READ_MAX} notifications at a time.` };
  return { ok: true, ids: ids as string[] };
}

export function pageOf<T extends { id: string }>(rows: readonly T[], pageSize: number = PAGE_SIZE): { items: T[]; nextCursor: string | null } {
  const items = rows.slice(0, pageSize);
  const nextCursor = rows.length > pageSize && items.length > 0 ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

export function retentionCutoff(now: Date): Date {
  return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}
