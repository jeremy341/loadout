import type { Track } from "./progress";
import { trackBySlug } from "./tracks";

// Explore lists projects other builders can see. Only an approved project is public; drafts and work in review stay with
// their owner.
export const EXPLORE_STATUS = "approved";
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

// The address for a filter, keeping the search text. The default view has no query at all.
export function exploreHref(query: { q: string; track: string | null }): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.track) params.set("track", query.track.toLowerCase());
  const text = params.toString();
  return text ? `/dashboard/explore?${text}` : "/dashboard/explore";
}
