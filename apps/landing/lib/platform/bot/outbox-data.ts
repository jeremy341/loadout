// The outbox the Slack bot drains (the BotOutbox table). Server only. The rules are in outbox.ts.
//
// API:
//   enqueue(input) -> EnqueueResult                       idempotent on dedupeKey; the href must be a site path
//   enqueueNotificationDm(personId, input) -> { ok, queued } | { ok: false }
//                                                         queued only when the person has a linked Slack id, is not banned and has the kind on.
//                                                         The site's notify() can call this later; it is not wired in yet.
//   enqueueThreadReply(ticket, messageId, text, client?)  a helper's dashboard reply for the bot to post into the ticket's thread.
//                                                         Encoding (the bot reads it this way): kind "ticket-reply:<ticketId>",
//                                                         slackId = the ticket's channel id, href = the ticket's message time (the
//                                                         thread), dedupeKey "ticket-reply:<ticketId>:<messageId>". href is not a site
//                                                         path here, so checkHref does not apply to this kind.
//   claimOutbox(now?) -> OutboxItem[]                     up to 20 due items; each is leased for 2 minutes so two polls never send one twice
//   ackOutbox(id, slackTs?, now?)                         sent. A ticket reply with slackTs gets the Slack timestamp on its TicketMessage.
//   failOutbox(id, code, final, now?)                     backoff of 1, 5 and 30 minutes, then failed (outbox.ts failDecision)
import { randomUUID } from "crypto";
import type { PrismaClient } from "../../generated/prisma/client";
import { checkPrefKind } from "../notifications";
import { getPrefs } from "../notifications-data";
import { db } from "../db";
import { isSlackId } from "./auth";
import {
  checkHref,
  clipOutbox,
  failDecision,
  messageIdFromDedupe,
  noticeKind,
  notificationText,
  OUTBOX_CLAIM_MAX,
  OUTBOX_LEASE_MS,
  siteBase,
  ticketReplyDedupe,
  ticketReplyKind,
} from "./outbox";

export type OutboxItem = { id: string; kind: string; slackId: string; text: string; href: string | null };
export type NewItem = { kind: string; slackId: string; text: string; href?: string | null; dedupeKey: string };
export type EnqueueResult = { ok: true; id: string } | { ok: false; message: string };
export type NotificationInput = { kind: string; title: string; body?: string; href?: string | null; dedupeKey?: string };

type Client = Pick<PrismaClient, "botOutbox">;

async function put(client: Client, row: { kind: string; slackId: string; text: string; href: string | null; dedupeKey: string }) {
  return client.botOutbox.upsert({
    where: { dedupeKey: row.dedupeKey },
    update: {},
    create: { kind: row.kind, slackId: row.slackId, text: row.text, href: row.href, dedupeKey: row.dedupeKey },
    select: { id: true },
  });
}

export async function enqueue(input: NewItem): Promise<EnqueueResult> {
  if (!isSlackId(input.slackId)) return { ok: false, message: "slackId must be a Slack id" };
  if (input.dedupeKey.trim() === "") return { ok: false, message: "dedupeKey is required" };
  const href = checkHref(input.href, siteBase());
  if (!href.ok) return { ok: false, message: href.message };
  const row = await put(db(), { kind: input.kind, slackId: input.slackId, text: clipOutbox(input.text), href: href.value, dedupeKey: input.dedupeKey });
  return { ok: true, id: row.id };
}

export async function enqueueNotificationDm(
  personId: string,
  input: NotificationInput,
): Promise<{ ok: true; queued: boolean } | { ok: false; message: string }> {
  const kind = checkPrefKind(input.kind);
  if (!kind) return { ok: false, message: "unknown notification kind" };
  const person = await db().person.findUnique({ where: { id: personId }, select: { slackId: true, bannedAt: true } });
  if (!person || person.bannedAt || !isSlackId(person.slackId)) return { ok: true, queued: false };
  const prefs = await getPrefs(personId);
  if (!prefs[kind]) return { ok: true, queued: false };
  const result = await enqueue({
    kind: noticeKind(kind),
    slackId: person.slackId,
    text: notificationText(input.title, input.body),
    href: input.href ?? null,
    dedupeKey: `${noticeKind(kind)}:${personId}:${input.dedupeKey ?? randomUUID()}`,
  });
  if (!result.ok) return result;
  return { ok: true, queued: true };
}

