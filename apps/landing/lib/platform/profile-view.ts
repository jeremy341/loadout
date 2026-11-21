// Pure rules for the profile screens: the old tab addresses, where a project opens, handle display. No database, no
// framework; every function has a bun test (profile-view.test.ts).
//
// API:
//   PUBLIC_LEVELS_ENABLED          false until per-person approved hours exist (spec Q1): levels show on your own profile only
//   isLegacyProfileTab(raw)        -> true for the removed ?tab=journal and ?tab=toolbelt (the pages redirect to the bare profile)
//   profileProjectHref(own, id, status) -> where a project card opens (every project is public, so there is always a page)
//   handleLabel(handle)            -> the handle, or "a builder" when there is none
//   topTrack(levels)               -> highest track level (ties go to the track listed first), or null with no level
//   summariseHandles(handles, max) -> { shown, more }       the "Used by" row: 12 handles and "and N more"
//   builderRedirect(...)           -> "own" | "lower" | null
import { LEVEL_CAP, levelForHours, TRACKS, type Track } from "./progress";

// Spec Q1: every builder has the same sample levels, so another builder's public profile hides them until real hours exist.
export const PUBLIC_LEVELS_ENABLED = false;

export const USED_BY_SHOWN = 12;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

// The two tabs that used to exist. A link with one of them goes to the bare profile, so the address does not keep a dead query.
export const LEGACY_PROFILE_TABS: readonly string[] = ["journal", "toolbelt"];
export const isLegacyProfileTab = (raw: string | string[] | undefined): boolean => LEGACY_PROFILE_TABS.includes(first(raw).trim().toLowerCase());

// Where a project on a profile opens. You open your own in the workspace; everyone else opens its public page. Every project is
// public, drafts included, so every card is a link.
export function profileProjectHref(own: boolean, id: string): string {
  return own ? `/dashboard/projects/${id}` : `/dashboard/explore/${id}`;
}

export const handleLabel = (handle: string | null | undefined): string => (handle ? handle : "a builder");

// The highest level wins; a tie goes to the track listed first (Tools, Systems, Compute, Hardware). No level at all is null.
export function topTrack(levels: readonly { track: Track; level: number }[]): { track: Track; level: number } | null {
  let best: { track: Track; level: number } | null = null;
  for (const track of TRACKS) {
    const row = levels.find((item) => item.track === track);
    if (row && row.level > 0 && (!best || row.level > best.level)) best = { track, level: row.level };
  }
  return best;
}

export function summariseHandles<T>(items: readonly T[], max = USED_BY_SHOWN): { shown: T[]; more: number } {
  return { shown: items.slice(0, max), more: Math.max(0, items.length - max) };
}

// A signed-in builder who opens their own handle lands on the own profile; a mixed-case address goes to the lower-case one.
export function builderRedirect(viewerId: string, profileId: string, param: string, handle: string): "own" | "lower" | null {
  if (viewerId === profileId) return "own";
  return param !== handle ? "lower" : null;
}

// The Track levels card on a profile (it takes the place of Stasis's Badges card): the four tracks in order with the level and the
// approved hours of each. Levels and hours are public, so a visitor sees the same card.
export type TrackLevelCard = { track: Track; level: number; approved: number; label: string };

export function trackLevelCards(hoursFor: (track: Track) => { approved: number }): TrackLevelCard[] {
  return TRACKS.map((track) => {
    const approved = Math.max(0, hoursFor(track).approved);
    const level = levelForHours(approved);
    return { track, level, approved, label: `LV.${level} of ${LEVEL_CAP}` };
  });
}
