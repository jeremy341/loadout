import { describe, expect, test } from "bun:test";
import { pagesPerCycle, SPARK_MAX, SPARKS, SPARKS_PER_PAGE, sparkGroup, sparkOrder, sparkPage, sparkText } from "./sparks";

describe("the spark pools", () => {
  test("each group has 12 to 20 lines", () => {
    for (const pool of Object.values(SPARKS)) {
      expect(pool.length).toBeGreaterThanOrEqual(12);
      expect(pool.length).toBeLessThanOrEqual(20);
    }
  });

  test("no line is over the length cap, empty or repeated", () => {
    for (const pool of Object.values(SPARKS)) {
      for (const line of pool) {
        expect(line.length).toBeGreaterThan(0);
        expect(line.length).toBeLessThanOrEqual(SPARK_MAX);
      }
      expect(new Set(pool).size).toBe(pool.length);
    }
  });

  test("nothing in the pools invites a game, a portfolio or a website", () => {
    for (const line of [...SPARKS.software, ...SPARKS.hardware]) expect(line).not.toMatch(/portfolio|website|blog|social/i);
  });

  test("hardware gets the hardware pool and every other track the software pool", () => {
    expect(sparkGroup("Hardware")).toBe("hardware");
    for (const track of ["Tools", "Systems", "Compute", null, undefined]) expect(sparkGroup(track)).toBe("software");
  });
});

describe("sparkPage", () => {
  test("a page has three lines", () => {
    expect(sparkPage(SPARKS.software, 0)).toHaveLength(SPARKS_PER_PAGE);
  });

  test("the first page is the written order", () => {
    expect(sparkPage(SPARKS.software, 0)).toEqual(SPARKS.software.slice(0, 3));
  });

  test("no line repeats within one cycle, and a cycle covers the whole pool", () => {
    for (const pool of Object.values(SPARKS)) {
      for (const cycle of [0, 1, 2, 5]) {
        const pages = pagesPerCycle(pool);
        const seen: string[] = [];
        for (let index = 0; index < pages; index += 1) seen.push(...sparkPage(pool, cycle * pages + index));
        expect(seen).toHaveLength(pool.length);
        expect(new Set(seen).size).toBe(pool.length);
      }
    }
  });

  test("a pool that does not divide by three never repeats a line inside a cycle except by topping up the last page", () => {
    const pool = SPARKS.software.slice(0, 10);
    const pages = pagesPerCycle(pool);
    expect(pages).toBe(4);
    const seen: string[] = [];
    for (let index = 0; index < pages - 1; index += 1) seen.push(...sparkPage(pool, index));
    expect(new Set(seen).size).toBe(9);
    expect(sparkPage(pool, pages - 1)).toHaveLength(3);
  });

  test("the same page always gives the same lines", () => {
    expect(sparkPage(SPARKS.hardware, 7)).toEqual(sparkPage(SPARKS.hardware, 7));
  });

  test("a later cycle is a different order of the same lines", () => {
    const first = sparkOrder(SPARKS.software, 0);
    const second = sparkOrder(SPARKS.software, 1);
    expect(second).not.toEqual(first);
    expect([...second].sort()).toEqual([...first].sort());
  });

  test("an empty pool and a bad page number are safe", () => {
    expect(sparkPage([], 3)).toEqual([]);
    expect(sparkPage(SPARKS.software, -4)).toEqual(SPARKS.software.slice(0, 3));
  });
});

describe("sparkText", () => {
  test("starts with a capital and keeps the rest", () => {
    expect(sparkText("a linter for one annoying mistake")).toBe("A linter for one annoying mistake");
  });
});
