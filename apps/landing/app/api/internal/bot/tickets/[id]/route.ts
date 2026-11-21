// Slack bot: read one help desk ticket (GET) or change it (PATCH). PATCH body, every field optional, unknown fields refused:
// { title, status: "open" | "closed", claimedBy, closedBy, keepOpen, actorSlackId }. Closing needs closedBy; any status change
// needs actorSlackId (or closedBy) and is audited. Reopening clears closedAt and closedBy. Answers { ticket }.
import {
  botError,
  botGuard,
  botInvalid,
  botJson,
  checkBool,
  checkEnum,
  checkFields,
  checkOptionalSlackId,
  checkOptionalText,
  checkRouteId,
  optionalWith,
  readJson,
} from "@/lib/platform/bot/auth";
import { getTicket, updateTicket } from "@/lib/platform/bot/tickets-data";
import { TICKET_STATUSES, TITLE_MAX } from "@/lib/platform/bot/tickets";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const PATCH_FIELDS = ["title", "status", "claimedBy", "closedBy", "keepOpen", "actorSlackId"];

export async function GET(request: Request, { params }: Ctx) {
  const { id: rid, denied } = await botGuard(request, "ticket");
  if (denied) return denied;
  const routeId = checkRouteId((await params).id, "id");
  if (!routeId.ok) return botInvalid(rid, routeId.message);
  const ticket = await getTicket(routeId.value);
  if (!ticket) return botError(rid, 404, "not_found");
  return botJson(rid, { ticket });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id: rid, denied } = await botGuard(request, "ticket");
  if (denied) return denied;
  const routeId = checkRouteId((await params).id, "id");
  if (!routeId.ok) return botInvalid(rid, routeId.message);
  const body = await readJson(request);
  if (!body.ok) return botInvalid(rid, body.message);
  const fields = checkFields(body.value, PATCH_FIELDS);
  if (!fields.ok) return botInvalid(rid, fields.message);
  const v = fields.value;
  if (Object.keys(v).length === 0) return botInvalid(rid, "nothing to change");

  const title = checkOptionalText(v.title, "title", TITLE_MAX);
  if (!title.ok) return botInvalid(rid, title.message);
  const status = optionalWith(v.status, (raw) => checkEnum(raw, "status", TICKET_STATUSES));
  if (!status.ok) return botInvalid(rid, status.message);
  const claimedBy = checkOptionalSlackId(v.claimedBy, "claimedBy");
  if (!claimedBy.ok) return botInvalid(rid, claimedBy.message);
  const closedBy = checkOptionalSlackId(v.closedBy, "closedBy");
  if (!closedBy.ok) return botInvalid(rid, closedBy.message);
  const keepOpen = optionalWith(v.keepOpen, (raw) => checkBool(raw, "keepOpen"));
  if (!keepOpen.ok) return botInvalid(rid, keepOpen.message);
  const actor = checkOptionalSlackId(v.actorSlackId, "actorSlackId");
  if (!actor.ok) return botInvalid(rid, actor.message);

  const result = await updateTicket(routeId.value, {
    title: title.value,
    status: status.value,
    claimedBy: claimedBy.value,
    closedBy: closedBy.value,
    keepOpen: keepOpen.value,
    actorSlackId: actor.value,
  });
  if (!result.ok) {
    if (result.code === "not_found") return botError(rid, 404, "not_found");
    const message = result.code === "closed_by_required" ? "closedBy is required to close a ticket" : "actorSlackId is required to change a ticket's status";
    return botInvalid(rid, message);
  }
  return botJson(rid, { ticket: result.ticket });
}
