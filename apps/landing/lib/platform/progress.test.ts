import { describe, expect, test } from "bun:test";
import { LEVEL_CAP, levelCells, oreBalance, trackProgress, trackStatus, TRACKS } from "./progress";

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
    expect(trackStatus(9)).toBe("LV.9 of 15");
  });
});
