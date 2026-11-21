import { describe, expect, test } from "bun:test";
import {
  discountForHours,
  depthMetres,
  formatDepth,
  formatDiscount,
  hoursForLevel,
  hoursToNextLevel,
  LEVEL_CAP,
  LEVEL_HOURS,
  levelCells,
  levelForHours,
  oreBalance,
  projectHours,
  sampleTrackHours,
  sampleTrackProgress,
  sumHours,
  trackProgress,
  trackStatus,
  TRACKS,
} from "./progress";

describe("track progress", () => {
  test("every track starts at level zero and shows Not started", () => {
    const rows = trackProgress();
    expect(rows.map((row) => row.track)).toEqual([...TRACKS]);
    for (const row of rows) {
      expect(row.level).toBe(0);
      expect(trackStatus(row.level)).toBe("Not started");
    }
  });

  test("Ore is zero until approved hours exist", () => {
    expect(oreBalance()).toBe(0);
  });
});

describe("depth", () => {
  test("one metre is one approved hour", () => {
    expect(formatDepth(0)).toBe("0 M");
    expect(formatDepth(1)).toBe("1 M");
    expect(formatDepth(222)).toBe("222 M");
  });

  test("part hours do not round up and negative hours stay at the surface", () => {
    expect(formatDepth(7.9)).toBe("7 M");
    expect(formatDepth(0.5)).toBe("0 M");
    expect(formatDepth(-3)).toBe("0 M");
  });

  test("depth is never negative and equals the approved hours of the builder", () => {
    for (const hours of [-74, -0.5, 0, 0.9, 74, Number.NaN, -Infinity]) {
      expect(depthMetres(hours)).toBeGreaterThanOrEqual(0);
      expect(formatDepth(hours).startsWith("-")).toBe(false);
    }
    const total = sumHours([{ approved: 58, pending: 6 }, { approved: 14, pending: 0 }, { approved: 0, pending: 0 }, { approved: 2, pending: 0 }]);
    expect(depthMetres(total.approved)).toBe(74);
    expect(formatDepth(total.approved)).toBe("74 M");
  });

  test("hours are zero until they are recorded, and they add up per account", () => {
    expect(projectHours("any")).toEqual({ approved: 0, pending: 0 });
    expect(sumHours([{ approved: 8, pending: 2 }, { approved: 16, pending: 0 }])).toEqual({ approved: 24, pending: 2 });
    expect(sumHours([])).toEqual({ approved: 0, pending: 0 });
  });
});

describe("level hours", () => {
  test("the set levels sit at 23, 58, 104, 178 and 275 hours (rescaled 14 Nov 2026, LV.20 at 275)", () => {
    expect(LEVEL_HOURS[4]).toBe(23);
    expect(LEVEL_HOURS[7]).toBe(58);
    expect(LEVEL_HOURS[10]).toBe(104);
    expect(LEVEL_HOURS[14]).toBe(178);
    expect(LEVEL_HOURS[19]).toBe(275);
    expect(LEVEL_HOURS).toHaveLength(LEVEL_CAP);
    expect(LEVEL_CAP).toBe(20);
  });

  test("hours rise with every level", () => {
    for (let index = 1; index < LEVEL_HOURS.length; index++) {
      expect(LEVEL_HOURS[index]).toBeGreaterThan(LEVEL_HOURS[index - 1]);
    }
  });

  test("a level is reached exactly at its hours", () => {
    expect(levelForHours(0)).toBe(0);
    expect(levelForHours(0.9)).toBe(0);
    expect(levelForHours(1)).toBe(1);
    expect(levelForHours(57)).toBe(7);
    expect(levelForHours(58)).toBe(8);
    expect(levelForHours(500)).toBe(LEVEL_CAP);
  });

  test("the hours missing for the next level, and none at the top", () => {
    expect(hoursToNextLevel(58)).toBe(14);
    expect(hoursToNextLevel(0)).toBe(1);
    expect(hoursToNextLevel(178)).toBe(19);
    expect(hoursToNextLevel(275)).toBeNull();
  });

  test("hoursForLevel starts at zero for LV.0", () => {
    expect(hoursForLevel(0)).toBe(0);
    expect(hoursForLevel(6)).toBe(34);
    expect(hoursForLevel(15)).toBe(178);
    expect(hoursForLevel(20)).toBe(275);
  });

  test("the sample hours give the levels the Overview shows", () => {
    expect(sampleTrackProgress().map((row) => row.level)).toEqual([8, 3, 0, 1]);
    expect(hoursToNextLevel(sampleTrackHours("Tools").approved)).toBe(14);
    expect(hoursToNextLevel(sampleTrackHours("Systems").approved)).toBe(2);
  });
});

describe("level discount", () => {
  test("it is nothing at the start, 15% at LV.15's hours, 20% at LV.20's, and stops there", () => {
    expect(discountForHours(0)).toBe(0);
    expect(discountForHours(178)).toBe(15);
    expect(discountForHours(275)).toBe(20);
    expect(discountForHours(500)).toBe(20);
    expect(discountForHours(-4)).toBe(0);
  });

  test("between LV.15 and LV.20 it rises in a straight line", () => {
    expect(discountForHours(226.5)).toBeCloseTo(17.5, 5);
    expect(discountForHours(197)).toBeCloseTo(15 + (19 / 97) * 5, 5);
  });

  test("it rises with every approved hour", () => {
    expect(discountForHours(58)).toBeGreaterThan(discountForHours(57));
    expect(discountForHours(89)).toBeCloseTo(7.5, 5);
  });

  test("it is shown to one decimal and rounded down", () => {
    expect(formatDiscount(discountForHours(0))).toBe("0%");
    expect(formatDiscount(discountForHours(2))).toBe("0.1%");
    expect(formatDiscount(discountForHours(58))).toBe("4.8%");
    expect(formatDiscount(discountForHours(55))).toBe("4.6%");
    expect(formatDiscount(discountForHours(178))).toBe("15%");
  });

  test("the levels' discounts never pass 20% and rise level by level", () => {
    const shown = LEVEL_HOURS.map((hours) => discountForHours(hours));
    expect(Math.max(...shown)).toBe(20);
    for (let index = 1; index < shown.length; index++) expect(shown[index]).toBeGreaterThan(shown[index - 1]);
  });
});

describe("level cells", () => {
  test("there is one cell per level", () => {
    expect(levelCells(0)).toHaveLength(LEVEL_CAP);
  });

  test("cells up to the level are filled and the rest are empty", () => {
    const cells = levelCells(4);
    expect(cells.slice(0, 4).every(Boolean)).toBe(true);
    expect(cells.slice(4).some(Boolean)).toBe(false);
  });

  test("levels outside the range are clamped", () => {
    expect(levelCells(-3).some(Boolean)).toBe(false);
    expect(levelCells(99).every(Boolean)).toBe(true);
  });

  test("the status names the level out of the cap", () => {
    expect(trackStatus(9)).toBe("LV.9 of 20");
  });
});
