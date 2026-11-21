// Pure project search model (no database). Tests: search.test.ts.
//
// API:
//   SEARCH_QUERY_MAX = 80, SEARCH_TOKENS_MAX = 6
//   parseSearchQuery(raw) -> { text, tokens, track, by }
//       trims, collapses spaces, cuts at 80 characters. Words become lower-case tokens (a leading "@" is dropped, duplicates removed).
//       Two filters are read out of the text: "track:tools" (a known track, otherwise left as a plain word) and "by:handle".
//       There is no "used:" filter; "saved" is its own switch (the savedOnly option / the `saved` request parameter).
//   scoreProject(project, tokens, { saved, usedBy }) -> number     0 means "does not match"; bigger sorts first
//       tiers: exact title, title prefix, title contains, exact handle, handle contains, description contains. Every token has to
//       match somewhere (the weakest token sets the tier). Saved, then confirmed uses, break ties inside a tier. No tokens: every
//       project matches in one shared tier (browse order).
//   rankResults(rows, tokens) -> rows that match, best first; ties: saved, used by, newest, then id
//   highlightRanges(text, tokens) -> [{ start, end }]   merged, sorted, case-blind ranges to wrap in <mark>; no HTML here
import type { Track } from "./progress";
import { trackBySlug } from "./tracks";

export const SEARCH_QUERY_MAX = 80;
export const SEARCH_TOKENS_MAX = 6;

export type ParsedSearch = { text: string; tokens: string[]; track: Track | null; by: string | null };

export function parseSearchQuery(raw: unknown): ParsedSearch {
  const text = (typeof raw === "string" ? raw : "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_QUERY_MAX)
    .trim();
  let track: Track | null = null;
  let by: string | null = null;
  const tokens: string[] = [];
  for (const word of text.toLowerCase().split(" ")) {
    if (word === "") continue;
    const colon = word.indexOf(":");
    if (colon > 0) {
      const key = word.slice(0, colon);
      const value = word.slice(colon + 1);
      if (key === "track" && !track && trackBySlug(value)) {
        track = trackBySlug(value);
        continue;
      }
      const handle = value.replace(/^@+/, "");
      if (key === "by" && by === null && handle !== "") {
        by = handle;
        continue;
      }
    }
    const token = word.replace(/^@+/, "");
    if (token !== "" && !tokens.includes(token) && tokens.length < SEARCH_TOKENS_MAX) tokens.push(token);
  }
  return { text, tokens, track, by };
}

export type ScorableProject = { title: string; description: string | null; ownerHandle: string | null };

const TIER = { exactTitle: 1000, titlePrefix: 800, titleContains: 700, handleExact: 550, handleContains: 500, description: 300, browse: 1 } as const;

function tokenTier(project: ScorableProject, token: string): number {
  const title = project.title.toLowerCase();
  const handle = (project.ownerHandle ?? "").toLowerCase();
  const description = (project.description ?? "").toLowerCase();
  if (title === token) return TIER.exactTitle;
  if (title.startsWith(token)) return TIER.titlePrefix;
  if (title.includes(token)) return TIER.titleContains;
  if (handle !== "" && handle === token) return TIER.handleExact;
  if (handle !== "" && handle.includes(token)) return TIER.handleContains;
  if (description.includes(token)) return TIER.description;
  return 0;
}

export function scoreProject(project: ScorableProject, tokens: readonly string[], ctx: { saved: boolean; usedBy: number }): number {
  let relevance: number;
  if (tokens.length === 0) {
    relevance = TIER.browse;
  } else if (project.title.toLowerCase() === tokens.join(" ")) {
    relevance = TIER.exactTitle;
  } else {
    relevance = Math.min(...tokens.map((token) => tokenTier(project, token)));
  }
  if (relevance === 0) return 0;
  return relevance * 1_000_000 + (ctx.saved ? 10_000 : 0) + Math.min(Math.max(0, Math.floor(ctx.usedBy)), 9_999);
}

export type RankableRow = ScorableProject & { id: string; saved: boolean; usedBy: number; createdAt: string | Date };

const time = (value: string | Date): number => (value instanceof Date ? value.getTime() : Date.parse(value)) || 0;

export function rankResults<T extends RankableRow>(rows: readonly T[], tokens: readonly string[]): T[] {
  return rows
    .map((row) => ({ row, score: scoreProject(row, tokens, { saved: row.saved, usedBy: row.usedBy }) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || time(b.row.createdAt) - time(a.row.createdAt) || a.row.id.localeCompare(b.row.id))
    .map((entry) => entry.row);
}

export type Range = { start: number; end: number };

// Folds to lower case one character at a time and keeps the original when the length would change, so offsets in the folded
// text are offsets in the original.
function fold(text: string): string {
  let out = "";
  for (const unit of text) {
    const lower = unit.toLowerCase();
    out += lower.length === unit.length ? lower : unit;
  }
  return out;
}

export function highlightRanges(text: string, tokens: readonly string[]): Range[] {
  const needles = [...new Set(tokens.map((t) => fold(t.trim())).filter((t) => t !== ""))];
  if (text === "" || needles.length === 0) return [];
  const haystack = fold(text);
  const found: Range[] = [];
  for (const needle of needles) {
    let from = 0;
    for (;;) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;
      found.push({ start: at, end: at + needle.length });
      from = at + needle.length;
    }
  }
  found.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: Range[] = [];
  for (const range of found) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}
