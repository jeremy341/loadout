// Slack bot: a person's newest approved ship. GET ?slackId= answers { ship: { projectId, title, url, approvedAt } | null }.
import { botGuard, botInvalid, botJson, checkSlackId } from "@/lib/platform/bot/auth";
import { lastApprovedShip } from "@/lib/platform/bot/people-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "ships-last");
  if (denied) return denied;
  const slackId = checkSlackId(new URL(request.url).searchParams.get("slackId"), "slackId");
  if (!slackId.ok) return botInvalid(rid, slackId.message);
  return botJson(rid, { ship: await lastApprovedShip(slackId.value) });
}
