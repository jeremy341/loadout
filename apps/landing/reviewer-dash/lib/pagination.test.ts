import { describe, expect, test } from "bun:test";
import { pageWindow } from "./pagination";

describe("pageWindow", () => {
  test("one page", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  test("few pages show every number", () => {
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  test("first page of many keeps the last page reachable", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, "gap", 20]);
  });

  test("middle page gets a gap on both sides", () => {
    expect(pageWindow(10, 20)).toEqual([1, "gap", 8, 9, 10, 11, 12, "gap", 20]);
  });

  test("last page of many", () => {
    expect(pageWindow(20, 20)).toEqual([1, "gap", 18, 19, 20]);
  });

  test("a single skipped page is shown instead of a gap", () => {
    expect(pageWindow(5, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test("an out of range page is clamped", () => {
    expect(pageWindow(99, 4)).toEqual([1, 2, 3, 4]);
  });
});
