import { describe, expect, test } from "bun:test";
import { ariaSortValue, boardCaption, defaultDir, nextSort, sortAnnouncement, windowText, yourLine } from "./leaderboard-text";

const fmt = (n: number) => String(n);
const win = { start: Date.UTC(2026, 9, 19), end: Date.UTC(2026, 9, 26) };

describe("sorting", () => {
  test("score starts descending, other columns ascending", () => {
    expect(defaultDir("value")).toBe("desc");
    expect(defaultDir("name")).toBe("asc");
  });

  test("nextSort flips the sorted column and resets on a new one", () => {
    expect(nextSort({ key: "rank", dir: "asc" }, "rank")).toEqual({ key: "rank", dir: "desc" });
    expect(nextSort({ key: "rank", dir: "desc" }, "rank")).toEqual({ key: "rank", dir: "asc" });
    expect(nextSort({ key: "rank", dir: "asc" }, "value")).toEqual({ key: "value", dir: "desc" });
  });

  test("announcement and aria-sort", () => {
    expect(sortAnnouncement("track", "desc")).toBe("Sorted by home track, descending.");
    expect(ariaSortValue({ key: "rank", dir: "asc" }, "rank")).toBe("ascending");
    expect(ariaSortValue({ key: "rank", dir: "asc" }, "name")).toBeUndefined();
  });
});

describe("windowText", () => {
  test("levels, all time and missing window", () => {
    expect(windowText({ usesPeriod: false, period: "all", win: null, seasonLabelText: "S0" })).toBe("Levels are lifetime and never reset.");
    expect(windowText({ usesPeriod: true, period: "all", win: null, seasonLabelText: "S0" })).toBe("All time since the preview began.");
    expect(windowText({ usesPeriod: true, period: "week", win: null, seasonLabelText: "S0" })).toBe("");
  });

  test("week and season prefixes", () => {
    expect(windowText({ usesPeriod: true, period: "week", win, seasonLabelText: "S0" })).toBe("Week 2026-W43, 19 Oct 2026 to 25 Oct 2026 (UTC).");
    expect(windowText({ usesPeriod: true, period: "season", win, seasonLabelText: "S0 // BOOT" })).toBe("S0 // BOOT, 19 Oct 2026 to 25 Oct 2026 (UTC).");
  });
});

describe("boardCaption", () => {
  test("names metric, scope, period and sort", () => {
    const sort = { key: "rank", dir: "asc" } as const;
    expect(boardCaption({ metricLabel: "Ore earned", scope: "all", usesPeriod: true, period: "season", sort })).toBe(
      "Ore earned, All tracks, This Season. Sorted by rank, ascending.",
    );
    expect(boardCaption({ metricLabel: "Track level", scope: "Tools", usesPeriod: false, period: "all", sort })).toBe(
      "Track level, Tools, Lifetime. Sorted by rank, ascending.",
    );
  });
});

describe("yourLine", () => {
  const base = { hidden: false, youValue: 0, unit: "Ore", rank: null, rowCount: 7 };
  test("covers hidden, ranked, out of scope and unranked", () => {
    expect(yourLine({ ...base, hidden: true, youValue: 12 }, fmt)).toBe("Hidden from boards. Your value is 12 ore, visible only to you.");
    expect(yourLine({ ...base, rank: 3 }, fmt)).toBe("Rank 3 of 7.");
    expect(yourLine({ ...base, youValue: 5 }, fmt)).toBe("Not ranked on this board (not in scope).");
    expect(yourLine(base, fmt)).toBe("Not ranked yet. A board needs a value above zero.");
  });
});
