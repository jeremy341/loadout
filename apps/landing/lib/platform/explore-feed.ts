// Pure rules for the Explore feed: the page size, the cursor, the browse order and the small texts on a card. No database.
// Tests in explore-feed.test.ts.
//
// API:
//   FEED_PAGE_SIZE = 21, FEED_MAX_OFFSET = 300 (the ranked window in discover-data.ts is 300 projects)
//   encodeCursor(offset) -> "c21"           decodeCursor(raw) -> offset (0 for anything that is not a cursor)
//   nextCursor(offset, returned, total) -> cursor | null     null once the last page has been reached
//   prevCursor(offset) -> cursor | null                      null on the first page
//   openSourceFirst(rows) -> rows           stable: projects with a source address first, then the rest (browse order only)
//   relativeTime(iso, now) -> "just now" | "5m ago" | "3h ago" | "2d ago" | "12 Sep 2026"
//   entriesLabel(n) -> "0 entries" | "1 entry" | "N entries"
export const FEED_PAGE_SIZE = 21;
export const FEED_MAX_OFFSET = 300;

export function encodeCursor(offset: number): string {
  const n = Number.isFinite(offset) ? Math.min(FEED_MAX_OFFSET, Math.max(0, Math.floor(offset))) : 0;
  return `c${n}`;
}

export function decodeCursor(raw: unknown): number {
  const text = Array.isArray(raw) ? String(raw[0] ?? "") : typeof raw === "string" ? raw : "";
  const match = /^c(\d{1,6})$/.exec(text.trim());
  if (!match) return 0;
  return Math.min(FEED_MAX_OFFSET, Number(match[1]));
}

export function nextCursor(offset: number, returned: number, total: number, size = FEED_PAGE_SIZE): string | null {
  if (returned < size) return null;
  const end = offset + returned;
  const reachable = Math.min(Math.max(0, Math.floor(total)), FEED_MAX_OFFSET);
  return end < reachable ? encodeCursor(end) : null;
}

export function prevCursor(offset: number, size = FEED_PAGE_SIZE): string | null {
  return offset <= 0 ? null : encodeCursor(Math.max(0, offset - size));
}

export function openSourceFirst<T extends { hasRepo: boolean }>(rows: readonly T[]): T[] {
  return [...rows.filter((row) => row.hasRepo), ...rows.filter((row) => !row.hasRepo)];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function relativeTime(iso: string | Date, now: number = Date.now()): string {
  const then = iso instanceof Date ? iso.getTime() : Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days <= 30) return `${days}d ago`;
  const date = new Date(then);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function entriesLabel(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${n} ${n === 1 ? "entry" : "entries"}`;
}

// One card of the feed, as JSON: handles only, no email and no display name. `own` is true for the viewer's own project (no
// kudos on it). `entries` and `lastAt` come from the project's journal (lastAt is the newest entry, null when there is none).
export type FeedCard = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  ownerHandle: string | null;
  openSource: boolean;
  status: string; // the stage, as normalizeStatus writes it ("draft", "logging", "approved", ...); only "approved" earns the check badge
  usedBy: number;
  saved: boolean;
  kudos: number;
  kudosGiven: boolean;
  own: boolean;
  entries: number;
  lastAt: string | null;
};
