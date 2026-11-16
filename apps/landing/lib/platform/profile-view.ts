// Pure rules for the profile screens: the status and track filter in the address, who sees what, handle display. No database,
// no framework; every function has a bun test (profile-view.test.ts).
//
// API:
//   PUBLIC_LEVELS_ENABLED          false until per-person approved hours exist (spec Q1): levels show on your own profile only
//   parseProfileQuery(raw, own)    -> { tab, track }    unknown values fall back to the view's default tab and no track
//   profileHref(base, query, own)  -> address ending in #profile-projects; defaults are left out
//   ownTabs(rows) / publicTabs(rows) -> [{ key, label, count }]      the links above the list
//   filterProjects(rows, query)    -> rows for the tab and track
//   ownProjectTag(row)             -> "On your profile" | "Hidden" | "Private"
//   handleLabel(handle)            -> the handle, or "a builder" when there is none
//   topTrack(levels)               -> highest track level (ties go to the track listed first), or null with no level
//   summariseHandles(handles, max) -> { shown, more }       the "Used by" row: 12 handles and "and N more"
//   joinedLabel(date)              -> "Nov 2026" (UTC)
//   projectCountLabel(label, n)    -> "Draft, 1 project"    the accessible name of a filter link
import { isPublicProject, normalizeStatus, statusTabs, STATUS_TABS, type StatusTab } from "./profile";
import { TRACKS, type Track } from "./progress";
import { trackBySlug } from "./tracks";

// Spec Q1: every builder has the same sample levels, so another builder's public profile hides them until real hours exist.
export const PUBLIC_LEVELS_ENABLED = false;

export const PROFILE_ANCHOR = "profile-projects";
export const USED_BY_SHOWN = 12;

export type ProfileTabKey = "all" | "draft" | "logging" | "submitted" | "in-review" | "needs-changes" | "approved" | "building";
export type ProfileQuery = { tab: ProfileTabKey; track: Track | null };

const OWN_TABS: readonly string[] = ["all", ...STATUS_TABS.map((tab) => tab.key)];
const PUBLIC_TABS: readonly string[] = ["approved", "building"];

export const defaultTab = (own: boolean): ProfileTabKey => (own ? "all" : "approved");

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

export function parseProfileQuery(raw: { tab?: string | string[]; track?: string | string[] }, own: boolean): ProfileQuery {
  const tab = first(raw.tab).trim().toLowerCase();
  const allowed = own ? OWN_TABS : PUBLIC_TABS;
  return {
    tab: (allowed.includes(tab) ? tab : defaultTab(own)) as ProfileTabKey,
    track: trackBySlug(first(raw.track).trim().toLowerCase()),
  };
}

export function profileHref(base: string, query: ProfileQuery, own: boolean): string {
  const params = new URLSearchParams();
  if (query.tab !== defaultTab(own)) params.set("tab", query.tab);
  if (query.track) params.set("track", query.track.toLowerCase());
  const text = params.toString();
  return `${base}${text ? `?${text}` : ""}#${PROFILE_ANCHOR}`;
}

type Row = { status: string; track: string | null; hidden: boolean; showBuilding: boolean; pinned: boolean };

export const ownTabs = (rows: readonly Pick<Row, "status">[]): StatusTab[] => statusTabs(rows);

// Public rows are already public: approved ones, and logging ones shown as building. "Building" appears only when there is one.
export function publicTabs(rows: readonly Pick<Row, "status" | "hidden" | "showBuilding">[]): StatusTab[] {
  const visible = rows.filter(isPublicProject);
  const approved = visible.filter((row) => normalizeStatus(row.status) === "approved").length;
  const building = visible.filter((row) => normalizeStatus(row.status) === "logging").length;
  return [{ key: "approved", label: "Approved", count: approved }, ...(building > 0 ? [{ key: "building", label: "Building", count: building }] : [])];
}

export function filterProjects<T extends Pick<Row, "status" | "track">>(rows: readonly T[], query: ProfileQuery): T[] {
  return rows.filter((row) => {
    if (query.track && row.track !== query.track) return false;
    if (query.tab === "all") return true;
    const status = normalizeStatus(row.status);
    return query.tab === "building" ? status === "logging" : status === query.tab;
  });
}

export function tabLabel(key: string): string {
  if (key === "all") return "All";
  if (key === "building") return "Building";
  return STATUS_TABS.find((tab) => tab.key === key)?.label ?? key;
}

export type OwnTag = "On your profile" | "Hidden" | "Private";

// What the owner's own list says about each project: visible to others, hidden by the owner, or never public in this state.
export function ownProjectTag(row: Pick<Row, "status" | "hidden" | "showBuilding">): OwnTag {
  if (normalizeStatus(row.status) === "approved" && row.hidden) return "Hidden";
  return isPublicProject(row) ? "On your profile" : "Private";
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

const joined = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
export const joinedLabel = (date: Date): string => joined.format(date);

export const projectCountLabel = (label: string, count: number): string => `${label}, ${count} ${count === 1 ? "project" : "projects"}`;

// A signed-in builder who opens their own handle lands on the own profile; a mixed-case address goes to the lower-case one.
export function builderRedirect(viewerId: string, profileId: string, param: string, handle: string): "own" | "lower" | null {
  if (viewerId === profileId) return "own";
  return param !== handle ? "lower" : null;
}
