// Slack bot: the helper list. GET answers { helpers: string[] } (Slack ids). POST { adminSlackId, slackId } adds one; only an admin in
// BOT_ADMIN_SLACK_IDS may (403 otherwise), and the change is audited. Answers { ok: true }.
import { botError, botGuard, botInvalid, botJson, checkFields, checkSlackId, readJson } from "@/lib/platform/bot/auth";
import { addHelper, listHelpers } from "@/lib/platform/bot/helpers-data";
import { checkHelperId, parseAdminSlackIds } from "@/lib/platform/bot/helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "helpers");
  if (denied) return denied;
  return botJson(rid, { helpers: await listHelpers() });
}

export async function POST(request: Request) {
  const { id: rid, denied } = await botGuard(request, "helpers");
  if (denied) return denied;
  const body = await readJson(request);
  if (!body.ok) return botInvalid(rid, body.message);
  const fields = checkFields(body.value, ["adminSlackId", "slackId"]);
  if (!fields.ok) return botInvalid(rid, fields.message);
  const admin = checkSlackId(fields.value.adminSlackId, "adminSlackId");
  if (!admin.ok) return botInvalid(rid, admin.message);
  const helper = checkHelperId(fields.value.slackId);
  if (!helper.ok) return botInvalid(rid, helper.message);

  const result = await addHelper(admin.value, helper.value, parseAdminSlackIds(process.env.BOT_ADMIN_SLACK_IDS));
  if (!result.ok) return botError(rid, 403, "forbidden");
  return botJson(rid, { ok: true });
}
