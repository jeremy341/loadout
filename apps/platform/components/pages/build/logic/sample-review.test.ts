import { describe, expect, test } from "bun:test";
import { SAMPLE_REASONS, sampleReview, seededRandom } from "./sample-review";
import { validateReviewInput } from "./scoring";

describe("sample reviews", () => {
  test("every sample reason meets the ten word minimum", () => {
    for (const reason of SAMPLE_REASONS) {
      expect(validateReviewInput({ originality: 5, technicalDepth: 5, execution: 5, documentation: 5 }, reason).reasonError).toBeNull();
    }
  });
  test("the same seed gives the same review", () => {
    const a = sampleReview({ shipId: "s", index: 3, base: 6, createdAt: 1 });
    const b = sampleReview({ shipId: "s", index: 3, base: 6, createdAt: 1 });
    expect(a).toEqual(b);
  });
  test("scores stay within 1 to 9 at the extremes", () => {
    for (let i = 0; i < 50; i += 1) {
      for (const base of [1, 9]) {
        const review = sampleReview({ shipId: "s", index: i, base, createdAt: 1 });
        for (const value of Object.values(review.scores)) {
          expect(value).toBeGreaterThanOrEqual(1);
          expect(value).toBeLessThanOrEqual(9);
        }
      }
    }
  });
  test("a sample review carries no reviewer identity", () => {
    const review = sampleReview({ shipId: "s", index: 0, base: 5, createdAt: 1 });
    expect(Object.keys(review).sort()).toEqual(["createdAt", "id", "reason", "scores"]);
  });
  test("ids differ by index", () => {
    expect(sampleReview({ shipId: "s", index: 0, base: 5, createdAt: 1 }).id).not.toBe(sampleReview({ shipId: "s", index: 1, base: 5, createdAt: 1 }).id);
  });
  test("the generator is deterministic and in range", () => {
    const rand = seededRandom("x");
    const again = seededRandom("x");
    for (let i = 0; i < 20; i += 1) {
      const value = rand();
      expect(value).toBe(again());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
