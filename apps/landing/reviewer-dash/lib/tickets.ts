// Support tickets for the reviewer Tickets page. The tickets are the Slack bot's rows (Ticket and TicketMessage). A reply or a
// resolve from the page writes those rows, queues a reply for the bot to post into the thread (lib/platform/bot/outbox-data.ts)
// and audits a resolve. Names, types and shapes are Pixl's lib/tickets.ts, so the copied pages run unchanged.
//
// Sample fallback: only in NODE_ENV=development and only while the Ticket table is empty, the page shows the sample tickets
// (sample/ops.ts) so it is not blank. Production never reads them, and a reply or resolve in that mode changes only the sample store.
import { recordAudit } from "@/lib/platform/audit";
import { db } from "@/lib/platform/db";
import { enqueueThreadReply } from "@/lib/platform/bot/outbox-data";
import { dayBuckets, resolverRows, statusChange, type ActivityPoint, type ResolverRow, type TicketRecord } from "@/lib/platform/bot/tickets";
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
export type { ActivityPoint, ResolverRow };

const DAY_MS = 86_400_000;

// The page's ticket shape, from the database row. Permalink and ticket number have no source yet.
function pixlTicket(row: TicketRecord): PixlTicket {
  return {
    msg_ts: row.messageTs,
    description: row.text,
    title: row.title ?? "",
    status: row.status,
    opened_by_slack_id: row.authorSlackId,
    claimed_by_slack_id: row.claimedBy,
    closed_by_slack_id: row.closedBy,
    closed_at: row.closedAt ? row.closedAt.toISOString() : null,
    permalink: null,
    ticket_number: null,
  };
}

async function sampleMode(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") return false;
  return (await db().ticket.count()) === 0;
}

// The oldest ticket with this message time. The dashboard keys tickets by message time alone, so the first match wins.
function byTs(ts: string) {
  return db().ticket.findFirst({ where: { messageTs: ts }, orderBy: { createdAt: "asc" } });
}

export async function countOpenTickets(): Promise<number> {
  if (await sampleMode()) return sampleOpenCount();
  return db().ticket.count({ where: { status: "open" } });
}

export async function ticketStats(): Promise<TicketStats> {
  if (await sampleMode()) return sampleStats();
  const [total, open, resolved] = await Promise.all([
    db().ticket.count(),
    db().ticket.count({ where: { status: "open" } }),
    db().ticket.count({ where: { status: "closed" } }),
  ]);
  return { total, open, resolved };
}

