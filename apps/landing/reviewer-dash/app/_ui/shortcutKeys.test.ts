import { describe, expect, test } from "bun:test";
import { CHORD_MS, hasModifier, isLiveChord, reachableRows, resolveKey } from "./shortcutKeys";

const hrefs = new Set(["/", "/review"]);

describe("resolveKey", () => {
  test("single keys", () => {
    expect(resolveKey("/", false, false, hrefs)).toEqual({ type: "search" });
    expect(resolveKey("?", true, false, hrefs)).toEqual({ type: "help" });
    expect(resolveKey("g", false, false, hrefs)).toEqual({ type: "chord" });
    expect(resolveKey("G", true, false, hrefs)).toEqual({ type: "none" });
    expect(resolveKey("x", false, false, hrefs)).toEqual({ type: "none" });
  });
  test("a live chord goes to a reachable page, or is consumed", () => {
    expect(resolveKey("r", false, true, hrefs)).toEqual({ type: "go", href: "/review" });
    expect(resolveKey("R", false, true, hrefs)).toEqual({ type: "go", href: "/review" });
    expect(resolveKey("p", false, true, hrefs)).toEqual({ type: "none" });
    expect(resolveKey("/", false, true, hrefs)).toEqual({ type: "none" });
  });
});

describe("isLiveChord", () => {
  test("only a fresh g counts", () => {
    expect(isLiveChord(null, 0)).toBe(false);
    expect(isLiveChord({ key: "g", at: 100 }, 100 + CHORD_MS)).toBe(true);
    expect(isLiveChord({ key: "g", at: 100 }, 101 + CHORD_MS)).toBe(false);
    expect(isLiveChord({ key: "x", at: 100 }, 100)).toBe(false);
  });
});

test("hasModifier and reachableRows", () => {
  expect(hasModifier({ metaKey: false, ctrlKey: false, altKey: true })).toBe(true);
  expect(hasModifier({ metaKey: false, ctrlKey: false, altKey: false })).toBe(false);
  expect(reachableRows(hrefs).map(([k]) => k)).toEqual(["o", "r"]);
});
