import type { Category } from "./types";

export const HOUR_MS = 3_600_000;

/**
 * Rules the plans settle. Every number here has an owner; do not change one without changing the plan.
 */
export const RULES = {
  /** Plan 01 section 6 and Plan 02 decisions table: one journal entry per eight hours of development per project. */
  journalEveryHours: 8,
  /** Plan 22 section 1: a ship needs 12 countable peer reviews. */
  reviewsPerShip: 12,
  /** Plan 22 section 1 and Plan 01 section 35: eight valid reviews owed before the builder's own payout. */
  reviewsOwed: 8,
  /** Plan 22 section 1: each review has a written reason of at least ten words. */
  minReasonWords: 10,
  /** Plan 22 section 1: scores run from 1 to 9. */
  scoreMin: 1,
  scoreMax: 9,
  /** Plan 22 section 2: at least 24 hours since the latest journal entry attached to the ship before the award locks. */
  journalAgeHours: 24,
  /** Plan 22 section 2: the flag window runs 24 hours after the award snapshot is locked. */
  flagWindowHours: 24,
  /** Plan 22 section 2: three rejected flags within ten hours deduct 5% from the next final Ore payout. */
  penaltyRejectedFlags: 3,
  penaltyWindowHours: 10,
  penaltyPercent: 5,
  /** Plan 22 section 1 and Plan 02 section 10: normal 1x to 20x with a 10x mean; Great Signal can reach 30x. */
  multiplierMin: 1,
  multiplierMean: 10,
  multiplierMax: 20,
  multiplierMaxGreat: 30,
  /** Plan 02 Part III: repeat ships need five new approved hours and new work. */
  repeatShipMinNewHours: 5,
} as const;

/**
 * Draft preview rules. The plans do not settle these, so they are labelled "Draft preview rule" wherever they show.
 * They live in one object so a real configuration can replace them in one place (Plan 22 section 3 asks for that).
 */

/**
 * Each row is one earlier ship's four category medians (originality, technical depth, execution, documentation).
 * Plan 22 leaves the percentile sampling window open, so the preview ranks a ship against this invented cohort.
 */
export const DRAFT_COHORT_ROWS: readonly (readonly [number, number, number, number])[] = [
  [2, 2, 3, 2],
  [3, 3, 4, 2],
  [4, 3, 3, 3],
  [4, 4, 5, 3],
  [5, 4, 4, 4],
  [5, 5, 5, 4],
  [5, 5, 6, 5],
  [6, 5, 5, 5],
  [6, 6, 6, 5],
  [6, 5, 7, 6],
  [6, 6, 6, 6],
  [7, 6, 6, 6],
  [7, 7, 6, 6],
  [6, 7, 7, 7],
  [7, 7, 7, 6],
  [7, 8, 7, 7],
  [8, 7, 7, 7],
  [7, 7, 8, 8],
  [8, 8, 7, 7],
  [8, 8, 8, 7],
  [8, 8, 8, 8],
  [9, 8, 8, 7],
  [9, 9, 8, 8],
  [9, 9, 9, 8],
];

export const COHORT_CATEGORY_ORDER: readonly Category[] = ["originality", "technicalDepth", "execution", "documentation"];

export const DRAFT = {
  /** Identifies the curve in a snapshot (Plan 22 section 3 wants curve versioning). */
  curveVersion: "loadout_preview_draft_v0",
  /**
   * multiplier = min + (max - min) * (percentile / 100) ^ exponent.
   * Stardance uses the same shape with its own exponent. This one is chosen so a uniform spread of percentiles
   * averages exactly the 10x mean: 1 + 19 / (exponent + 1) = 10, so exponent = 19 / 9 - 1.
   */
  curveExponent: 19 / 9 - 1,
  /** Decimals kept on the multiplier. Plan 02 section 11 leaves final rounding open. */
  multiplierDecimals: 2,
  /** Ore is rounded to a whole number. Plan 02 leaves exact rounding open. */
  rounding: "nearest whole Ore",
  /** Draft preview reward for a mission. Plan 11 sets no mission reward. */
  missionRewardOre: { beginner: 20, intermediate: 35, advanced: 60 },
} as const;

/** Where the draft cohort and curve are explained on screen. */
export const DRAFT_NOTE =
  "Draft preview rule: the plans set the 1x to 20x range and the 10x mean but not the exact curve, so the preview uses a documented draft curve.";
