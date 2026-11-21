// Slack bot: a LOADOUT person by Slack id. GET ?slackId= answers { linked: false } or
// { linked: true, handle?, levels: [{ track, level, approvedHours }], approvedHours, ore }. No email, birthday, address or age.
import { botGuard, botInvalid, botJson, checkSlackId } from "@/lib/platform/bot/auth";
import { personBySlackId } from "@/lib/platform/bot/people-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "person");
  if (denied) return denied;
  const slackId = checkSlackId(new URL(request.url).searchParams.get("slackId"), "slackId");
  if (!slackId.ok) return botInvalid(rid, slackId.message);
  return botJson(rid, await personBySlackId(slackId.value));
}
