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

// Ore is global and spendable. Every approved hour earns 10 Ore (plans/02). None is approved yet.
export function oreBalance(): number {
  return 0;
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
