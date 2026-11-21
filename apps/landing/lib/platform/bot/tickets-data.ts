// The help desk's database reads and writes (the Ticket and TicketMessage tables). Server only. The rules are in tickets.ts.
//
// API:
//   createTicket(input) -> CreateResult          idempotent on channel and message time; links the author when a Person has that Slack id
//   getTicket(id), byMessage(channelId, messageTs) -> TicketRow | null
//   updateTicket(id, patch) -> UpdateResult      close sets closedAt and closedBy, reopen clears them; a status change is audited
//   addMessage(id, input) -> MessageResult       person and helper messages move lastMessageAt; bot posts do not
//   listOpen() -> TicketRow[]                    open tickets, least recently active first
//   similar(text) -> { id, title, url } | null   the best closed ticket among the last 60 (see ticketUrl for the link)
import type { Prisma } from "../../generated/prisma/client";
import { recordAudit } from "../audit";
import { db } from "../db";
import {
  bestSimilar,
  clipText,
  clipTitle,
  closedFields,
  SIMILAR_WINDOW,
  statusChange,
  TICKET_TEXT_MAX,
  ticketUrl,
  toTicketRow,
  type TicketRow,
  type TicketStatus,
} from "./tickets";

export type CreateResult = { ticket: TicketRow; linked: boolean; created: boolean };
export type TicketPatch = {
  title?: string | null;
  status?: TicketStatus;
  claimedBy?: string | null;
  closedBy?: string | null;
  keepOpen?: boolean;
  // Who made a status change. Required for a change; defaults to closedBy when closing.
  actorSlackId?: string | null;
};
export type UpdateResult = { ok: true; ticket: TicketRow } | { ok: false; code: "not_found" | "closed_by_required" | "actor_required" };
export type MessageInput = { slackTs: string | null; authorKind: "person" | "helper" | "bot"; authorSlackId: string | null; text: string };
export type MessageResult = { ok: true; id: string } | { ok: false; code: "not_found" };

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

function byMessageRow(channelId: string, messageTs: string) {
  return db().ticket.findUnique({ where: { channelId_messageTs: { channelId, messageTs } } });
}

export async function createTicket(input: { channelId: string; messageTs: string; authorSlackId: string; text: string }): Promise<CreateResult> {
  const existing = await byMessageRow(input.channelId, input.messageTs);
  if (existing) return { ticket: toTicketRow(existing), linked: existing.authorPersonId !== null, created: false };

  const person = await db().person.findUnique({ where: { slackId: input.authorSlackId }, select: { id: true } });
  try {
    const row = await db().ticket.create({
      data: {
        channelId: input.channelId,
        messageTs: input.messageTs,
        authorSlackId: input.authorSlackId,
        authorPersonId: person?.id ?? null,
        text: clipText(input.text, TICKET_TEXT_MAX),
        status: "open",
        lastMessageAt: new Date(),
      },
    });
    return { ticket: toTicketRow(row), linked: person !== null, created: true };
  } catch (error) {
    // Two deliveries of the same message raced: the second one returns the row the first one made.
    if (!isUniqueViolation(error)) throw error;
    const again = await byMessageRow(input.channelId, input.messageTs);
    if (!again) throw error;
    return { ticket: toTicketRow(again), linked: again.authorPersonId !== null, created: false };
  }
}

export async function getTicket(id: string): Promise<TicketRow | null> {
  const row = await db().ticket.findUnique({ where: { id } });
  return row ? toTicketRow(row) : null;
}

export async function byMessage(channelId: string, messageTs: string): Promise<TicketRow | null> {
  const row = await byMessageRow(channelId, messageTs);
  return row ? toTicketRow(row) : null;
}

export async function updateTicket(id: string, patch: TicketPatch, now = new Date()): Promise<UpdateResult> {
  const row = await db().ticket.findUnique({ where: { id } });
  if (!row) return { ok: false, code: "not_found" };

  const change = patch.status === undefined ? "none" : statusChange(row.status, patch.status);
  if (change === "close" && !patch.closedBy) return { ok: false, code: "closed_by_required" };
  const actor = patch.actorSlackId ?? patch.closedBy ?? null;
  if (change !== "none" && !actor) return { ok: false, code: "actor_required" };

  const data: Prisma.TicketUpdateInput = {};
  if (patch.title !== undefined) data.title = patch.title === null ? null : clipTitle(patch.title);
  if (patch.claimedBy !== undefined) data.claimedBy = patch.claimedBy;
  if (patch.keepOpen !== undefined) data.keepOpen = patch.keepOpen;
  if (change !== "none") {
    const closed = closedFields(change, patch.closedBy ?? null, now);
    data.status = change === "close" ? "closed" : "open";
    data.closedAt = closed.closedAt;
    data.closedBy = closed.closedBy;
  }

  const updated = await db().$transaction(async (tx) => {
    const next = await tx.ticket.update({ where: { id }, data });
    if (change !== "none" && actor) {
      await recordAudit(tx, {
        actorId: `slack:${actor}`,
        action: change === "close" ? "bot.ticket.close" : "bot.ticket.reopen",
        targetType: "ticket",
        targetId: id,
        reason: change === "close" ? "Ticket closed from Slack" : "Ticket reopened from Slack",
      });
    }
    return next;
  });
  return { ok: true, ticket: toTicketRow(updated) };
}

export async function addMessage(id: string, input: MessageInput, now = new Date()): Promise<MessageResult> {
  return db().$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({ where: { id }, select: { id: true } });
    if (!ticket) return { ok: false, code: "not_found" } as const;
    const message = await tx.ticketMessage.create({
      data: {
        ticketId: id,
        slackTs: input.slackTs,
        authorKind: input.authorKind,
        authorSlackId: input.authorSlackId,
        text: clipText(input.text, TICKET_TEXT_MAX),
      },
    });
    if (input.authorKind !== "bot") await tx.ticket.update({ where: { id }, data: { lastMessageAt: now } });
    return { ok: true, id: message.id } as const;
  });
}

export async function listOpen(): Promise<TicketRow[]> {
  const rows = await db().ticket.findMany({ where: { status: "open" }, orderBy: { lastMessageAt: "asc" }, take: 500 });
  return rows.map((row) => toTicketRow(row));
}

export async function similar(text: string): Promise<{ id: string; title: string | null; url: string } | null> {
  const candidates = await db().ticket.findMany({
    where: { status: "closed" },
    orderBy: { closedAt: "desc" },
    take: SIMILAR_WINDOW,
    select: { id: true, title: true, text: true },
  });
  const best = bestSimilar(text, candidates);
  return best ? { id: best.id, title: best.title, url: ticketUrl(best.id) } : null;
}