export async function enqueueThreadReply(
  ticket: { id: string; channelId: string; messageTs: string },
  messageId: string,
  text: string,
  client: Client = db(),
): Promise<void> {
  await put(client, {
    kind: ticketReplyKind(ticket.id),
    slackId: ticket.channelId,
    text: clipOutbox(text),
    href: ticket.messageTs,
    dedupeKey: ticketReplyDedupe(ticket.id, messageId),
  });
}

function toItem(row: { id: string; kind: string; slackId: string; text: string; href: string | null }): OutboxItem {
  return { id: row.id, kind: row.kind, slackId: row.slackId, text: row.text, href: row.href };
}

export async function claimOutbox(now = new Date()): Promise<OutboxItem[]> {
  const due = await db().botOutbox.findMany({
    where: { status: "pending", nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: "asc" },
    take: OUTBOX_CLAIM_MAX,
  });
  const lease = new Date(now.getTime() + OUTBOX_LEASE_MS);
  const claimed: OutboxItem[] = [];
  for (const row of due) {
    // The conditional update is the claim: a poll that loses the race sees count 0 and skips the row.
    const won = await db().botOutbox.updateMany({
      where: { id: row.id, status: "pending", nextAttemptAt: { lte: now } },
      data: { nextAttemptAt: lease },
    });
    if (won.count === 1) claimed.push(toItem(row));
  }
  return claimed;
}

export async function ackOutbox(id: string, slackTs: string | null, now = new Date()): Promise<{ ok: true } | { ok: false; code: "not_found" }> {
  const row = await db().botOutbox.findUnique({ where: { id } });
  if (!row) return { ok: false, code: "not_found" };
  const messageId = slackTs ? messageIdFromDedupe(row.dedupeKey) : null;
  await db().$transaction(async (tx) => {
    // The conditional update is the ack: only the writer that actually flips a pending row to sent increments attempts or
    // stamps the ticket message. A second ack (or a fail that started just before it) sees count 0 and changes nothing.
    const won = await tx.botOutbox.updateMany({
      where: { id, status: { not: "sent" } },
      data: { status: "sent", sentAt: now, attempts: { increment: 1 }, lastError: null, nextAttemptAt: now },
    });
    if (won.count === 1 && messageId && slackTs) await tx.ticketMessage.updateMany({ where: { id: messageId }, data: { slackTs } });
  });
  return { ok: true };
}

export async function failOutbox(
  id: string,
  code: string,
  final: boolean,
  now = new Date(),
): Promise<{ ok: true; status: string } | { ok: false; code: "not_found" }> {
  for (;;) {
    const row = await db().botOutbox.findUnique({ where: { id } });
    if (!row) return { ok: false, code: "not_found" };
    if (row.status !== "pending") return { ok: true, status: row.status };
    const attempts = row.attempts + 1;
    const decision = failDecision(attempts, code, final);
    const data =
      decision.status === "pending"
        ? { status: "pending", attempts, lastError: code, nextAttemptAt: new Date(now.getTime() + decision.delayMs) }
        : { status: "failed", attempts, lastError: code, nextAttemptAt: now };
    // CAS on both status and the exact attempt count. A concurrent ack (status sent) or another failure (attempts moved on)
    // makes this match 0 rows; re-read and recompute instead of overwriting a newer attempt count with a stale one.
    const won = await db().botOutbox.updateMany({ where: { id, status: "pending", attempts: row.attempts }, data });
    if (won.count === 1) return { ok: true, status: data.status };
  }
}
