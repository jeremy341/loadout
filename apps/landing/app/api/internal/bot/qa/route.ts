// Slack bot: the answered-questions cache. GET ?q= answers { qa: QaHit | null } and counts a hit; stale is true after 30 days.
// PUT { question, answer, links } stores an answer (links are site paths) and answers { qa }.
import { botGuard, botInvalid, botJson, checkFields, checkText, queryText, readJson } from "@/lib/platform/bot/auth";
import { getQa, putQa } from "@/lib/platform/bot/qa-data";
import { checkLinks, normaliseQuestion, QA_ANSWER_MAX, QA_QUESTION_MAX } from "@/lib/platform/bot/qa";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "qa");
  if (denied) return denied;
  const question = queryText(new URL(request.url), "q", QA_QUESTION_MAX);
  if (!question.ok) return botInvalid(rid, question.message);
  return botJson(rid, { qa: await getQa(question.value) });
}

export async function PUT(request: Request) {
  const { id: rid, denied } = await botGuard(request, "qa");
  if (denied) return denied;
  const body = await readJson(request);
  if (!body.ok) return botInvalid(rid, body.message);
  const fields = checkFields(body.value, ["question", "answer", "links"]);
  if (!fields.ok) return botInvalid(rid, fields.message);
  const question = checkText(fields.value.question, "question", QA_QUESTION_MAX, true);
  if (!question.ok) return botInvalid(rid, question.message);
  if (normaliseQuestion(question.value) === "") return botInvalid(rid, "question needs some words");
  const answer = checkText(fields.value.answer, "answer", QA_ANSWER_MAX, true);
  if (!answer.ok) return botInvalid(rid, answer.message);
  const links = checkLinks(fields.value.links);
  if (!links.ok) return botInvalid(rid, links.message);

  const row = await putQa({ question: question.value, answer: answer.value, links: links.value });
  if (!row) return botInvalid(rid, "question needs some words");
  return botJson(rid, { qa: row });
}
