// Rules for the journal writer page (/dashboard/projects/[id]/journal/new and .../[entryId]/edit). Pure: no database, no framework.
//
// API:
//   photosNeeded(hours)            -> photos an entry should carry: max(1, ceil(hours / 4)), hours capped at 12 (so 1 to 3)
//   MAX_PHOTOS_PER_ENTRY           the most photos one entry can hold
//   splitHours(hours) / joinHours(h, m)   hours <-> whole hours and minutes (quarter hour steps)
//   oreEstimate(hours)             -> Ore the entry would earn once approved (10 Ore per approved hour, rounded like the ledger)
//   oreEstimateLine(hours, owner)  -> "About 25 Ore once approved." for the owner, null for anyone else or for no hours
//   uncoveredHours(others, hours)  -> hours not yet covered by an entry once this one counts
//   checkPhotoAlt(raw)             -> alt text rule: required, 200 characters at most
//   checkLapseUrl(raw)             -> Lapse address rule (Hardware entries only): empty is fine, else an https Lapse timelapse link
//   previewEntry(input)            -> the model both the Preview and the public timeline draw an entry from
//   draftKey(projectId, entryId)   -> the sessionStorage key for the unsent text
import { formatHours, JOURNAL_HOURS_MAX, journalDue, type Checked } from "./journal";
import { hoursToOre } from "./ledger";

export const PHOTO_HOURS_PER_IMAGE = 4;
export const MAX_PHOTOS_PER_ENTRY = 6;
export const PHOTO_ALT_MAX = 200;

export function photosNeeded(hours: number): number {
  const capped = Math.min(Number.isFinite(hours) ? Math.max(0, hours) : 0, JOURNAL_HOURS_MAX);
  return Math.max(1, Math.ceil(capped / PHOTO_HOURS_PER_IMAGE - 1e-9));
}

export function splitHours(hours: number): { hours: number; minutes: number } {
  const total = Number.isFinite(hours) ? Math.max(0, Math.round(hours * 60)) : 0;
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export function joinHours(hours: unknown, minutes: unknown): number {
  const h = Number(hours);
  const m = Number(minutes);
  return (Number.isFinite(h) ? Math.max(0, h) : 0) + (Number.isFinite(m) ? Math.max(0, m) : 0) / 60;
}

export function oreEstimate(hours: number): number {
  return hoursToOre(Number.isFinite(hours) ? Math.max(0, hours) : 0);
}

// Only the owner sees an Ore number for their own entry; a visitor never gets one (owner, 16 Nov 2026).
export function oreEstimateLine(hours: number, isOwner: boolean): string | null {
  if (!isOwner || !Number.isFinite(hours) || hours <= 0) return null;
  return `About ${oreEstimate(hours)} Ore once approved.`;
}

// otherHours and otherCount are the project's other entries; this entry is added to both.
export function uncoveredHours(otherHours: number, otherCount: number, hours: number): number {
  return journalDue(otherHours + (Number.isFinite(hours) ? Math.max(0, hours) : 0), otherCount + 1);
}

export function checkPhotoAlt(raw: unknown): Checked<string> {
  const alt = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (alt.length === 0) return { ok: false, message: "Describe the photo for people who can't see it." };
  if (alt.length > PHOTO_ALT_MAX) return { ok: false, message: `Keep the description under ${PHOTO_ALT_MAX} characters.` };
  return { ok: true, value: alt };
}

export function checkLapseUrl(raw: unknown): Checked<string | null> {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (text === "") return { ok: true, value: null };
  try {
    const url = new URL(text);
    if (url.protocol === "https:" && url.hostname === "lapse.hackclub.com" && /^\/timelapse\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) {
      return { ok: true, value: `https://lapse.hackclub.com${url.pathname.replace(/\/$/, "")}` };
    }
  } catch {
    // fall through
  }
  return { ok: false, message: "Paste a Lapse link that looks like https://lapse.hackclub.com/timelapse/..." };
}

export type PreviewPhoto = { id: string; alt: string; width: number; height: number };
export type PreviewEntry = {
  title: string;
  hoursText: string;
  dateIso: string;
  body: string;
  empty: boolean;
  photos: PreviewPhoto[];
};

// The entry as a visitor reads it: title, date, hours, body, photos. The public timeline and the writer's Preview both build from
// this, so they cannot drift apart. No Ore and no Lapse link: those are never part of the public model.
export function previewEntry(input: { title: string; body: string; hours: number; date: Date; photos?: readonly PreviewPhoto[] }): PreviewEntry {
  const title = input.title.replace(/\s+/g, " ").trim();
  return {
    title: title || "Untitled entry",
    hoursText: `${formatHours(Number.isFinite(input.hours) ? input.hours : 0)} logged`,
    dateIso: input.date.toISOString(),
    body: input.body,
    empty: input.body.trim().length === 0,
    photos: [...(input.photos ?? [])],
  };
}

export const draftKey = (projectId: string, entryId?: string | null): string => `loadout-journal-draft:${projectId}:${entryId ?? "new"}`;

// The photo rule covers entries created on or after this moment, so older entries are not suddenly short of photos. Set
// LOADOUT_PHOTO_RULE_FROM (an ISO date) to the day uploads go live. A missing or invalid cutoff covers every entry: when
// uploads are on, an unset configuration must not silently skip the photo check (fail closed). The gate ignores this value
// while uploads are off, so this only affects an uploads-on project.
export function photoRuleApplies(createdAt: Date, env: Record<string, string | undefined> = process.env): boolean {
  const from = Date.parse(env.LOADOUT_PHOTO_RULE_FROM ?? "");
  if (!Number.isFinite(from)) return true;
  return createdAt.getTime() >= from;
}
