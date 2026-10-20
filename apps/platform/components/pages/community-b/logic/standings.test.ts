import { describe, expect, test } from "bun:test";
import { ME } from "../../../../lib/sample/builders";
import { sampleBoardBuilders } from "../data";
import type { Contribution } from "./quests";
import {
  TRACKS,
  boardValue,
  buildBoard,
  inScope,
  levelFromShips,
  periodApplies,
  yourStats,
  type BoardBuilder,
  type BuilderStats,
} from "./standings";
import { buildSchedule } from "./windows";

const utc = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h);
const SEASON = buildSchedule(utc(2026, 10, 5, 0), [{ id: "S00", name: "BOOT", weeks: 4 }])[0];
const NOW = utc(2026, 10, 20);

const stats = (over: Partial<BuilderStats> = {}): BuilderStats => ({
  levels: { Tools: 1, Systems: 1, Compute: 1, Hardware: 1 },
  ore: { week: 0, season: 0, all: 0 },
  reviews: { week: 0, season: 0, all: 0 },
  hours: { week: 0, season: 0, all: 0 },
  ...over,
});
const person = (handle: string, track: BoardBuilder["track"], s: BuilderStats, extra: Partial<BoardBuilder> = {}): BoardBuilder => ({
  handle,
  name: handle.toUpperCase(),
  track,
  isYou: false,
  isPublic: true,
  stats: s,
  ...extra,
});
const ore = (all: number, season = all, week = 0) => stats({ ore: { week, season, all } });

describe("board values", () => {
  const b = person("a", "Systems", stats({ levels: { Tools: 2, Systems: 9, Compute: 4, Hardware: 1 }, ore: { week: 1, season: 2, all: 3 } }));

  test("track level: highest level for all tracks, the track's level otherwise", () => {
    expect(boardValue(b, { metric: "level", scope: "all", period: "all" })).toBe(9);
    expect(boardValue(b, { metric: "level", scope: "Compute", period: "all" })).toBe(4);
  });

  test("period picks the right figure", () => {
    expect(boardValue(b, { metric: "ore", scope: "all", period: "week" })).toBe(1);
    expect(boardValue(b, { metric: "ore", scope: "all", period: "season" })).toBe(2);
    expect(boardValue(b, { metric: "ore", scope: "all", period: "all" })).toBe(3);
  });

  test("levels ignore the period; other metrics honour it", () => {
    expect(periodApplies("level")).toBe(false);
    expect(periodApplies("ore")).toBe(true);
  });

  test("track scope on non-level boards means home track", () => {
    expect(inScope(b, { metric: "ore", scope: "Systems", period: "all" })).toBe(true);
    expect(inScope(b, { metric: "ore", scope: "Tools", period: "all" })).toBe(false);
    expect(inScope(b, { metric: "level", scope: "Tools", period: "all" })).toBe(true);
  });
});

