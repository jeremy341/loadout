// Slack bot: an outbox item was sent. POST with an optional body { slackTs }. For a ticket reply, slackTs is the Slack
// timestamp of the posted message and is recorded on the ticket's message. Answers { ok: true }, or 404.
import { botError, botGuard, botInvalid, botJson, checkFields, checkRouteId, checkSlackTs, nullableWith, readJson } from "@/lib/platform/bot/auth";
import { ackOutbox } from "@/lib/platform/bot/outbox-data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { id: rid, denied } = await botGuard(request, "outbox-ack");
  if (denied) return denied;
  const routeId = checkRouteId((await params).id, "id");
  if (!routeId.ok) return botInvalid(rid, routeId.message);
  const body = await readJson(request, true);
  if (!body.ok) return botInvalid(rid, body.message);
  const fields = checkFields(body.value, ["slackTs"]);
  if (!fields.ok) return botInvalid(rid, fields.message);
  const slackTs = nullableWith(fields.value.slackTs, (raw) => checkSlackTs(raw, "slackTs"));
  if (!slackTs.ok) return botInvalid(rid, slackTs.message);

  const result = await ackOutbox(routeId.value, slackTs.value);
  if (!result.ok) return botError(rid, 404, "not_found");
  return botJson(rid, { ok: true });
}
