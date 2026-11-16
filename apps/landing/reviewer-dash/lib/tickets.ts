// Support tickets. Pixl keeps them in a table fed by a Slack help channel and replies through the Slack API. LOADOUT has no help
// channel: the tickets are LOADOUT's own sample tickets (lib/reviewer/fulfilment.ts), a reply or a resolve changes only the
// in-memory sample store (sample/ops.ts), and no network call is made. Names, types and shapes are Pixl's lib/tickets.ts.
import { opsStore, type PixlThreadMessage, type PixlTicket } from "./sample/ops";

const TICKET_TS = /^\d{10}\.\d{6}$/;
export function isValidTicketTs(ts: unknown): ts is string {
  return typeof ts === "string" && TICKET_TS.test(ts);
}

export interface TicketStats {
  total: number;
  open: number;
  resolved: number;
}

export type Ticket = PixlTicket;
export type FullTicketRow = PixlTicket;
export type ThreadMessage = PixlThreadMessage;

export async function countOpenTickets(): Promise<number> {
  return [...opsStore.tickets.values()].filter((ticket) => ticket.status === "open").length;
}

export async function ticketStats(): Promise<TicketStats> {
  const rows = [...opsStore.tickets.values()];
  return {
    total: rows.length,
    open: rows.filter((ticket) => ticket.status === "open").length,
    resolved: rows.filter((ticket) => ticket.status === "closed").length,
  };
}

export async function listTickets(status: "open" | "closed" | "all" = "open", search = ""): Promise<Ticket[]> {
  const q = search.trim().toLowerCase();
  return [...opsStore.tickets.values()]
    .filter((ticket) => status === "all" || ticket.status === status)
    .filter((ticket) => !q || ticket.description.toLowerCase().includes(q))
    .sort((a, b) => parseFloat(b.msg_ts) - parseFloat(a.msg_ts))
    .slice(0, 200);
}

export interface ActivityPoint {
  date: string;
  created: number;
  resolved: number;
}

export async function ticketActivity(): Promise<ActivityPoint[]> {
  const created = new Map<string, number>();
  const resolved = new Map<string, number>();
  for (const ticket of opsStore.tickets.values()) {
    const made = new Date(parseFloat(ticket.msg_ts) * 1000).toISOString().slice(0, 10);
    created.set(made, (created.get(made) ?? 0) + 1);
    if (ticket.status === "closed" && ticket.closed_at) {
      const done = ticket.closed_at.slice(0, 10);
      resolved.set(done, (resolved.get(done) ?? 0) + 1);
    }
  }
  const out: ActivityPoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - i);
    const key = day.toISOString().slice(0, 10);
    out.push({ date: key, created: created.get(key) ?? 0, resolved: resolved.get(key) ?? 0 });
  }
  return out;
}

export interface ResolverRow {
  slackId: string;
  total: number;
  last7d: number;
  last30d: number;
}

export async function resolverLeaderboard(): Promise<ResolverRow[]> {
  const weekAgo = Date.now() - 7 * 86_400_000;
  const monthAgo = Date.now() - 30 * 86_400_000;
  const counts = new Map<string, ResolverRow>();
  for (const ticket of opsStore.tickets.values()) {
    if (ticket.status !== "closed" || !ticket.closed_by_slack_id) continue;
    const row = counts.get(ticket.closed_by_slack_id) ?? { slackId: ticket.closed_by_slack_id, total: 0, last7d: 0, last30d: 0 };
    row.total += 1;
    const closedAt = ticket.closed_at ? new Date(ticket.closed_at).getTime() : 0;
    if (closedAt >= weekAgo) row.last7d += 1;
    if (closedAt >= monthAgo) row.last30d += 1;
    counts.set(ticket.closed_by_slack_id, row);
  }
  return [...counts.values()].sort((a, b) => b.total - a.total || b.last7d - a.last7d);
}

export class SlackApiError extends Error {
  constructor(readonly method: string, readonly code: string | undefined) {
    super(`Slack ${method} failed: ${code}`);
  }
}

export function isMissingThread(e: unknown): boolean {
  return e instanceof SlackApiError && (e.code === "thread_not_found" || e.code === "message_not_found");
}

export async function ticketThread(ts: string): Promise<ThreadMessage[]> {
  if (!isValidTicketTs(ts)) throw new Error("Invalid ticket id");
  const thread = opsStore.threads.get(ts);
  if (!thread) throw new SlackApiError("conversations.replies", "thread_not_found");
  return thread.map((message) => ({ ...message }));
}

export async function ticketReply(ts: string, text: string, actor: { slackId?: string; username?: string }): Promise<void> {
  if (!isValidTicketTs(ts)) throw new Error("Invalid ticket id");
  const thread = opsStore.threads.get(ts);
  if (!thread) throw new SlackApiError("chat.postMessage", "thread_not_found");
  const stamp = Math.floor(Date.now() / 1000);
  thread.push({
    ts: `${stamp}.${String(100000 + thread.length).padStart(6, "0")}`,
    text: text.trim(),
    name: actor.slackId || actor.username || "Support",
    avatar: null,
    isFirst: false,
    isBot: false,
  });
}

export interface ResolveResult {
  ok: boolean;
  error?: string;
  alreadyClosed?: boolean;
  notice?: string;
}

export const PIXO_OFFLINE_RESOLVE_NOTICE = "Sample data. Nothing was saved.";

export async function resolveTicketFromDash(ts: string, actor: { slackId: string; username: string }): Promise<ResolveResult> {
  if (!isValidTicketTs(ts)) return { ok: false, error: "Invalid ticket id." };
  const ticket = opsStore.tickets.get(ts);
  if (!ticket) return { ok: false, error: "No ticket found for this message." };
  if (ticket.status === "closed") return { ok: true, alreadyClosed: true };
  ticket.status = "closed";
  ticket.closed_at = new Date().toISOString();
  ticket.closed_by_slack_id = actor.slackId;
  return { ok: true };
}
