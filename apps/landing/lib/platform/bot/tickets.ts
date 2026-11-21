// Pure rules for the help desk tickets (the bot's Ticket table). No database; every function has a bun test (tickets.test.ts).
// The database wrappers are in tickets-data.ts; the reviewer Tickets page reuses these rules in reviewer-dash/lib/tickets.ts.
//
// API:
//   TICKET_TEXT_MAX = 4000, TITLE_MAX = 100, AUTO_CLOSE_DAYS = 5, SIMILAR_MIN = 0.5, SIMILAR_WINDOW = 60
//   TICKET_STATUSES, TicketStatus, isTicketStatus(raw)
//   TicketRecord (a Ticket row as read), TicketRow (the bot's JSON shape, apps/bot/src/types.ts)
//   toTicketRow(record) -> TicketRow                  never carries a person's email or other personal field
//   clipText(text, max) -> string                     cuts with an ellipsis, counting characters
//   clipTitle(raw) -> string | null                   collapses spaces, clips to 100; blank -> null
//   statusChange(current, next) -> "close" | "reopen" | "none"
//   closedFields(change, closedBy, now) -> { closedAt, closedBy }   close sets both, reopen clears both
//   shouldAutoClose(ticket, now) -> boolean           open 5+ days, quiet 5+ days, not marked keep-open
//   ticketUrl(id) -> string                           see the comment on the function
//   similarity(query, text) -> number          shared words over the smaller word set; fewer than two shared words scores 0
//   bestSimilar(query, candidates, min?) -> candidate | null      the best similarity at or above min; vague matches are ignored
//   resolverRows(rows, now) -> ResolverRow[]          helpers ranked by resolved tickets
//   dayBuckets(created, resolved, today, days?) -> ActivityPoint[]   UTC days, oldest first
import { tokens } from "./qa";

export const TICKET_TEXT_MAX = 4000;
export const TITLE_MAX = 100;
export const AUTO_CLOSE_DAYS = 5;
export const SIMILAR_MIN = 0.5;
export const SIMILAR_WINDOW = 60;
const DAY_MS = 86_400_000;