export async function listTickets(status: "open" | "closed" | "all" = "open", search = ""): Promise<Ticket[]> {
  if (await sampleMode()) return sampleList(status, search);
  const q = search.trim();
  const rows = await db().ticket.findMany({
    where: {
      ...(status === "all" ? {} : { status }),
      ...(q ? { text: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(pixlTicket);
}

export async function ticketActivity(): Promise<ActivityPoint[]> {
  if (await sampleMode()) return sampleActivity();
  const since = new Date(Date.now() - 30 * DAY_MS);
  const [created, resolved] = await Promise.all([
    db().ticket.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db().ticket.findMany({ where: { closedAt: { gte: since } }, select: { closedAt: true } }),
  ]);
  return dayBuckets(
    created.map((row) => row.createdAt),
    resolved.flatMap((row) => (row.closedAt ? [row.closedAt] : [])),
    new Date(),
  );
}

export async function resolverLeaderboard(): Promise<ResolverRow[]> {
  if (await sampleMode()) return sampleLeaderboard();
  const rows = await db().ticket.findMany({ where: { status: "closed", closedBy: { not: null } }, select: { closedBy: true, closedAt: true } });
  const resolved = rows.flatMap((row) => (row.closedBy && row.closedAt ? [{ closedBy: row.closedBy, closedAt: row.closedAt }] : []));
  return resolverRows(resolved, new Date());
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
  if (await sampleMode()) return sampleThread(ts);
  const ticket = await byTs(ts);
  if (!ticket) throw new SlackApiError("conversations.replies", "thread_not_found");
  const messages = await db().ticketMessage.findMany({ where: { ticketId: ticket.id }, orderBy: { createdAt: "asc" } });
  const first: ThreadMessage = {
    ts: ticket.messageTs,
    text: ticket.text,
    name: ticket.authorSlackId,
    avatar: null,
    isFirst: true,
    isBot: false,
  };
  // A message the bot has not yet recorded a Slack time for gets a stable time built from its creation time.
  const rest = messages.map<ThreadMessage>((message, index) => ({
    ts: message.slackTs ?? `${Math.floor(message.createdAt.getTime() / 1000)}.${String(index + 1).padStart(6, "0")}`,
    text: message.text,
    name: message.authorSlackId ?? (message.authorKind === "bot" ? "Bot" : "Support"),
    avatar: null,
    isFirst: false,
    isBot: message.authorKind === "bot",
  }));
  return [first, ...rest];
}

export interface TicketReplyResult {
  saved: boolean;
  notice?: string;
}

export const PIXO_OFFLINE_REPLY_NOTICE = "Sample data. The reply is not saved or sent.";

export async function ticketReply(ts: string, text: string, actor: { slackId?: string; username?: string }): Promise<TicketReplyResult> {
  if (!isValidTicketTs(ts)) throw new Error("Invalid ticket id");
  if (await sampleMode()) {
    sampleReply(ts, text, actor);
    return { saved: false, notice: PIXO_OFFLINE_REPLY_NOTICE };
  }
  const ticket = await byTs(ts);
  if (!ticket) throw new SlackApiError("chat.postMessage", "thread_not_found");
  const body = text.trim();
  // The reply is stored in full; the bot gets it clipped to its outbox limit (outbox-data.ts). It is queued in the same transaction.
  await db().$transaction(async (tx) => {
    const message = await tx.ticketMessage.create({
      data: { ticketId: ticket.id, authorKind: "helper", authorSlackId: actor.slackId ?? null, text: body },
    });
    await tx.ticket.update({ where: { id: ticket.id }, data: { lastMessageAt: new Date() } });
    await enqueueThreadReply(ticket, message.id, body, tx);
  });
  return { saved: true };
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
  if (await sampleMode()) return sampleResolve(ts, actor);
  const ticket = await byTs(ts);
  if (!ticket) return { ok: false, error: "No ticket found for this message." };
  const change = statusChange(ticket.status, "closed");
  if (change === "none") return { ok: true, alreadyClosed: true };
  const now = new Date();
  await db().$transaction(async (tx) => {
    await tx.ticket.update({ where: { id: ticket.id }, data: { status: "closed", closedAt: now, closedBy: actor.slackId } });
    await recordAudit(tx, {
      actorId: `slack:${actor.slackId}`,
      action: "bot.ticket.close",
      targetType: "ticket",
      targetId: ticket.id,
      reason: "Ticket resolved from the reviewer Tickets page",
    });
  });
  return { ok: true };
}

// ---- Sample fallback (development, empty Ticket table only) ----------------------------------------------------------------

function sampleOpenCount(): number {
  return [...opsStore.tickets.values()].filter((ticket) => ticket.status === "open").length;
}

function sampleStats(): TicketStats {
  const rows = [...opsStore.tickets.values()];
  return {
    total: rows.length,
    open: rows.filter((ticket) => ticket.status === "open").length,
    resolved: rows.filter((ticket) => ticket.status === "closed").length,
  };
}

function sampleList(status: "open" | "closed" | "all", search: string): Ticket[] {
  const q = search.trim().toLowerCase();
  return [...opsStore.tickets.values()]
    .filter((ticket) => status === "all" || ticket.status === status)
    .filter((ticket) => !q || ticket.description.toLowerCase().includes(q))
    .sort((a, b) => parseFloat(b.msg_ts) - parseFloat(a.msg_ts))
    .slice(0, 200);
}

function sampleActivity(): ActivityPoint[] {
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

function sampleLeaderboard(): ResolverRow[] {
  const weekAgo = Date.now() - 7 * DAY_MS;
  const monthAgo = Date.now() - 30 * DAY_MS;
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

function sampleThread(ts: string): ThreadMessage[] {
  const thread = opsStore.threads.get(ts);
  if (!thread) throw new SlackApiError("conversations.replies", "thread_not_found");
  return thread.map((message) => ({ ...message }));
}

function sampleReply(ts: string, text: string, actor: { slackId?: string; username?: string }): void {
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

function sampleResolve(ts: string, actor: { slackId: string; username: string }): ResolveResult {
  const ticket = opsStore.tickets.get(ts);
  if (!ticket) return { ok: false, error: "No ticket found for this message." };
  if (ticket.status === "closed") return { ok: true, alreadyClosed: true };
  ticket.status = "closed";
  ticket.closed_at = new Date().toISOString();
  ticket.closed_by_slack_id = actor.slackId;
  return { ok: true };
}
