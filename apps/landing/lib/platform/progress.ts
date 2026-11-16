// Track progress and Ore for the Overview. Approved hours are not recorded yet, so every track starts at
// "Not started" and Ore is zero. Each function is the one place to change when the ledger exists.

export const TRACKS = ["Tools", "Systems", "Compute", "Hardware"] as const;
export type Track = (typeof TRACKS)[number];

// Lifetime levels run from LV.1 to LV.20 (plans/02-economy-and-rewards.md; LV.16 to LV.20 added 14 Nov 2026). Track XP is
// 10 per approved hour (owner, 14 Nov 2026), linear. Levels are still gated by approved hours, so the bar shows levels.
export const LEVEL_CAP = 20;

export type TrackProgress = { track: Track; level: number };

// Level per track. Zero means no approved hours yet.
export function trackProgress(): TrackProgress[] {
  return TRACKS.map((track) => ({ track, level: 0 }));
}

// Approved track hours needed for each level, LV.1 to LV.20. The whole curve was rescaled on 14 Nov 2026 so that LV.20 sits at
// 275 hours (the owner's request). The set levels LV.5, 8, 11, 15, 18 and 20 are 23, 58, 104, 178, 236 and 275 hours. The XP curve
// between them is still open (plans/02).
export const LEVEL_HOURS = [1, 4, 9, 16, 23, 34, 45, 58, 72, 87, 104, 122, 140, 159, 178, 197, 217, 236, 256, 275] as const;

// Rewards at the set levels. A draft, like the hours: the discount plan is provisional.
export const LEVEL_REWARDS: Record<number, string> = { 5: "10% coupon", 8: "10% coupon", 11: "10% coupon", 15: "10% coupon", 18: "10% coupon", 20: "Max level, 10% coupon" };

// The level a number of approved hours reaches: how many levels' hours it has met.
export function levelForHours(hours: number): number {
  return LEVEL_HOURS.filter((needed) => hours >= needed).length;
}

// Hours still missing for the next level, or null at the top.
export function hoursToNextLevel(hours: number): number | null {
  const level = levelForHours(hours);
  return level >= LEVEL_CAP ? null : Math.max(0, LEVEL_HOURS[level] - hours);
}

// The shop discount a track's approved hours give. Up to LV.15's hours it is linear per hour, 15% at LV.15 (now 178 hours),
// then rises linearly to 20% at LV.20's 275 hours, then stops (rescaled 14 Nov 2026). The rules doc still calls the curve
// between the set levels open, so treat the figures as a draft.
export const DISCOUNT_AT_LV15 = 15;
export const DISCOUNT_MAX = 20;

export function discountForHours(hours: number): number {
  const approved = Math.max(0, hours);
  const lv15 = LEVEL_HOURS[14];
  const top = LEVEL_HOURS[LEVEL_CAP - 1];
  if (approved <= lv15) return (approved / lv15) * DISCOUNT_AT_LV15;
  return Math.min(DISCOUNT_MAX, DISCOUNT_AT_LV15 + ((approved - lv15) / (top - lv15)) * (DISCOUNT_MAX - DISCOUNT_AT_LV15));
}

// The discount as shown: one decimal, rounded down, so a builder is never promised more than they have earned. Prices use
// this figure too, so what the page says and what the price does always agree.
export function shownDiscount(percent: number): number {
  return Math.floor(percent * 10 + 1e-9) / 10;
}

// Shown to one decimal and rounded down: 3.1%, 15%.
export function formatDiscount(percent: number): string {
  const shown = shownDiscount(percent);
  return Number.isInteger(shown) ? `${shown}%` : `${shown.toFixed(1)}%`;
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
