import { describe, expect, test } from "bun:test";
import { ANIMS, ATLAS_COLS, ATLAS_ROWS } from "./frames";

const SHEETS = "ABCDEGHIJKLM";
const index = (label: string) => SHEETS.indexOf(label[0] as string) * 16 + Number(label.slice(1)) - 1;
const used = new Set(Object.values(ANIMS).flatMap((anim) => anim.frames));

describe("the sprite atlas", () => {
  test("every animation points at a cell inside the atlas", () => {
    for (const [name, anim] of Object.entries(ANIMS)) {
      expect(anim.frames.length, name).toBeGreaterThan(0);
      for (const frame of anim.frames) {
        expect(frame, name).toBeGreaterThanOrEqual(0);
        expect(frame, name).toBeLessThan(ATLAS_COLS * ATLAS_ROWS);
      }
    }
  });

  test("the frames that were drawn but unused are now part of a reaction (the walk cycles A, J and H1 to H8 stay out)", () => {
    const wired = "B3 B4 B10 B11 B12 B13 B14 B16 D11 D12 D15 E14 G5 G6 G7 G8 G11 G12 I7 I8 I10 I11 I12 I13 I14 I15 I16 K13 L6 L7 A9 A10 A11 A12".split(" ");
    for (const label of wired) expect(used.has(index(label)), label).toBe(true);
    // the old walk cycles and the faces the owner removed stay out
    for (const label of ["A1", "A8", "J1", "J8", "H1", "H8", "K11", "E8", "E9", "M9", "M16", "D13", "D14", "E1", "K16"]) expect(used.has(index(label)), label).toBe(false);
  });

  test("the get-up starts with the stand-up pose, and the scurry is the leaning-forward run", () => {
    expect(ANIMS.getUp.frames).toEqual([index("D15"), index("M13"), index("M14"), index("M15")]);
    expect(ANIMS.scurry.frames).toEqual([index("A9"), index("A10"), index("A11"), index("A12")]);
  });

  test("the sequences that use the new frames name them", () => {
    expect(ANIMS.turnedAway.frames).toEqual([index("E14")]);
    expect(ANIMS.splat.frames).toEqual([index("D12")]);
    expect(ANIMS.yelp.frames).toEqual([index("D11")]);
    expect(ANIMS.cheer.frames).toEqual([index("G12"), index("I7"), index("I10"), index("I11")]);
  });
});