describe("building a board", () => {
  const q = { metric: "ore", scope: "all", period: "all" } as const;

  test("ranks with shared ranks for ties and drops zeros", () => {
    const board = buildBoard([person("a", "Tools", ore(50)), person("b", "Tools", ore(80)), person("c", "Tools", ore(50)), person("d", "Tools", ore(0))], q, false);
    expect(board.rows.map((r) => [r.row.handle, r.rank])).toEqual([
      ["b", 1],
      ["a", 2],
      ["c", 2],
    ]);
  });

  test("private builders are left off and counted", () => {
    const board = buildBoard([person("a", "Tools", ore(50)), person("p", "Tools", ore(90), { isPublic: false })], q, false);
    expect(board.rows.map((r) => r.row.handle)).toEqual(["a"]);
    expect(board.privateCount).toBe(1);
  });

  test("hiding yourself removes your row and re-ranks everyone else, but keeps your value", () => {
    const me = person("you", "Tools", ore(70), { isYou: true });
    const others = [person("a", "Tools", ore(90)), person("b", "Tools", ore(60))];
    const shown = buildBoard([...others, me], q, false);
    expect(shown.you?.rank).toBe(2);
    expect(shown.rows.find((r) => r.row.handle === "b")?.rank).toBe(3);
    const hidden = buildBoard([...others, me], q, true);
    expect(hidden.you).toBeNull();
    expect(hidden.youValue).toBe(70);
    expect(hidden.rows.map((r) => [r.row.handle, r.rank])).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  test("you are unranked with a zero value", () => {
    const board = buildBoard([person("a", "Tools", ore(5)), person("you", "Tools", ore(0), { isYou: true })], q, false);
    expect(board.you).toBeNull();
    expect(board.youValue).toBe(0);
  });

  test("track scope filters by home track", () => {
    const board = buildBoard(
      [person("a", "Tools", ore(5)), person("b", "Hardware", ore(9)), person("c", "Hardware", ore(7))],
      { ...q, scope: "Hardware" },
      false,
    );
    expect(board.rows.map((r) => r.row.handle)).toEqual(["b", "c"]);
  });
});

describe("your own numbers", () => {
  const contribs: Contribution[] = [
    { id: "1", type: "ship", qty: 3, track: "Tools", at: new Date(utc(2026, 10, 12)).toISOString() },
    { id: "2", type: "ship", qty: 20, track: "Systems", at: new Date(utc(2026, 10, 13)).toISOString() },
    { id: "3", type: "review", qty: 2, track: "Tools", at: new Date(utc(2026, 10, 20)).toISOString() },
    { id: "4", type: "review", qty: 4, track: "Tools", at: new Date(utc(2026, 10, 7)).toISOString() },
    { id: "5", type: "journal", qty: 1, hours: 6, track: "Tools", at: new Date(utc(2026, 10, 19)).toISOString() },
    { id: "6", type: "journal", qty: 1, hours: 4, track: "Tools", at: new Date(utc(2026, 9, 20)).toISOString() },
  ];
  const ledger = [
    { amount: 120, at: new Date(utc(2026, 10, 1)).toISOString() },
    { amount: 50, at: new Date(utc(2026, 10, 19)).toISOString() },
    { amount: -40, at: new Date(utc(2026, 10, 19)).toISOString() },
  ];
  const mine = yourStats(contribs, ledger, NOW, SEASON);

  test("Track level follows approved ships and caps at 15", () => {
    expect(mine.levels).toEqual({ Tools: 3, Systems: 15, Compute: 0, Hardware: 0 });
    expect(levelFromShips(40)).toBe(15);
    expect(levelFromShips(-2)).toBe(0);
  });

  test("Ore earned counts only credits and respects the windows", () => {
    expect(mine.ore.all).toBe(170);
    expect(mine.ore.season).toBe(50);
    expect(mine.ore.week).toBe(50);
  });

  test("reviews and journal hours are windowed by Preview time", () => {
    expect(mine.reviews).toEqual({ week: 2, season: 6, all: 6 });
    expect(mine.hours).toEqual({ week: 6, season: 6, all: 10 });
  });

  test("a new browser has nothing to rank", () => {
    const empty = yourStats([], [], NOW, SEASON);
    expect(empty.ore.all).toBe(0);
    for (const t of TRACKS) expect(empty.levels[t]).toBe(0);
  });
});

describe("sample standings data", () => {
  const builders = sampleBoardBuilders();

  test("handles are unique, none is you, and there is more than one page", () => {
    const handles = builders.map((b) => b.handle);
    expect(new Set(handles).size).toBe(handles.length);
    expect(handles).not.toContain(ME.handle);
    expect(builders.length).toBeGreaterThan(20);
  });

  test("week <= season <= all time for every figure", () => {
    for (const b of builders) {
      for (const key of ["ore", "reviews", "hours"] as const) {
        expect(b.stats[key].week).toBeLessThanOrEqual(b.stats[key].season);
        expect(b.stats[key].season).toBeLessThanOrEqual(b.stats[key].all);
      }
    }
  });

  test("levels are within 1 to 15 and the home track holds the top level", () => {
    for (const b of builders) {
      const top = Math.max(...TRACKS.map((t) => b.stats.levels[t]));
      expect(top).toBeLessThanOrEqual(15);
      expect(b.stats.levels[b.track]).toBe(top);
      for (const t of TRACKS) expect(b.stats.levels[t]).toBeGreaterThanOrEqual(1);
    }
  });

  test("the data is deterministic", () => {
    expect(JSON.stringify(sampleBoardBuilders())).toBe(JSON.stringify(builders));
  });

  test("at least one board has a tie so shared ranks are visible", () => {
    const board = buildBoard(builders, { metric: "level", scope: "all", period: "all" }, false);
    const ranks = board.rows.map((r) => r.rank);
    expect(new Set(ranks).size).toBeLessThan(ranks.length);
  });

  test("some sample builders keep their standing private", () => {
    expect(builders.some((b) => !b.isPublic)).toBe(true);
  });
});
