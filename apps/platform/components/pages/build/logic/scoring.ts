import { COHORT_CATEGORY_ORDER, DRAFT, DRAFT_COHORT_ROWS, RULES } from "./constants";
import type { Category, ReceivedReview, Scores, Snapshot } from "./types";

// Peer-review aggregation. Rules are from plans/22-peer-review-and-multipliers.md sections 1 to 3 and
// plans/02-economy-and-rewards.md sections 9 to 11. Anything the plans leave open is marked "Draft preview rule".

export const CATEGORIES: { key: Category; label: string; question: string }[] = [
  { key: "originality", label: "Originality", question: "Is the idea, implementation or approach meaningfully interesting?" },
  { key: "technicalDepth", label: "Technical Depth", question: "How much real technical challenge and capability-building work is present?" },
  { key: "execution", label: "Execution", question: "How successfully did the builder realise the capability they attempted?" },
  { key: "documentation", label: "Documentation", question: "How well can another builder understand, verify, reproduce or use the work?" },
];

/** Anchors from Plan 02 section 10. The plans publish only the 1, 5 and 9 anchors. */
export const SCORE_ANCHORS: Record<number, string> = {
  1: "Very weak evidence against the category",
  5: "Meets the middle of the category's published anchors",
  9: "Exceptional evidence against the category",
};

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** A word is a whitespace-separated token that holds at least one letter or number. */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

export function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= RULES.scoreMin && value <= RULES.scoreMax;
}

export interface ReviewInputCheck {
  ok: boolean;
  /** One message per category that is missing or out of range. */
  scoreErrors: Partial<Record<Category, string>>;
  reasonError: string | null;
  words: number;
}

/** Validates a peer review before it is submitted: four scores of 1 to 9 and a reason of at least ten words. */
export function validateReviewInput(scores: Partial<Record<Category, number>>, reason: string): ReviewInputCheck {
  const scoreErrors: Partial<Record<Category, string>> = {};
  for (const { key, label } of CATEGORIES) {
    if (!isValidScore(scores[key])) scoreErrors[key] = `Choose a ${label} score from ${RULES.scoreMin} to ${RULES.scoreMax}.`;
  }
  const words = countWords(reason);
  const reasonError =
    words >= RULES.minReasonWords
      ? null
      : `Write at least ${RULES.minReasonWords} words explaining your scores. You have ${words}.`;
  return { ok: Object.keys(scoreErrors).length === 0 && reasonError === null, scoreErrors, reasonError, words };
}

