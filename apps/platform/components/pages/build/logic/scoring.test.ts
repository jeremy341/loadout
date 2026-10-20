import { describe, expect, test } from "bun:test";
import { DRAFT } from "./constants";
import {
  buildSnapshot,
  categoryMedians,
  countableReviews,
  countWords,
  draftCohort,
  mean,
  meanOfMedians,
  median,
  midrankPercentile,
  oreFor,
  percentileToMultiplier,
  scoreBreakdown,
  snapshotReviews,
  validateReviewInput,
} from "./scoring";
import type { ReceivedReview, Scores } from "./types";

function review(id: string, createdAt: number, o: number, t: number, e: number, d: number, discarded = false): ReceivedReview {
  return { id, createdAt, scores: { originality: o, technicalDepth: t, execution: e, documentation: d }, reason: "x", discarded };
}

function twelve(base = 6): ReceivedReview[] {
  return Array.from({ length: 12 }, (_, i) => review(`r${String(i).padStart(2, "0")}`, 1000 + i, base, base, base, base));
}

describe("median and mean", () => {
  test("median of odd, even and empty sets", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  test("median does not mutate its input", () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
  test("mean", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(mean([])).toBeNull();
  });
});

describe("written reason", () => {
  test("counts words, ignoring extra whitespace and bare punctuation", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords("one two  three\nfour")).toBe(4);
    expect(countWords("a - b ... c")).toBe(3);
  });
  test("nine words fail and ten words pass", () => {
    const nine = "one two three four five six seven eight nine";
    expect(validateReviewInput({ originality: 5, technicalDepth: 5, execution: 5, documentation: 5 }, nine).ok).toBe(false);
    expect(validateReviewInput({ originality: 5, technicalDepth: 5, execution: 5, documentation: 5 }, `${nine} ten`).ok).toBe(true);
  });
  test("reports each missing or out of range score", () => {
    const check = validateReviewInput({ originality: 0, technicalDepth: 10, execution: 4.5 }, "one two three four five six seven eight nine ten");
    expect(check.ok).toBe(false);
    expect(Object.keys(check.scoreErrors).sort()).toEqual(["documentation", "execution", "originality", "technicalDepth"]);
    expect(check.reasonError).toBeNull();
  });
  test("accepts every score from 1 to 9", () => {
    for (let s = 1; s <= 9; s += 1) {
      const scores: Scores = { originality: s, technicalDepth: s, execution: s, documentation: s };
      expect(validateReviewInput(scores, "one two three four five six seven eight nine ten").ok).toBe(true);
    }
  });
});

describe("countable reviews and the first twelve", () => {
  test("orders by creation time then id and drops discarded reviews", () => {
    const list = [review("b", 5, 1, 1, 1, 1), review("a", 5, 1, 1, 1, 1), review("c", 1, 1, 1, 1, 1), review("d", 9, 1, 1, 1, 1, true)];
    expect(countableReviews(list).map((r) => r.id)).toEqual(["c", "a", "b"]);
  });
  test("a snapshot keeps only the first twelve", () => {
    const list = [...twelve(), review("late", 99999, 9, 9, 9, 9)];
    expect(snapshotReviews(list)).toHaveLength(12);
    expect(snapshotReviews(list).some((r) => r.id === "late")).toBe(false);
  });
});

describe("category medians then mean of medians", () => {
  test("a single extreme rating does not move the median", () => {
    const list = twelve(6);
    list[0] = review("r00", 1000, 1, 1, 1, 1);
    list[1] = review("r01", 1001, 9, 9, 9, 9);
    expect(categoryMedians(list)).toEqual({ originality: 6, technicalDepth: 6, execution: 6, documentation: 6 });
  });
  test("each category has its own median and the overall score is their mean", () => {
    const list = [review("a", 1, 2, 9, 5, 1), review("b", 2, 4, 7, 5, 3), review("c", 3, 6, 5, 5, 5)];
    const medians = categoryMedians(list) as Scores;
    expect(medians).toEqual({ originality: 4, technicalDepth: 7, execution: 5, documentation: 3 });
    expect(meanOfMedians(medians)).toBe(4.75);
  });
  test("scores are not trimmed as outliers", () => {
    const list = [review("a", 1, 1, 1, 1, 1), review("b", 2, 1, 1, 1, 1), review("c", 3, 9, 9, 9, 9), review("d", 4, 9, 9, 9, 9)];
    expect((categoryMedians(list) as Scores).originality).toBe(5);
  });
  test("no reviews gives no medians", () => {
    expect(categoryMedians([])).toBeNull();
  });
});

