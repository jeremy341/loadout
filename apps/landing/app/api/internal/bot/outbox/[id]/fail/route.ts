// Slack bot: an outbox send failed. POST { code, final? } where code is a short lower-case word such as "rate_limited".
// Retries wait 1, 5 and 30 minutes; a fourth failure, a final code (user_not_found, cannot_dm_bot) or final: true ends it.
// Answers { ok: true, status: "pending" | "failed" }, or 404.
import { botError, botGuard, botInvalid, botJson, checkCode, checkFields, checkRouteId, optionalWith, checkBool, readJson } from "@/lib/platform/bot/auth";
import { failOutbox } from "@/lib/platform/bot/outbox-data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { id: rid, denied } = await botGuard(request, "outbox-fail");
  if (denied) return denied;
  const routeId = checkRouteId((await params).id, "id");
  if (!routeId.ok) return botInvalid(rid, routeId.message);
  const body = await readJson(request);
  if (!body.ok) return botInvalid(rid, body.message);
  const fields = checkFields(body.value, ["code", "final"]);
  if (!fields.ok) return botInvalid(rid, fields.message);
  const code = checkCode(fields.value.code, "code");
  if (!code.ok) return botInvalid(rid, code.message);
  const final = optionalWith(fields.value.final, (raw) => checkBool(raw, "final"));
  if (!final.ok) return botInvalid(rid, final.message);

  const result = await failOutbox(routeId.value, code.value, final.value ?? false);
  if (!result.ok) return botError(rid, 404, "not_found");
  return botJson(rid, { ok: true, status: result.status });
}
