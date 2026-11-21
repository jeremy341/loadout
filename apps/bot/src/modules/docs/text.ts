// Pure text helpers for the docs answerer, no I/O.
// API: normaliseQuestion(q) -> lower case, no punctuation; tokens(q) -> content words (stop words removed);
//      overlap(a, b) -> Jaccard similarity of two questions' content words (0 to 1);
//      scorePassages(question, passages) -> ranked matches; answerFromCorpus(question, passages) -> top passages or null;
//      htmlToText(html), parseSitemapLocs(xml), isDocUrl(url, origin), chunkText(text).
export type Passage = { url: string; title: string; text: string };

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "could", "do", "does", "for", "from", "how", "i",
  "if", "in", "is", "it", "its", "me", "my", "no", "not", "of", "on", "or", "so", "that", "the", "their", "they", "this",
  "to", "was", "we", "what", "when", "where", "which", "who", "why", "will", "with", "would", "you", "your", "there",
  "should",
]);

export function normaliseQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(question: string): string[] {
  return normaliseQuestion(question)
    .split(" ")
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

export function overlap(a: string, b: string): number {
  const setA = new Set(tokens(a));
  const setB = new Set(tokens(b));
  if (setA.size === 0 && setB.size === 0) return 0;
  let shared = 0;
  for (const t of setA) if (setB.has(t)) shared++;
  const union = setA.size + setB.size - shared;
  return union === 0 ? 0 : shared / union;
}

export type Scored = { passage: Passage; matched: number; score: number };

// Keyword score: the share of the question's distinct content words found in the passage (title included).
export function scorePassages(question: string, passages: readonly Passage[]): Scored[] {
  const wanted = [...new Set(tokens(question))];
  if (wanted.length === 0) return [];
  return passages.map((passage) => {
    const found = new Set(tokens(`${passage.title} ${passage.text}`));
    const matched = wanted.filter((w) => found.has(w)).length;
    return { passage, matched, score: matched / wanted.length };
  });
}

// A passage counts only when enough distinct words match: two of them, or all of them for a one or two word question.
const MIN_SCORE = 0.3;

export function answerFromCorpus(question: string, passages: readonly Passage[], limit = 3): Scored[] | null {
  const distinct = new Set(tokens(question)).size;
  if (distinct === 0) return null;
  const minMatched = Math.min(2, distinct);
  const ranked = scorePassages(question, passages)
    .filter((s) => s.matched >= minMatched && s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return ranked.length > 0 ? ranked : null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => codePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => codePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
}

function codePoint(n: number): string {
  return Number.isInteger(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
}

// Stripped to readable text: scripts, styles and page chrome go; block tags become line breaks.
export function htmlToText(html: string): { title: string; text: string } {
  const title = decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|nav|footer|header|aside)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<\/?(p|div|li|h[1-6]|tr|section|article|pre|br|ul|ol|table)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const text = decodeEntities(body)
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, text };
}

export function parseSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    if (m[1]) locs.push(decodeEntities(m[1]));
  }
  return locs;
}

// A page the corpus may fetch: same origin as the site, under /docs, not an internal plans path, not a sitemap.
export function isDocUrl(url: string, origin: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.origin !== origin || u.hash) return false;
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const path = u.pathname;
  if (path !== "/docs" && !path.startsWith("/docs/")) return false;
  if (path.split("/").includes("plans")) return false;
  if (path.endsWith(".xml")) return false;
  return true;
}

// Splits text into passages of about maxChars, breaking on blank lines first, then hard-splitting long paragraphs.
export function chunkText(text: string, maxChars = 900): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => {
      if (p.length <= maxChars) return [p];
      const parts: string[] = [];
      for (let i = 0; i < p.length; i += maxChars) parts.push(p.slice(i, i + maxChars));
      return parts;
    });
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if (current && current.length + p.length + 2 > maxChars) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
