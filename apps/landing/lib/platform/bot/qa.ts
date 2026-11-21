// Pure rules for answered docs questions (the bot's BotQaCache). No database; every function has a bun test (qa.test.ts).
// The database wrappers are in qa-data.ts.
//
// API:
//   QA_FUZZY_MIN = 0.8, QA_STALE_DAYS = 30, QA_SCAN = 200 (rows read for a fuzzy match), QA_QUESTION_MAX = 500,
//   QA_ANSWER_MAX = 4000, QA_LINKS_MAX = 10, QA_LINK_MAX = 300
//   normaliseQuestion(raw) -> string        lower case, no punctuation, single spaces
//   tokens(text) -> string[]                the unique words of a normalised question
//   overlap(a, b) -> number                 Jaccard over the word sets, 0 to 1 (two empty sets score 0)
//   pickFuzzy(question, rows, min?) -> row | null    the best row at or above min (first one wins a tie)
//   isStale(confirmedAt, now) -> boolean    confirmed more than 30 days ago
//   checkLinks(raw) -> Check<string[]>      doc links: site paths starting with a single "/"
import type { Check } from "./auth";

export const QA_FUZZY_MIN = 0.8;
export const QA_STALE_DAYS = 30;
export const QA_SCAN = 200;
export const QA_QUESTION_MAX = 500;
export const QA_ANSWER_MAX = 4000;
export const QA_LINKS_MAX = 10;
export const QA_LINK_MAX = 300;
const DAY_MS = 86_400_000;

export function normaliseQuestion(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(text: string): string[] {
  const words = normaliseQuestion(text).split(" ").filter(Boolean);
  return [...new Set(words)];
}

export function overlap(a: string, b: string): number {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));
  if (left.size === 0 && right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared++;
  return shared / (left.size + right.size - shared);
}

export function pickFuzzy<T extends { question: string }>(question: string, rows: readonly T[], min = QA_FUZZY_MIN): T | null {
  let best: T | null = null;
  let bestScore = -1;
  for (const row of rows) {
    const score = overlap(question, row.question);
    if (score >= min && score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  return best;
}

export function isStale(confirmedAt: Date, now: Date): boolean {
  return now.getTime() - confirmedAt.getTime() > QA_STALE_DAYS * DAY_MS;
}

export function checkLinks(raw: unknown): Check<string[]> {
  if (!Array.isArray(raw)) return { ok: false, message: "links must be a list" };
  if (raw.length > QA_LINKS_MAX) return { ok: false, message: `links must have at most ${QA_LINKS_MAX} entries` };
  const links: string[] = [];
  for (const link of raw) {
    if (typeof link !== "string" || link.length > QA_LINK_MAX || !link.startsWith("/") || link.startsWith("//")) {
      return { ok: false, message: "each link must be a site path starting with /" };
    }
    links.push(link);
  }
  return { ok: true, value: links };
}
