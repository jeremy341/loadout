import { describe, expect, test } from "bun:test";
import {
  MS_DAY,
  addDays,
  clamp,
  formatDateTimeUtc,
  formatDateUtc,
  formatDayUtc,
  fromDateInput,
  isoWeek,
  isoWeekLabel,
  startOfUtcDay,
  toDateInput,
  weekIndex,
  weekStartFromIndex,
  weekStartMs,
} from "./dates";

const utc = (y: number, m: number, d: number, h = 0) => Date.UTC(y, m - 1, d, h);

describe("week index", () => {
  test("increases by one for each Monday-to-Sunday week", () => {
    const monday = utc(2026, 10, 19);
    expect(weekIndex(monday + 6 * MS_DAY + 23 * 3_600_000)).toBe(weekIndex(monday));
    expect(weekIndex(monday + 7 * MS_DAY)).toBe(weekIndex(monday) + 1);
    expect(weekIndex(monday - 1)).toBe(weekIndex(monday) - 1);
  });

  test("week starts are Mondays at 00:00 UTC", () => {
    const start = weekStartMs(utc(2026, 10, 25, 23));
    expect(new Date(start).getUTCDay()).toBe(1);
    expect(start).toBe(utc(2026, 10, 19));
    expect(weekStartFromIndex(weekIndex(start))).toBe(start);
  });

  test("works across a year boundary", () => {
    const a = weekIndex(utc(2020, 12, 30));
    const b = weekIndex(utc(2021, 1, 5));
    expect(b - a).toBe(1);
  });
});

describe("ISO week labels", () => {
  test("a normal week", () => {
    expect(isoWeek(utc(2026, 10, 20))).toEqual({ year: 2026, week: 43 });
    expect(isoWeekLabel(utc(2026, 10, 20))).toBe("2026-W43");
  });

  test("year boundaries follow the Thursday rule", () => {
    // 2020 has 53 ISO weeks; 1 and 3 January 2021 still belong to 2020-W53.
    expect(isoWeekLabel(utc(2020, 12, 31))).toBe("2020-W53");
    expect(isoWeekLabel(utc(2021, 1, 1))).toBe("2020-W53");
    expect(isoWeekLabel(utc(2021, 1, 3))).toBe("2020-W53");
    expect(isoWeekLabel(utc(2021, 1, 4))).toBe("2021-W01");
    // 30 December 2024 is the Monday of 2025-W01.
    expect(isoWeekLabel(utc(2024, 12, 29))).toBe("2024-W52");
    expect(isoWeekLabel(utc(2024, 12, 30))).toBe("2025-W01");
    expect(isoWeekLabel(utc(2015, 12, 31))).toBe("2015-W53");
  });
});

describe("date input helpers", () => {
  test("round trips a real date", () => {
    expect(fromDateInput("2026-10-20")).toBe(utc(2026, 10, 20));
    expect(toDateInput(utc(2026, 10, 20, 15))).toBe("2026-10-20");
  });

  test("rejects shapes and impossible dates", () => {
    expect(fromDateInput("")).toBeNull();
    expect(fromDateInput("2026-13-01")).toBeNull();
    expect(fromDateInput("2026-02-30")).toBeNull();
    expect(fromDateInput("20-10-2026")).toBeNull();
    expect(fromDateInput("2024-02-29")).not.toBeNull();
    expect(fromDateInput("2025-02-29")).toBeNull();
  });

  test("formats are UTC and independent of locale", () => {
    expect(formatDateUtc(utc(2026, 10, 20, 12))).toBe("20 Oct 2026");
    expect(formatDayUtc(utc(2026, 10, 20, 12))).toBe("Tue 20 Oct 2026");
    expect(formatDateTimeUtc(utc(2026, 10, 22, 18))).toBe("Thu 22 Oct 2026, 18:00 UTC");
  });

  test("small helpers", () => {
    expect(startOfUtcDay(utc(2026, 10, 20, 15))).toBe(utc(2026, 10, 20));
    expect(addDays(utc(2026, 10, 20), 7)).toBe(utc(2026, 10, 27));
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });
});
