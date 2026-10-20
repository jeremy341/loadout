import { describe, expect, test } from "bun:test";
import { paginate, pinnedRow, podium, rankByValue, sortRanked } from "./ranking";

interface Row {
  name: string;
  track: string;
  v: number;
  you?: boolean;
}
const row = (name: string, v: number, track = "Tools", you = false): Row => ({ name, track, v, you });

describe("competition ranking", () => {
  test("ties share a rank and the next rank skips", () => {
    const ranked = rankByValue([row("a", 5), row("b", 9), row("c", 9), row("d", 9), row("e", 1), row("f", 5)], (r) => r.v);
    expect(ranked.map((r) => [r.row.name, r.rank])).toEqual([
      ["b", 1],
      ["c", 1],
      ["d", 1],
      ["a", 4],
      ["f", 4],
      ["e", 6],
    ]);
  });

  test("is stable: equal values keep input order", () => {
    const ranked = rankByValue([row("z", 3), row("y", 3), row("x", 3)], (r) => r.v);
    expect(ranked.map((r) => r.row.name)).toEqual(["z", "y", "x"]);
    expect(ranked.every((r) => r.rank === 1)).toBe(true);
  });

  test("handles empty input and a single row", () => {
    expect(rankByValue([], (r: Row) => r.v)).toEqual([]);
    expect(rankByValue([row("a", 2)], (r) => r.v)[0].rank).toBe(1);
  });

  test("does not mutate the input", () => {
    const input = [row("a", 1), row("b", 2)];
    rankByValue(input, (r) => r.v);
    expect(input.map((r) => r.name)).toEqual(["a", "b"]);
  });
});

describe("sorting for the table", () => {
  const ranked = rankByValue([row("Cy", 5, "Systems"), row("Al", 9, "Tools"), row("Bo", 5, "Compute")], (r) => r.v);

  test("rank ascending and descending keep ranks unchanged", () => {
    expect(sortRanked(ranked, "rank", "asc").map((r) => r.row.name)).toEqual(["Al", "Cy", "Bo"]);
    const desc = sortRanked(ranked, "rank", "desc");
    expect(desc.map((r) => r.row.name)).toEqual(["Cy", "Bo", "Al"]);
    expect(desc.map((r) => r.rank)).toEqual([2, 2, 1]);
  });

  test("by name and track", () => {
    expect(sortRanked(ranked, "name", "asc").map((r) => r.row.name)).toEqual(["Al", "Bo", "Cy"]);
    expect(sortRanked(ranked, "track", "asc").map((r) => r.row.track)).toEqual(["Compute", "Systems", "Tools"]);
    expect(sortRanked(ranked, "name", "desc").map((r) => r.row.name)).toEqual(["Cy", "Bo", "Al"]);
  });

  test("by value, ties keep their order", () => {
    expect(sortRanked(ranked, "value", "asc").map((r) => r.row.name)).toEqual(["Cy", "Bo", "Al"]);
    expect(sortRanked(ranked, "value", "desc").map((r) => r.row.name)).toEqual(["Al", "Cy", "Bo"]);
  });
});

describe("paging", () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);

  test("10 per page", () => {
    const p1 = paginate(items, 1, 10);
    expect(p1).toMatchObject({ page: 1, pageCount: 3, total: 23, from: 1, to: 10 });
    expect(p1.items).toHaveLength(10);
    const p3 = paginate(items, 3, 10);
    expect(p3.items).toEqual([21, 22, 23]);
    expect(p3).toMatchObject({ from: 21, to: 23 });
  });

  test("clamps out-of-range and bad pages", () => {
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate(items, Number.NaN, 10).page).toBe(1);
  });

  test("empty", () => {
    expect(paginate([], 1, 10)).toMatchObject({ items: [], page: 1, pageCount: 1, total: 0, from: 0, to: 0 });
  });
});

describe("pinned row and podium", () => {
  const ranked = rankByValue(
    Array.from({ length: 15 }, (_, i) => row(`r${i}`, 100 - i, "Tools", i === 12)),
    (r) => r.v,
  );

  test("pins you when you are off the visible page", () => {
    const page1 = paginate(ranked, 1, 10).items;
    expect(pinnedRow(ranked, page1, (r) => r.you === true)?.row.name).toBe("r12");
    const page2 = paginate(ranked, 2, 10).items;
    expect(pinnedRow(ranked, page2, (r) => r.you === true)).toBeNull();
  });

  test("nothing to pin when you are not on the board", () => {
    expect(pinnedRow(ranked, ranked, () => false)).toBeNull();
  });

  test("podium is the top three, ties included in rank order", () => {
    expect(podium(ranked).map((r) => r.rank)).toEqual([1, 2, 3]);
    const tied = rankByValue([row("a", 9), row("b", 9), row("c", 9), row("d", 9)], (r) => r.v);
    expect(podium(tied)).toHaveLength(3);
    const tail = rankByValue([row("a", 9), row("b", 8), row("c", 8), row("d", 8)], (r) => r.v);
    expect(podium(tail).map((r) => r.rank)).toEqual([1, 2, 2]);
  });
});
