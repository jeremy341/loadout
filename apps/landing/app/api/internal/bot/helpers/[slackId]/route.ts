// Slack bot: remove a helper. DELETE /helpers/<slackId>?adminSlackId=<admin>. Only an admin in BOT_ADMIN_SLACK_IDS may (403
// otherwise); the change is audited. Answers { ok: true }. The admin id is a query parameter because DELETE bodies are unreliable.
import { botError, botGuard, botInvalid, botJson, checkSlackId } from "@/lib/platform/bot/auth";
import { removeHelper } from "@/lib/platform/bot/helpers-data";
import { checkHelperId, parseAdminSlackIds } from "@/lib/platform/bot/helpers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slackId: string }> };

export async function DELETE(request: Request, { params }: Ctx) {
  const { id: rid, denied } = await botGuard(request, "helper");
  if (denied) return denied;
  const helper = checkHelperId((await params).slackId);
  if (!helper.ok) return botInvalid(rid, helper.message);
  const admin = checkSlackId(new URL(request.url).searchParams.get("adminSlackId"), "adminSlackId");
  if (!admin.ok) return botInvalid(rid, admin.message);

  const result = await removeHelper(admin.value, helper.value, parseAdminSlackIds(process.env.BOT_ADMIN_SLACK_IDS));
  if (!result.ok) return botError(rid, 403, "forbidden");
  return botJson(rid, { ok: true });
}
