import type { Track } from "./progress";
import { trackBySlug } from "./tracks";

// Explore lists projects other builders can see. Every project is public, drafts included (owner, 16 Nov 2026); the data
// layer (discover-data.ts) leaves out only banned projects and banned owners.
export const EXPLORE_QUERY_MAX = 80;
export const EXPLORE_PAGE_SIZE = 60;

export type ExploreQuery = { q: string; track: Track | null };

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

// Reads the search box and the track filter from the address. Anything unknown is ignored rather than an error: the page
// then simply shows everything.
export function parseExploreQuery(raw: { q?: string | string[]; track?: string | string[] }): ExploreQuery {
  return {
    q: first(raw.q).trim().slice(0, EXPLORE_QUERY_MAX),
    track: trackBySlug(first(raw.track).trim().toLowerCase()),
  };
}

export const EXPLORE_RESULTS_SIZE = 24;
export const EXPLORE_LIVE_SIZE = 12;

export type ExploreParams = { q: string; track: Track | null; saved: boolean; page: number };

const flag = (value: string): boolean => value === "1" || value === "true";

// Everything the Explore address can carry: ?q=&track=&saved=1&page=. A bad page number is page 1; saved reads "1" or "true".
export function parseExploreParams(raw: { q?: string | string[]; track?: string | string[]; saved?: string | string[]; page?: string | string[] }): ExploreParams {
  const base = parseExploreQuery(raw);
  const page = Number.parseInt(first(raw.page).trim(), 10);
  return { ...base, saved: flag(first(raw.saved).trim().toLowerCase()), page: Number.isFinite(page) && page >= 1 ? Math.min(page, 1000) : 1 };
}

// True when the page shows the result grid (a search, a track or the Saved filter) instead of the rails.
export function isFiltered(params: { q: string; track: unknown; saved: boolean }): boolean {
  return params.q !== "" || params.track !== null || params.saved;
}

// The address for a filter, keeping the search text. The default view has no query at all.
export function exploreHref(query: { q: string; track: string | null; saved?: boolean; page?: number; cursor?: string | null }): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.track) params.set("track", query.track.toLowerCase());
  if (query.saved) params.set("saved", "1");
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.cursor) params.set("cursor", query.cursor);
  const text = params.toString();
  return text ? `/dashboard/explore?${text}` : "/dashboard/explore";
}

// The live search address on /platform-search, built from the same parts.
export function liveSearchUrl(query: { q: string; track: string | null; saved: boolean }, limit = EXPLORE_LIVE_SIZE): string {
  const params = new URLSearchParams({ scope: "explore", q: query.q, limit: String(limit) });
  if (query.track) params.set("track", query.track.toLowerCase());
  if (query.saved) params.set("saved", "1");
  return `/platform-search?${params.toString()}`;
}

// The feed address on /platform-explore (the next 21 cards as JSON), built from the same parts.
export function feedUrl(query: { q: string; track: string | null; saved: boolean }, cursor: string | null): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.track) params.set("track", query.track.toLowerCase());
  if (query.saved) params.set("saved", "1");
  if (cursor) params.set("cursor", cursor);
  const text = params.toString();
  return text ? `/platform-explore?${text}` : "/platform-explore";
}

// Paging for the result grid. A page past the end is clamped to the last page.
export function pageWindow(total: number, page: number, size = EXPLORE_RESULTS_SIZE): { page: number; pages: number; offset: number; hasPrev: boolean; hasNext: boolean } {
  const count = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const pages = Math.max(1, Math.ceil(count / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { page: current, pages, offset: (current - 1) * size, hasPrev: current > 1, hasNext: current < pages };
}

// "12 projects." / "1 project." / "0 projects."
export function projectCountLine(total: number): string {
  return `${total} ${total === 1 ? "project" : "projects"}.`;
}

// Rail rules. "Used most" stays hidden until some project has a confirmed use. A rail is shown only when it has rows.
export function usedMostRows<T extends { usedBy: number }>(rows: readonly T[]): T[] {
  return rows.filter((row) => row.usedBy > 0);
}

export function railsToShow<T>(rails: readonly { key: string; rows: readonly T[] }[]): string[] {
  return rails.filter((rail) => rail.rows.length > 0).map((rail) => rail.key);
}

// The text under the empty result grid.
export function emptyResultsKind(params: { q: string; saved: boolean }, anySaved: boolean): "saved-none" | "saved-no-match" | "no-match" {
  if (params.saved && params.q === "" && !anySaved) return "saved-none";
  if (params.saved) return "saved-no-match";
  return "no-match";
}