describe("midrank percentile", () => {
  test("below plus half of ties, as a percentage", () => {
    expect(midrankPercentile(3, [1, 2, 3, 4])).toBe(62.5);
    expect(midrankPercentile(2.5, [1, 2, 2.5, 3, 4])).toBe(50);
    expect(midrankPercentile(4, [1, 2, 3, 4])).toBe(87.5);
    expect(midrankPercentile(1, [1, 2, 3, 4])).toBe(12.5);
  });
  test("all values tied gives the midpoint", () => {
    expect(midrankPercentile(5, [5, 5, 5])).toBe(50);
    expect(midrankPercentile(5, [5])).toBe(50);
  });
  test("empty population gives null", () => {
    expect(midrankPercentile(5, [])).toBeNull();
  });
});

describe("draft percentile curve", () => {
  test("covers exactly 1x to 20x, and 1x to 30x with a Great claim", () => {
    expect(percentileToMultiplier(0)).toBe(1);
    expect(percentileToMultiplier(100)).toBe(20);
    expect(percentileToMultiplier(0, true)).toBe(1);
    expect(percentileToMultiplier(100, true)).toBe(30);
  });
  test("a uniform spread of percentiles averages the 10x mean", () => {
    let sum = 0;
    const n = 10000;
    for (let i = 0; i < n; i += 1) sum += 1 + 19 * Math.pow((i + 0.5) / n, DRAFT.curveExponent);
    expect(sum / n).toBeCloseTo(10, 2);
  });
  test("is monotonic and clamps out of range input", () => {
    let last = 0;
    for (let p = 0; p <= 100; p += 5) {
      const m = percentileToMultiplier(p);
      expect(m).toBeGreaterThanOrEqual(last);
      last = m;
    }
    expect(percentileToMultiplier(-20)).toBe(1);
    expect(percentileToMultiplier(250)).toBe(20);
  });
  test("a Great claim raises the ceiling but is never below the normal rate", () => {
    for (let p = 0; p <= 100; p += 10) {
      expect(percentileToMultiplier(p, true)).toBeGreaterThanOrEqual(percentileToMultiplier(p, false));
    }
  });
  test("Ore is hours times the multiplier, rounded to whole Ore", () => {
    expect(oreFor(20, 10)).toBe(200);
    expect(oreFor(7.5, 3.33)).toBe(25);
  });
});

describe("score breakdown and snapshot", () => {
  test("fewer than twelve reviews is provisional and takes no snapshot", () => {
    const list = twelve().slice(0, 5);
    const breakdown = scoreBreakdown(list);
    expect(breakdown.complete).toBe(false);
    expect(breakdown.multiplier).not.toBeNull();
    expect(buildSnapshot({ id: "s1", reviews: list, hours: 10, great: false, lockedAt: 0 })).toBeNull();
  });
  test("twelve countable reviews lock a snapshot with the window end 24 hours later", () => {
    const snapshot = buildSnapshot({ id: "s1", reviews: twelve(8), hours: 10, great: false, lockedAt: 1_000_000 });
    expect(snapshot).not.toBeNull();
    expect(snapshot?.reviewIds).toHaveLength(12);
    expect(snapshot?.windowEndsAt).toBe(1_000_000 + 24 * 3_600_000);
    expect(snapshot?.overall).toBe(8);
    expect(snapshot?.curveVersion).toBe(DRAFT.curveVersion);
  });
  test("a higher overall score never earns a lower multiplier", () => {
    const low = buildSnapshot({ id: "s1", reviews: twelve(3), hours: 10, great: false, lockedAt: 0 });
    const high = buildSnapshot({ id: "s1", reviews: twelve(9), hours: 10, great: false, lockedAt: 0 });
    expect(high?.multiplier ?? 0).toBeGreaterThan(low?.multiplier ?? 99);
  });
  test("the cohort holds one row per sample ship in every category", () => {
    const cohort = draftCohort();
    expect(cohort.overall.length).toBe(cohort.byCategory.originality.length);
    expect(cohort.byCategory.documentation.every((v) => v >= 1 && v <= 9)).toBe(true);
  });
});
