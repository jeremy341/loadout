// Slack bot: the closed ticket most like a question, from the last 60 closed tickets. GET ?text= (required, up to 4000 characters).
// Answers { ticket: { id, title, url } | null }. Vague matches come back as null.
import { botGuard, botInvalid, botJson, queryText } from "@/lib/platform/bot/auth";
import { similar } from "@/lib/platform/bot/tickets-data";
import { TICKET_TEXT_MAX } from "@/lib/platform/bot/tickets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "tickets-similar");
  if (denied) return denied;
  const text = queryText(new URL(request.url), "text", TICKET_TEXT_MAX);
  if (!text.ok) return botInvalid(rid, text.message);
  return botJson(rid, { ticket: await similar(text.value) });
}