/** Countable reviews in creation order (then id), as Plan 22 section 3 step 1 orders them. */
export function countableReviews(reviews: readonly ReceivedReview[]): ReceivedReview[] {
  return reviews
    .filter((review) => !review.discarded)
    .sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** The first 12 countable reviews, which are the ones a snapshot keeps. */
export function snapshotReviews(reviews: readonly ReceivedReview[], limit: number = RULES.reviewsPerShip): ReceivedReview[] {
  return countableReviews(reviews).slice(0, limit);
}

export function categoryMedians(reviews: readonly ReceivedReview[]): Scores | null {
  if (reviews.length === 0) return null;
  const out = {} as Scores;
  for (const { key } of CATEGORIES) {
    out[key] = median(reviews.map((review) => review.scores[key])) ?? 0;
  }
  return out;
}

/** Mean of the four category medians (Plan 22 section 3 step 3). */
export function meanOfMedians(medians: Scores): number {
  return mean(CATEGORIES.map(({ key }) => medians[key])) ?? 0;
}

/**
 * Midrank percentile, as Plan 22 section 3 step 4 describes: (below + 0.5 * equal) / n * 100.
 * `population` must include `value` itself. If every value is tied, the midpoint (50) is used.
 */
export function midrankPercentile(value: number, population: readonly number[]): number | null {
  if (population.length === 0) return null;
  const below = population.filter((v) => v < value).length;
  const equal = population.filter((v) => v === value).length;
  if (below === 0 && equal === population.length) return 50;
  return Math.round(((below + 0.5 * equal) / population.length) * 10000) / 100;
}

export interface Cohort {
  overall: number[];
  byCategory: Record<Category, number[]>;
}

/** Draft preview rule: the invented cohort a ship's score is ranked against. */
export function draftCohort(): Cohort {
  const byCategory = {} as Record<Category, number[]>;
  COHORT_CATEGORY_ORDER.forEach((category, index) => {
    byCategory[category] = DRAFT_COHORT_ROWS.map((row) => row[index]);
  });
  const overall = DRAFT_COHORT_ROWS.map((row) => row.reduce((sum, v) => sum + v, 0) / row.length);
  return { overall, byCategory };
}

/**
 * Draft preview rule (see constants.ts): percentile to hourly multiplier.
 * Plan 22 and Plan 02 fix the range (1x to 20x, 30x with a Great Signal claim) and the 10x mean, not the curve.
 */
export function percentileToMultiplier(percentile: number, great = false): number {
  const low = RULES.multiplierMin;
  const high = great ? RULES.multiplierMaxGreat : RULES.multiplierMax;
  const p = Math.min(1, Math.max(0, percentile / 100));
  const raw = low + (high - low) * Math.pow(p, DRAFT.curveExponent);
  const f = Math.pow(10, DRAFT.multiplierDecimals);
  return Math.round(raw * f) / f;
}

/** Ore = approved hours x multiplier (Plan 02 section 11), rounded to a whole Ore (rounding is a Draft preview rule). */
export function oreFor(hours: number, multiplier: number): number {
  return Math.round(hours * multiplier);
}

export interface ScoreBreakdown {
  /** Reviews used (the first 12 countable, or fewer while the ship is still collecting). */
  used: ReceivedReview[];
  complete: boolean;
  medians: Scores | null;
  overall: number | null;
  categoryPercentiles: Scores | null;
  overallPercentile: number | null;
  multiplier: number | null;
}

/** Every step of the worked calculation, usable with fewer than 12 reviews (then `complete` is false). */
export function scoreBreakdown(reviews: readonly ReceivedReview[], great = false, cohort: Cohort = draftCohort()): ScoreBreakdown {
  const used = snapshotReviews(reviews);
  const medians = categoryMedians(used);
  if (!medians) {
    return { used, complete: false, medians: null, overall: null, categoryPercentiles: null, overallPercentile: null, multiplier: null };
  }
  const overall = meanOfMedians(medians);
  const categoryPercentiles = {} as Scores;
  for (const { key } of CATEGORIES) {
    categoryPercentiles[key] = midrankPercentile(medians[key], [...cohort.byCategory[key], medians[key]]) ?? 50;
  }
  const overallPercentile = midrankPercentile(overall, [...cohort.overall, overall]) ?? 50;
  return {
    used,
    complete: used.length >= RULES.reviewsPerShip,
    medians,
    overall,
    categoryPercentiles,
    overallPercentile,
    multiplier: percentileToMultiplier(overallPercentile, great),
  };
}

/** Takes the locked award snapshot (Plan 22 section 2). Returns null until 12 countable reviews exist. */
export function buildSnapshot(input: {
  id: string;
  reviews: readonly ReceivedReview[];
  hours: number;
  great: boolean;
  lockedAt: number;
  cohort?: Cohort;
}): Snapshot | null {
  const breakdown = scoreBreakdown(input.reviews, input.great, input.cohort);
  if (!breakdown.complete || !breakdown.medians || breakdown.overall === null) return null;
  return {
    id: input.id,
    lockedAt: input.lockedAt,
    windowEndsAt: input.lockedAt + RULES.flagWindowHours * 3_600_000,
    reviewIds: breakdown.used.map((review) => review.id),
    medians: breakdown.medians,
    overall: breakdown.overall,
    categoryPercentiles: breakdown.categoryPercentiles as Scores,
    overallPercentile: breakdown.overallPercentile as number,
    multiplier: breakdown.multiplier as number,
    hours: input.hours,
    great: input.great,
    curveVersion: DRAFT.curveVersion,
  };
}
