import { MAX_PINS, type Collectible, type GearStats } from "../data";

// Collectibles. No plan defines a catalog, so every collectible and condition in data.ts is a Draft preview rule.
// A collectible is earned once and kept: the earned map is never reduced when the numbers behind it fall.

/** collectible id -> ISO time it was earned. */
export type EarnedMap = Record<string, string>;

export const EMPTY_STATS: GearStats = {
  ordersPlaced: 0,
  ordersDelivered: 0,
  wishlistCount: 0,
  oreSpent: 0,
  requisitionsUsed: 0,
  customRequests: 0,
  scenariosSaved: 0,
  referralsInvited: 0,
  referralsQualified: 0,
  maxLevel: 0,
};

export function isSatisfied(collectible: Collectible, stats: GearStats): boolean {
  const condition = collectible.condition;
  if (condition.type === "manual") return false;
  return stats[condition.stat] >= condition.atLeast;
}

/** Collectibles whose condition now holds and that are not yet earned. Manual ones are never returned. */
export function newlyEarned(catalog: readonly Collectible[], stats: GearStats, earned: EarnedMap): Collectible[] {
  return catalog.filter((collectible) => !earned[collectible.id] && isSatisfied(collectible, stats));
}

export function applyEarned(earned: EarnedMap, ids: readonly string[], now: string): EarnedMap {
  const next = { ...earned };
  for (const id of ids) if (!next[id]) next[id] = now;
  return next;
}

/** Marks a manual collectible as claimed. Collectibles with a checkable condition cannot be claimed by hand. */
export function claimManual(
  collectible: Collectible,
  earned: EarnedMap,
  now: string,
): { ok: true; earned: EarnedMap } | { ok: false; error: string } {
  if (collectible.condition.type !== "manual") return { ok: false, error: "This collectible unlocks by itself when its condition is met." };
  if (earned[collectible.id]) return { ok: false, error: "You already have this collectible." };
  return { ok: true, earned: applyEarned(earned, [collectible.id], now) };
}

export interface Progress {
  have: number;
  need: number;
  label: string;
}

export function progressFor(collectible: Collectible, stats: GearStats): Progress | null {
  const condition = collectible.condition;
  if (condition.type === "manual") return null;
  return { have: Math.min(stats[condition.stat], condition.atLeast), need: condition.atLeast, label: condition.label };
}

export type PinResult = { ok: true; pins: string[]; pinned: boolean } | { ok: false; error: string };

/** Pins or unpins an earned collectible. At most three can be pinned. */
export function togglePin(pins: readonly string[], id: string, earned: EarnedMap): PinResult {
  if (pins.includes(id)) return { ok: true, pins: pins.filter((pin) => pin !== id), pinned: false };
  if (!earned[id]) return { ok: false, error: "Only collectibles you own can be pinned." };
  if (pins.length >= MAX_PINS) return { ok: false, error: `You can pin up to ${MAX_PINS}. Unpin one first.` };
  return { ok: true, pins: [...pins, id], pinned: true };
}

/** Drops pins for collectibles that are not owned or no longer exist. */
export function cleanPins(pins: readonly string[], earned: EarnedMap, catalog: readonly Collectible[]): string[] {
  const known = new Set(catalog.map((c) => c.id));
  return pins.filter((pin) => known.has(pin) && earned[pin]).slice(0, MAX_PINS);
}
