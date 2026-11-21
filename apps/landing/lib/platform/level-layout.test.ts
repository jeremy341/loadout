import { describe, expect, test } from "bun:test";
import { boxesOverlap, captionBoxes, levelRows, REWARD_MIN_ITEM, rewardTrackCount } from "./level-layout";
import { LEVEL_CAP, LEVEL_HOURS, LEVEL_REWARDS } from "./progress";

const REWARD_COUNT = Object.keys(LEVEL_REWARDS).length;

describe("rewardTrackCount", () => {
  test("matches the CSS grid: six across at the wide content width, two on a phone, never under one", () => {
    expect(rewardTrackCount(1030)).toBe(6);
    expect(rewardTrackCount(330)).toBe(2);
    expect(rewardTrackCount(100)).toBe(1);
    expect(rewardTrackCount(0)).toBe(1);
  });
});

describe("captionBoxes", () => {
  test("no two coupon captions overlap and every one lies inside the strip, at every width from 200 to 2000", () => {
    for (let width = 200; width <= 2000; width += 5) {
      const boxes = captionBoxes(REWARD_COUNT, width);
      expect(boxes).toHaveLength(REWARD_COUNT);
      for (let a = 0; a < boxes.length; a += 1) {
        expect(boxes[a].x).toBeGreaterThanOrEqual(0);
        expect(boxes[a].x + boxes[a].width).toBeLessThanOrEqual(width + 0.001);
        for (let b = a + 1; b < boxes.length; b += 1) expect(boxesOverlap(boxes[a], boxes[b])).toBe(false);
      }
    }
  });
  test("a caption is never narrower than the minimum item width, except in a strip narrower than one item", () => {
    for (let width = REWARD_MIN_ITEM; width <= 2000; width += 7) {
      for (const box of captionBoxes(REWARD_COUNT, width)) expect(box.width).toBeGreaterThanOrEqual(REWARD_MIN_ITEM - 0.001);
    }
  });
  test("the old placement fails the same rule: LV.18 and LV.20 under their cells at 1440 collided", () => {
    // 20 cells, 4px gaps, about 990px of strip: one cell is 50.5px. Captions 90 and 150px wide, placed at the cell column.
    const cell = (990 - 19 * 4) / 20 + 4;
    const lv18: { x: number; width: number; row: number } = { x: 17 * cell, width: 90, row: 0 };
    const lv20: { x: number; width: number; row: number } = { x: 990 - 150, width: 150, row: 0 };
    expect(boxesOverlap(lv18, lv20)).toBe(true);
  });
});

describe("levelRows", () => {
  test("one row of twenty from 720px, two rows of ten below", () => {
    expect(levelRows(720)).toBe(1);
    expect(levelRows(719)).toBe(2);
    expect(levelRows(390)).toBe(2);
    expect(levelRows(1440)).toBe(1);
  });
});

describe("LEVEL_REWARDS", () => {
  test("six coupon levels, each a real level, each a short caption", () => {
    expect(Object.keys(LEVEL_REWARDS).map(Number)).toEqual([5, 8, 11, 15, 18, 20]);
    for (const [key, caption] of Object.entries(LEVEL_REWARDS)) {
      expect(Number(key)).toBeGreaterThanOrEqual(1);
      expect(Number(key)).toBeLessThanOrEqual(LEVEL_CAP);
      expect(LEVEL_HOURS[Number(key) - 1]).toBeGreaterThan(0);
      expect(caption.length).toBeLessThanOrEqual(12);
    }
    expect(LEVEL_REWARDS[20]).toBe("10% coupon");
  });
});
