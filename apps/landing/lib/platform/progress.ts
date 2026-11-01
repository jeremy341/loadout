// Track progress and Ore for the Overview. Approved hours are not recorded yet, so every track starts at
// "Not started" and Ore is zero. Each function is the one place to change when the ledger exists.

export const TRACKS = ["Tools", "Systems", "Compute", "Hardware"] as const;
export type Track = (typeof TRACKS)[number];

// Lifetime levels run from LV.1 to LV.15 (plans/02-economy-and-rewards.md). The XP curve between them is still open,
// so the bar shows levels, not XP.
export const LEVEL_CAP = 15;

export type TrackProgress = { track: Track; level: number };

// Level per track. Zero means no approved hours yet.
export function trackProgress(): TrackProgress[] {
  return TRACKS.map((track) => ({ track, level: 0 }));
}

// Approved track hours needed for each level, LV.1 to LV.15. Only LV.5, 8, 11 and 15 (35, 90, 160 and 275 hours) are
// set by the owner's decisions; the other values are sample values until the XP curve is decided (plans/02).
export const LEVEL_HOURS = [2, 6, 14, 24, 35, 52, 70, 90, 112, 135, 160, 188, 216, 245, 275] as const;

// Rewards at the set levels. A draft, like the hours: the discount plan is provisional.
export const LEVEL_REWARDS: Record<number, string> = { 5: "10% coupon", 8: "10% coupon", 11: "10% coupon", 15: "Max level" };

// The level a number of approved hours reaches: how many levels' hours it has met.
export function levelForHours(hours: number): number {
  return LEVEL_HOURS.filter((needed) => hours >= needed).length;
}

// Hours still missing for the next level, or null at the top.
export function hoursToNextLevel(hours: number): number | null {
  const level = levelForHours(hours);
  return level >= LEVEL_CAP ? null : Math.max(0, LEVEL_HOURS[level] - hours);
}

// Hours needed for a level, with LV.0 at zero.
export function hoursForLevel(level: number): number {
  return level <= 0 ? 0 : LEVEL_HOURS[Math.min(level, LEVEL_CAP) - 1];
}

// Sample hours per track for the Overview and the track pages, until approved hours exist.
// trackProgress() stays the real value and is still zero.
const SAMPLE_HOURS: Record<Track, Hours> = {
  Tools: { approved: 58, pending: 6 },
  Systems: { approved: 14, pending: 0 },
  Compute: { approved: 0, pending: 0 },
  Hardware: { approved: 2, pending: 0 },
};

export function sampleTrackHours(track: Track): Hours {
  return SAMPLE_HOURS[track];
}

export function sampleTrackProgress(): TrackProgress[] {
  return TRACKS.map((track) => ({ track, level: levelForHours(SAMPLE_HOURS[track].approved) }));
}

// Ore is global and spendable. Every approved hour earns 10 Ore (plans/02). None is approved yet.
export function oreBalance(): number {
  return 0;
}

// Depth is approved hours in metres: 1 M for every approved hour (owner decision, 31 Oct 2026). A project's depth is its
// approved hours, and the account's depth is the sum over its projects. Hours that are logged but not yet reviewed are
// pending, and the interface shows them hatched next to the depth instead of counting them.
export type Hours = { approved: number; pending: number };

// Hours for one project. Hours are not recorded yet, so this is zero; it is the one place to change when they are.
export function projectHours(projectId: string): Hours {
  void projectId;
  return { approved: 0, pending: 0 };
}

export function sumHours(list: Hours[]): Hours {
  return list.reduce((sum, hours) => ({ approved: sum.approved + hours.approved, pending: sum.pending + hours.pending }), { approved: 0, pending: 0 });
}

// "0 M" at the surface, then "-12 M", "-222 M". Part hours do not round up into a metre.
export function formatDepth(approvedHours: number): string {
  const metres = Math.max(0, Math.floor(approvedHours));
  return metres === 0 ? "0 M" : `-${metres} M`;
}

// One cell per level. Cells up to the current level are filled.
export function levelCells(level: number): boolean[] {
  const filled = Math.min(Math.max(Math.floor(level), 0), LEVEL_CAP);
  return Array.from({ length: LEVEL_CAP }, (_, index) => index < filled);
}

export function trackStatus(level: number): string {
  if (level <= 0) return "Not started";
  return `LV.${level} of ${LEVEL_CAP}`;
}
