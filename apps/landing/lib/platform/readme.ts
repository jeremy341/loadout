// README gate (Pixl precheck/readmeLength.ts, adopted). Pure: it takes the README text and returns a result. Fetching the text
// from the source address waits for the source link check; until then the gate has no text and says so.
export const MIN_README_WORDS = 100;

export type ReadmeGate =
  | { status: "waiting"; words: null; minWords: number }
  | { status: "passed" | "too_short" | "missing"; words: number; minWords: number };

// Prose words only: badges, addresses, Markdown marks, code and comments do not count.
export function readmeWordCount(markdown: string): number {
  const prose = markdown
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/\s*(?:script|style)\s*>/gi, " ")
    .replace(/(?:```|~~~)[\s\S]*?(?:```|~~~)/g, " ")
    .replace(/^(?: {4}|\t).+$/gm, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\](?:\([^)]*\)|\[[^\]]*\])/g, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\bhttps?:\/\/\S+/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_~>|{}[\]\\]/g, " ");
  let count = 0;
  for (const part of new Intl.Segmenter(undefined, { granularity: "word" }).segment(prose)) {
    if (part.isWordLike && /\p{L}/u.test(part.segment)) count += 1;
  }
  return count;
}

// null or undefined: no text yet (waiting, never a blocker). An empty text is a README with nothing in it (missing).
export function checkReadme(text: string | null | undefined): ReadmeGate {
  if (text === null || text === undefined) return { status: "waiting", words: null, minWords: MIN_README_WORDS };
  if (text.trim() === "") return { status: "missing", words: 0, minWords: MIN_README_WORDS };
  const words = readmeWordCount(text);
  return { status: words >= MIN_README_WORDS ? "passed" : "too_short", words, minWords: MIN_README_WORDS };
}
