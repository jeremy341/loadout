// Small text helpers: cleaning, length checks, https-only URL checks and duplicate-title detection.

/** Normalises line endings, trims, and collapses runs of blank lines. User text is always rendered as text. */
export function cleanText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Length in characters as a person counts them (an emoji is one). */
export function textLength(value: string): number {
  return Array.from(value).length;
}

/** Returns an error message, or null when the (already cleaned) value is within bounds. */
export function checkLength(value: string, label: string, opts: { min?: number; max: number }): string | null {
  const length = textLength(value);
  const min = opts.min ?? 1;
  if (length === 0 && min > 0) return `${label} is required.`;
  if (length < min) return `${label} needs at least ${min} characters (it has ${length}).`;
  if (length > opts.max) return `${label} can be at most ${opts.max} characters (it has ${length}).`;
  return null;
}

/**
 * Parses a participant-entered link. Only https links with a real host, no embedded credentials and no
 * whitespace are accepted. Returns the normalised URL, or null when the value is not acceptable.
 */
export function parseHttpsUrl(value: string, maxLength = 300): string | null {
  const text = value.trim();
  if (text.length === 0 || text.length > maxLength || /\s/.test(text)) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "") return null;
  if (!url.hostname.includes(".") || url.hostname.startsWith(".") || url.hostname.endsWith(".")) return null;
  return url.href;
}

/** Error message for a link field, or null when valid. `required: false` allows an empty value. */
export function checkHttpsUrl(value: string, label: string, opts: { required: boolean; max: number }): string | null {
  const text = value.trim();
  if (text.length === 0) return opts.required ? `${label} is required.` : null;
  if (/^http:\/\//i.test(text)) return `${label} must start with https:// (plain http links are not allowed).`;
  if (text.length > opts.max) return `${label} can be at most ${opts.max} characters.`;
  if (parseHttpsUrl(text, opts.max) === null) return `${label} must be a full https:// link, for example https://github.com/you/project.`;
  return null;
}

/** Lower-cases, strips punctuation and collapses spaces so "Hello,  World!" and "hello world" compare equal. */
export function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(title: string): Set<string> {
  return new Set(normaliseTitle(title).split(" ").filter((t) => t.length > 2));
}

/**
 * Finds an existing item whose title is the same after normalising, or shares at least 75% of its meaningful
 * words with the new title (and both have at least three of them). Used for the duplicate-title warning,
 * which warns and never blocks.
 */
export function findSimilarTitle<T extends { id: string; title: string }>(title: string, existing: T[], ignoreId?: string): T | null {
  const target = normaliseTitle(title);
  if (target.length === 0) return null;
  const targetTokens = tokens(title);
  for (const item of existing) {
    if (item.id === ignoreId) continue;
    if (normaliseTitle(item.title) === target) return item;
    if (targetTokens.size < 3) continue;
    const other = tokens(item.title);
    if (other.size < 3) continue;
    let shared = 0;
    for (const token of targetTokens) if (other.has(token)) shared += 1;
    const union = targetTokens.size + other.size - shared;
    if (shared / union >= 0.75) return item;
  }
  return null;
}
