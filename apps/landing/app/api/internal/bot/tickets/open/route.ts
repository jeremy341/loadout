// Slack bot: the open help desk tickets, least recently active first. Answers { tickets: TicketRow[] }.
import { botGuard, botJson } from "@/lib/platform/bot/auth";
import { listOpen } from "@/lib/platform/bot/tickets-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "tickets-open");
  if (denied) return denied;
  return botJson(rid, { tickets: await listOpen() });
}
