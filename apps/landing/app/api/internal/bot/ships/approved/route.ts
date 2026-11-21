// Slack bot: every approved ship of a person, newest first (at most 50). GET ?slackId= answers { ships: ShipView[] }.
import { botGuard, botInvalid, botJson, checkSlackId } from "@/lib/platform/bot/auth";
import { approvedShips } from "@/lib/platform/bot/people-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "ships-approved");
  if (denied) return denied;
  const slackId = checkSlackId(new URL(request.url).searchParams.get("slackId"), "slackId");
  if (!slackId.ok) return botInvalid(rid, slackId.message);
  return botJson(rid, { ships: await approvedShips(slackId.value) });
}