export const TICKET_STATUSES = ["open", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export function isTicketStatus(raw: unknown): raw is TicketStatus {
  return TICKET_STATUSES.includes(raw as TicketStatus);
}

// A Ticket row as the database returns it (only the fields the rules use).
export type TicketRecord = {
  id: string;
  channelId: string;
  messageTs: string;
  authorSlackId: string;
  title: string | null;
  text: string;
  status: string;
  claimedBy: string | null;
  closedBy: string | null;
  closedAt: Date | null;
  keepOpen: boolean;
  lastMessageAt: Date;
  createdAt: Date;
};

// The bot's JSON shape (TicketRow in apps/bot/src/types.ts). The author is a Slack id, never an email or a name.
export type TicketRow = {
  id: string;
  channelId: string;
  messageTs: string;
  authorSlackId: string;
  title: string | null;
  text: string;
  status: TicketStatus;
  claimedBy: string | null;
  closedBy: string | null;
  keepOpen: boolean;
  lastMessageAt: string;
  createdAt: string;
};

export type ResolverRow = { slackId: string; total: number; last7d: number; last30d: number };
export type ActivityPoint = { date: string; created: number; resolved: number };

export function toTicketRow(row: TicketRecord): TicketRow {
  return {
    id: row.id,
    channelId: row.channelId,
    messageTs: row.messageTs,
    authorSlackId: row.authorSlackId,
    title: row.title,
    text: row.text,
    status: row.status === "closed" ? "closed" : "open",
    claimedBy: row.claimedBy,
    closedBy: row.closedBy,
    keepOpen: row.keepOpen,
    lastMessageAt: row.lastMessageAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

// Counts characters (code points), so an emoji is one character. The ellipsis counts toward the limit.
export function clipText(text: string, max: number): string {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return `${chars.slice(0, Math.max(0, max - 1)).join("")}…`;
}

export function clipTitle(raw: string): string | null {
  const title = raw.replace(/\s+/g, " ").trim();
  return title === "" ? null : clipText(title, TITLE_MAX);
}

export function statusChange(current: string, next: TicketStatus): "close" | "reopen" | "none" {
  const was: TicketStatus = current === "closed" ? "closed" : "open";
  if (was === next) return "none";
  return next === "closed" ? "close" : "reopen";
}

export function closedFields(change: "close" | "reopen", closedBy: string | null, now: Date): { closedAt: Date | null; closedBy: string | null } {
  if (change === "reopen") return { closedAt: null, closedBy: null };
  return { closedAt: now, closedBy };
}

// A ticket is due when it has been open at least five days, its last message is at least five days old, and no helper
// marked it "keep open". Both ages are inclusive: exactly five days counts.
export function shouldAutoClose(ticket: { status: string; keepOpen: boolean; createdAt: Date; lastMessageAt: Date }, now: Date): boolean {
  if (ticket.status !== "open" || ticket.keepOpen) return false;
  const cutoff = now.getTime() - AUTO_CLOSE_DAYS * DAY_MS;
  return ticket.createdAt.getTime() <= cutoff && ticket.lastMessageAt.getTime() <= cutoff;
}

// Placeholder: the reviewer page does not read `?t=` yet. The bot shows this as the link to a similar ticket, so once the page
// reads the parameter the link works without a bot change.
export function ticketUrl(id: string): string {
  return `/reviewer/tickets?t=${encodeURIComponent(id)}`;
}

// Shared words over the smaller of the two word sets. A long ticket that mentions a short question's words still scores well,
// and two words must match at least, so one common word never counts as a match.
export function similarity(query: string, text: string): number {
  const left = new Set(tokens(query));
  const right = new Set(tokens(text));
  let shared = 0;
  for (const word of left) if (right.has(word)) shared++;
  if (shared < 2) return 0;
  return shared / Math.min(left.size, right.size);
}

// The closed ticket that best matches a question, if its similarity reaches SIMILAR_MIN. Ties keep the first (newest).
export function bestSimilar<T extends { id: string; title: string | null; text: string }>(query: string, candidates: readonly T[], min = SIMILAR_MIN): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    const score = similarity(query, `${candidate.title ?? ""} ${candidate.text}`);
    if (score >= min && score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

export function resolverRows(rows: readonly { closedBy: string; closedAt: Date }[], now: Date): ResolverRow[] {
  const totals = new Map<string, ResolverRow>();
  for (const row of rows) {
    const current = totals.get(row.closedBy) ?? { slackId: row.closedBy, total: 0, last7d: 0, last30d: 0 };
    const age = now.getTime() - row.closedAt.getTime();
    current.total += 1;
    if (age <= 7 * DAY_MS) current.last7d += 1;
    if (age <= 30 * DAY_MS) current.last30d += 1;
    totals.set(row.closedBy, current);
  }
  return [...totals.values()].sort((a, b) => b.total - a.total || b.last7d - a.last7d);
}

export function dayBuckets(created: readonly Date[], resolved: readonly Date[], today: Date, days = 30): ActivityPoint[] {
  const dayOf = (date: Date) => date.toISOString().slice(0, 10);
  const createdBy = new Map<string, number>();
  const resolvedBy = new Map<string, number>();
  for (const date of created) createdBy.set(dayOf(date), (createdBy.get(dayOf(date)) ?? 0) + 1);
  for (const date of resolved) resolvedBy.set(dayOf(date), (resolvedBy.get(dayOf(date)) ?? 0) + 1);
  const out: ActivityPoint[] = [];
  for (let back = days - 1; back >= 0; back--) {
    const key = dayOf(new Date(today.getTime() - back * DAY_MS));
    out.push({ date: key, created: createdBy.get(key) ?? 0, resolved: resolvedBy.get(key) ?? 0 });
  }
  return out;
}
