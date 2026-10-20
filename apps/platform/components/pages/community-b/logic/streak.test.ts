import { describe, expect, test } from "bun:test";
import { computeStreak } from "./streak";

const utc = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h);

describe("weekly streak", () => {
  test("no activity", () => {
    const s = computeStreak([], utc(2026, 10, 20));
    expect(s).toMatchObject({ current: 0, longest: 0, thisWeekDone: false, atRisk: false });
    expect(s.recent).toHaveLength(12);
    expect(s.recent[11].isCurrent).toBe(true);
  });

  test("consecutive weeks including this one", () => {
    const now = utc(2026, 10, 20); // Tuesday of 2026-W43
    const s = computeStreak([utc(2026, 10, 6), utc(2026, 10, 14), utc(2026, 10, 19)], now);
    expect(s).toMatchObject({ current: 3, longest: 3, thisWeekDone: true, atRisk: false });
  });

  test("several actions in one week count once", () => {
    const s = computeStreak([utc(2026, 10, 19), utc(2026, 10, 20), utc(2026, 10, 21)], utc(2026, 10, 22));
    expect(s.current).toBe(1);
  });

  test("an empty week so far is at risk but does not break the streak", () => {
    const now = utc(2026, 10, 20);
    const s = computeStreak([utc(2026, 10, 7), utc(2026, 10, 14)], now);
    expect(s).toMatchObject({ current: 2, thisWeekDone: false, atRisk: true });
  });

  test("a whole missed week breaks it", () => {
    const now = utc(2026, 10, 28); // 2026-W44
    const s = computeStreak([utc(2026, 10, 7), utc(2026, 10, 14)], now);
    expect(s).toMatchObject({ current: 0, longest: 2, atRisk: false });
  });

  test("longest streak is remembered after a gap", () => {
    const times = [utc(2026, 8, 3), utc(2026, 8, 10), utc(2026, 8, 17), utc(2026, 8, 24), utc(2026, 9, 14), utc(2026, 10, 19)];
    const s = computeStreak(times, utc(2026, 10, 20));
    expect(s.longest).toBe(4);
    expect(s.current).toBe(1);
  });

  test("weeks are consecutive across the 2020-W53 to 2021-W01 boundary", () => {
    const s = computeStreak([utc(2020, 12, 22), utc(2020, 12, 30), utc(2021, 1, 5)], utc(2021, 1, 6));
    expect(s.current).toBe(3);
    expect(s.recent.map((w) => w.label).slice(-3)).toEqual(["2020-W52", "2020-W53", "2021-W01"]);
  });

  test("weeks are consecutive across 2024-W52 to 2025-W01", () => {
    const s = computeStreak([utc(2024, 12, 24), utc(2024, 12, 31)], utc(2025, 1, 2));
    expect(s.current).toBe(2);
  });

  test("Sunday night and Monday morning are different weeks", () => {
    const sunday = Date.UTC(2026, 9, 25, 23, 59);
    const monday = Date.UTC(2026, 9, 26, 0, 1);
    expect(computeStreak([sunday], monday).atRisk).toBe(true);
    expect(computeStreak([sunday, monday], monday).current).toBe(2);
  });

  test("ignores actions after the Preview date and bad times", () => {
    const now = utc(2026, 10, 20);
    const s = computeStreak([utc(2026, 11, 20), Number.NaN], now);
    expect(s.current).toBe(0);
    expect(s.longest).toBe(0);
  });

  test("recent weeks list oldest to newest and marks done", () => {
    const s = computeStreak([utc(2026, 10, 19)], utc(2026, 10, 20), 4);
    expect(s.recent.map((w) => w.done)).toEqual([false, false, false, true]);
    expect(s.recent.map((w) => w.label)).toEqual(["2026-W40", "2026-W41", "2026-W42", "2026-W43"]);
  });
});
