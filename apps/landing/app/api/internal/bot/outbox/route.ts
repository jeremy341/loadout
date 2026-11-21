// Slack bot: claim the due outbox items. Answers { items: { id, kind, slackId, text, href }[] } (at most 20). Each item is leased
// for two minutes; the bot sends it, then calls ack (or fail). Nothing is sent by this route.
import { botGuard, botJson } from "@/lib/platform/bot/auth";
import { claimOutbox } from "@/lib/platform/bot/outbox-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "outbox");
  if (denied) return denied;
  return botJson(rid, { items: await claimOutbox() });
}
