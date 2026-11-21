// Slack bot: create a help desk ticket (idempotent on channel and message time), or look one up by its message.
// POST body: { channelId, messageTs, authorSlackId, text }. Answers { ticket, linked, created }; 201 when created, else 200.
// GET ?channelId=&messageTs= answers { ticket } or 404. Never returns an email or other personal field.
import { botError, botGuard, botInvalid, botJson, checkFields, checkSlackId, checkSlackTs, checkText, readJson } from "@/lib/platform/bot/auth";
import { createTicket, byMessage } from "@/lib/platform/bot/tickets-data";
import { TICKET_TEXT_MAX } from "@/lib/platform/bot/tickets";

export const dynamic = "force-dynamic";

const FIELDS = ["channelId", "messageTs", "authorSlackId", "text"];

export async function POST(request: Request) {
  const { id: rid, denied } = await botGuard(request, "tickets");
  if (denied) return denied;
  const body = await readJson(request);
  if (!body.ok) return botInvalid(rid, body.message);
  const fields = checkFields(body.value, FIELDS);
  if (!fields.ok) return botInvalid(rid, fields.message);
  const v = fields.value;
  const channel = checkSlackId(v.channelId, "channelId");
  if (!channel.ok) return botInvalid(rid, channel.message);
  const ts = checkSlackTs(v.messageTs, "messageTs");
  if (!ts.ok) return botInvalid(rid, ts.message);
  const author = checkSlackId(v.authorSlackId, "authorSlackId");
  if (!author.ok) return botInvalid(rid, author.message);
  const text = checkText(v.text, "text", TICKET_TEXT_MAX, true);
  if (!text.ok) return botInvalid(rid, text.message);

  const result = await createTicket({ channelId: channel.value, messageTs: ts.value, authorSlackId: author.value, text: text.value });
  return botJson(rid, { ticket: result.ticket, linked: result.linked, created: result.created }, result.created ? 201 : 200);
}

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "tickets");
  if (denied) return denied;
  const url = new URL(request.url);
  const channel = checkSlackId(url.searchParams.get("channelId"), "channelId");
  if (!channel.ok) return botInvalid(rid, channel.message);
  const ts = checkSlackTs(url.searchParams.get("messageTs"), "messageTs");
  if (!ts.ok) return botInvalid(rid, ts.message);
  const ticket = await byMessage(channel.value, ts.value);
  if (!ticket) return botError(rid, 404, "not_found");
  return botJson(rid, { ticket });
}
