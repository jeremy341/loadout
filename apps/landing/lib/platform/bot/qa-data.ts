// The answered-questions cache for docs answers (the BotQaCache table). Server only. The rules are in qa.ts.
//
// API:
//   getQa(question, now?) -> QaHit | null     exact normalised match first, then the best of the 200 most recently confirmed
//                                             at 0.8 overlap or more. Every hit adds one to hits. stale is true after 30 days.
//   putQa(row, now?) -> QaHit | null          stores or refreshes an answer and its confirmation date; null for a blank question
import { db } from "../db";
import { isStale, normaliseQuestion, pickFuzzy, QA_SCAN } from "./qa";

export type QaHit = { question: string; answer: string; links: string[]; hits: number; confirmedAt: string; stale: boolean };

export async function getQa(question: string, now = new Date()): Promise<QaHit | null> {
  const key = normaliseQuestion(question);
  if (key === "") return null;
  const exact = await db().botQaCache.findUnique({ where: { question: key } });
  const row = exact ?? pickFuzzy(key, await db().botQaCache.findMany({ orderBy: { confirmedAt: "desc" }, take: QA_SCAN }));
  if (!row) return null;
  const counted = await db().botQaCache.update({ where: { id: row.id }, data: { hits: { increment: 1 } } });
  return {
    question: counted.question,
    answer: counted.answer,
    links: counted.links,
    hits: counted.hits,
    confirmedAt: counted.confirmedAt.toISOString(),
    stale: isStale(counted.confirmedAt, now),
  };
}

export async function putQa(input: { question: string; answer: string; links: string[] }, now = new Date()): Promise<QaHit | null> {
  const key = normaliseQuestion(input.question);
  if (key === "") return null;
  const row = await db().botQaCache.upsert({
    where: { question: key },
    update: { answer: input.answer, links: input.links, confirmedAt: now },
    create: { question: key, answer: input.answer, links: input.links, confirmedAt: now },
  });
  return {
    question: row.question,
    answer: row.answer,
    links: row.links,
    hits: row.hits,
    confirmedAt: row.confirmedAt.toISOString(),
    stale: false,
  };
}
