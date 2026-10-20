import { describe, expect, test } from "bun:test";
import { MS_DAY } from "./dates";
import {
  buildSchedule,
  currentSeason,
  inWindow,
  phaseOf,
  seasonProgress,
  seasonWindow,
  weekWindow,
  windowFor,
  windowRolledOver,
} from "./windows";

const utc = (y: number, m: number, d: number, h = 0) => Date.UTC(y, m - 1, d, h);
const SPECS = [
  { id: "S00", name: "BOOT", weeks: 4 },
  { id: "S01", name: "TOOLCHAIN", weeks: 6 },
];
const SCHEDULE = buildSchedule(utc(2026, 10, 5), SPECS);

describe("season schedule", () => {
  test("lays seasons end to end with the plan lengths", () => {
    expect(SCHEDULE[0].startMs).toBe(utc(2026, 10, 5));
    expect(SCHEDULE[0].endMs).toBe(utc(2026, 11, 2));
    expect(SCHEDULE[1].startMs).toBe(SCHEDULE[0].endMs);
    expect(SCHEDULE[1].endMs - SCHEDULE[1].startMs).toBe(42 * MS_DAY);
  });

  test("current season rolls over exactly at the boundary", () => {
    expect(currentSeason(SCHEDULE, utc(2026, 11, 1, 23)).slot.id).toBe("S00");
    expect(currentSeason(SCHEDULE, utc(2026, 11, 2)).slot.id).toBe("S01");
  });

  test("before the first and after the last season", () => {
    expect(currentSeason(SCHEDULE, utc(2026, 9, 1))).toMatchObject({ state: "before-start", slot: { id: "S00" } });
    expect(currentSeason(SCHEDULE, utc(2027, 6, 1))).toMatchObject({ state: "schedule-ended", slot: { id: "S01" } });
  });

  test("phase", () => {
    const now = utc(2026, 11, 3);
    expect(phaseOf(SCHEDULE[0], now)).toBe("past");
    expect(phaseOf(SCHEDULE[1], now)).toBe("current");
    expect(phaseOf(SCHEDULE[1], utc(2026, 10, 1))).toBe("upcoming");
  });

  test("progress", () => {
    const p = seasonProgress(SCHEDULE[0], utc(2026, 10, 20, 12));
    expect(p).toMatchObject({ weekNumber: 3, weeksTotal: 4, pct: 55 });
    expect(p.daysLeft).toBe(13);
    expect(seasonProgress(SCHEDULE[0], utc(2026, 12, 1)).pct).toBe(100);
    expect(seasonProgress(SCHEDULE[0], utc(2026, 9, 1)).pct).toBe(0);
    expect(seasonProgress(SCHEDULE[0], utc(2026, 12, 1)).weekNumber).toBe(4);
  });
});

describe("windows", () => {
  test("week window is Monday to next Monday", () => {
    const w = weekWindow(utc(2026, 10, 25, 23));
    expect(w.start).toBe(utc(2026, 10, 19));
    expect(w.end).toBe(utc(2026, 10, 26));
  });

  test("windowFor", () => {
    const now = utc(2026, 10, 20);
    expect(windowFor("all", now, SCHEDULE[0])).toBeNull();
    expect(windowFor("season", now, SCHEDULE[0])).toEqual(seasonWindow(SCHEDULE[0]));
    expect(windowFor("week", now, SCHEDULE[0])).toEqual(weekWindow(now));
  });

  test("inWindow is start-inclusive and end-exclusive", () => {
    const w = weekWindow(utc(2026, 10, 20));
    expect(inWindow(w.start, w)).toBe(true);
    expect(inWindow(w.end - 1, w)).toBe(true);
    expect(inWindow(w.end, w)).toBe(false);
    expect(inWindow(w.start - 1, w)).toBe(false);
    expect(inWindow(utc(1999, 1, 1), null)).toBe(true);
    expect(inWindow(Number.NaN, null)).toBe(false);
  });

  test("a weekly board resets when the Preview date crosses Monday", () => {
    const before = weekWindow(utc(2026, 10, 25, 23));
    const same = weekWindow(utc(2026, 10, 23));
    const after = weekWindow(utc(2026, 10, 26, 1));
    expect(windowRolledOver(before, same)).toBe(false);
    expect(windowRolledOver(before, after)).toBe(true);
    expect(windowRolledOver(null, after)).toBe(false);
  });

  test("a Season board resets at the Season boundary", () => {
    const entry = utc(2026, 11, 1, 12);
    const s0 = seasonWindow(SCHEDULE[0]);
    const s1 = seasonWindow(SCHEDULE[1]);
    expect(inWindow(entry, s0)).toBe(true);
    expect(inWindow(entry, s1)).toBe(false);
    expect(windowRolledOver(s0, s1)).toBe(true);
  });
});
