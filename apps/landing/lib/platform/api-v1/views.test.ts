import { describe, expect, test } from "bun:test";
import { activityDays, hourSeries, sumSecondsByName, trackLevelRows } from "./views";

describe("trackLevelRows", () => {
  test("one row per track in TRACKS order, zero for a track with no approved hours", () => {
    const rows = trackLevelRows([]);
    expect(rows.map((r) => r.track)).toEqual(["Tools", "Systems", "Compute", "Hardware"]);
    expect(rows.every((r) => r.level === 0 && r.approvedHours === 0 && r.discountPercent === 0)).toBe(true);
    expect(rows[0].hoursToNextLevel).toBe(1);
    expect(rows[0].levelCap).toBe(20);
  });

  test("sums approved minutes per track and reads the level from the hours", () => {
    // 4 hours approved on Tools reaches LV.2 (LV.1 at 1 h, LV.2 at 4 h).
    const rows = trackLevelRows([
      { track: "Tools", approvedMinutes: 120 },
      { track: "Tools", approvedMinutes: 120 },
      { track: "Hardware", approvedMinutes: 30 },
      { track: null, approvedMinutes: 600 },
    ]);
    const tools = rows.find((r) => r.track === "Tools");
    expect(tools?.approvedHours).toBe(4);
    expect(tools?.level).toBe(2);
    expect(tools?.hoursToNextLevel).toBe(5);
    const hardware = rows.find((r) => r.track === "Hardware");
    expect(hardware?.approvedHours).toBe(0.5);
    expect(hardware?.level).toBe(0); // LV.1 needs a full hour
  });

  test("the discount is shown rounded down to one decimal and never above 20", () => {
    const rows = trackLevelRows([{ track: "Systems", approvedMinutes: 275 * 60 }, { track: "Compute", approvedMinutes: 9999 * 60 }]);
    expect(rows.find((r) => r.track === "Systems")?.discountPercent).toBe(20);
    expect(rows.find((r) => r.track === "Compute")?.discountPercent).toBe(20);
    expect(rows.find((r) => r.track === "Systems")?.hoursToNextLevel).toBeNull();
  });

  test("never negative minutes", () => {
    const rows = trackLevelRows([{ track: "Tools", approvedMinutes: -60 }]);
    expect(rows.find((r) => r.track === "Tools")?.approvedHours).toBe(0);
  });
});

describe("hourSeries", () => {
  test("day granularity keeps the days", () => {
    expect(
      hourSeries(
        [
          { day: "2026-11-02", seconds: 60 },
          { day: "2026-11-01", seconds: 30 },
        ],
        "day",
      ),
    ).toEqual([
      { start: "2026-11-01", seconds: 30 },
      { start: "2026-11-02", seconds: 60 },
    ]);
  });

  test("week granularity starts on Monday and adds the days in each week", () => {
    // 2026-11-18 is a Wednesday, so its week starts Monday 2026-11-16. 2026-11-15 is a Sunday in the week before.
    const series = hourSeries(
      [
        { day: "2026-11-15", seconds: 10 },
        { day: "2026-11-16", seconds: 20 },
        { day: "2026-11-18", seconds: 30 },
      ],
      "week",
    );
    expect(series).toEqual([
      { start: "2026-11-09", seconds: 10 },
      { start: "2026-11-16", seconds: 50 },
    ]);
  });
});

describe("sumSecondsByName", () => {
  test("adds up repeated names and sorts largest first", () => {
    expect(
      sumSecondsByName([
        { name: "arm", seconds: 10 },
        { name: "web", seconds: 50 },
        { name: "arm", seconds: 45 },
      ]),
    ).toEqual([
      { name: "arm", seconds: 55 },
      { name: "web", seconds: 50 },
    ]);
  });
});

describe("activityDays", () => {
  test("every day in the window, zero where nothing was logged", () => {
    const days = activityDays([{ createdAt: new Date("2026-11-02T12:00:00.000Z"), hours: 1.5 }], "2026-11-01", "2026-11-03");
    expect(days).toEqual([
      { day: "2026-11-01", hours: 0 },
      { day: "2026-11-02", hours: 1.5 },
      { day: "2026-11-03", hours: 0 },
    ]);
  });

  test("a late entry at 00:20 counts for the day before, as on the heatmap", () => {
    const days = activityDays([{ createdAt: new Date("2026-11-03T00:20:00.000Z"), hours: 2 }], "2026-11-02", "2026-11-03");
    expect(days).toEqual([
      { day: "2026-11-02", hours: 2 },
      { day: "2026-11-03", hours: 0 },
    ]);
  });

  test("ignores entries outside the window and non-positive hours", () => {
    const days = activityDays(
      [
        { createdAt: new Date("2026-10-01T12:00:00.000Z"), hours: 5 },
        { createdAt: new Date("2026-11-02T12:00:00.000Z"), hours: 0 },
      ],
      "2026-11-01",
      "2026-11-02",
    );
    expect(days.every((d) => d.hours === 0)).toBe(true);
    expect(days.length).toBe(2);
  });
});
