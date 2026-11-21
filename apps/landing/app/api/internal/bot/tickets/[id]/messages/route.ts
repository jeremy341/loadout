// Slack bot: add a message to a help desk ticket's thread. POST body: { slackTs?, authorKind: "person" | "helper" | "bot",
// authorSlackId?, text }. Person and helper messages move the ticket's lastMessageAt. Answers 201 { message: { id } }, or 404.
import {
  botError,
  botGuard,
  botInvalid,
  botJson,
  checkEnum,
  checkFields,
  checkRouteId,
  checkSlackId,
  checkSlackTs,
  checkText,
  nullableWith,
  readJson,
} from "@/lib/platform/bot/auth";
import { addMessage } from "@/lib/platform/bot/tickets-data";
import { TICKET_TEXT_MAX } from "@/lib/platform/bot/tickets";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const FIELDS = ["slackTs", "authorKind", "authorSlackId", "text"];
const KINDS = ["person", "helper", "bot"] as const;

export async function POST(request: Request, { params }: Ctx) {
  const { id: rid, denied } = await botGuard(request, "ticket-messages");
  if (denied) return denied;
  const routeId = checkRouteId((await params).id, "id");
  if (!routeId.ok) return botInvalid(rid, routeId.message);
  const body = await readJson(request);
  if (!body.ok) return botInvalid(rid, body.message);
  const fields = checkFields(body.value, FIELDS);
  if (!fields.ok) return botInvalid(rid, fields.message);
  const v = fields.value;

  const slackTs = nullableWith(v.slackTs, (raw) => checkSlackTs(raw, "slackTs"));
  if (!slackTs.ok) return botInvalid(rid, slackTs.message);
  const kind = checkEnum(v.authorKind, "authorKind", KINDS);
  if (!kind.ok) return botInvalid(rid, kind.message);
  const author = nullableWith(v.authorSlackId, (raw) => checkSlackId(raw, "authorSlackId"));
  if (!author.ok) return botInvalid(rid, author.message);
  const text = checkText(v.text, "text", TICKET_TEXT_MAX, true);
  if (!text.ok) return botInvalid(rid, text.message);

  const result = await addMessage(routeId.value, {
    slackTs: slackTs.value,
    authorKind: kind.value,
    authorSlackId: author.value,
    text: text.value,
  });
  if (!result.ok) return botError(rid, 404, "not_found");
  return botJson(rid, { message: { id: result.id } }, 201);
}
