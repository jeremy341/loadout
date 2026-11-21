import { describe, expect, it } from "bun:test";
import { addDays, bandFor, heatmapSummary, intensityFor, PROFILE_HEATMAP_WEEKS, bestStreak, currentStreak, dayKeyFor, dayTotals, formatHours, heatmapWeeks, monthLabels, WEEKDAY_LABELS, dateLabel, describeDay, moveCell } from "./activity";

const at = (iso: string) => new Date(iso);

describe("bandFor", () => {
  it("has four bands", () => {
    expect([0, 0.5, 1.99, 2, 3.99, 4, 9].map(bandFor)).toEqual([0, 1, 1, 2, 2, 3, 3]);
  });
  it("treats negative and NaN as empty", () => {
    expect(bandFor(-1)).toBe(0);
    expect(bandFor(Number.NaN)).toBe(0);
  });
});

describe("dayKeyFor", () => {
  it("counts the first 30 minutes after midnight for the day before", () => {
    expect(dayKeyFor(at("2026-11-10T00:20:00Z"))).toBe("2026-11-09");
    expect(dayKeyFor(at("2026-11-10T00:30:00Z"))).toBe("2026-11-10");
  });
  it("uses the timezone given", () => {
    expect(dayKeyFor(at("2026-11-10T23:10:00Z"), "Europe/Berlin")).toBe("2026-11-10");
    expect(dayKeyFor(at("2026-11-10T23:40:00Z"), "Europe/Berlin")).toBe("2026-11-11");
  });
  it("falls back to UTC for an unknown timezone", () => {
    expect(dayKeyFor(at("2026-11-10T12:00:00Z"), "Not/AZone")).toBe("2026-11-10");
  });
});

describe("dayTotals", () => {
  it("sums hours by day and skips empty ones", () => {
    const totals = dayTotals([
      { createdAt: at("2026-11-10T10:00:00Z"), hours: 1.5 },
      { createdAt: at("2026-11-10T18:00:00Z"), hours: 2 },
      { createdAt: at("2026-11-11T10:00:00Z"), hours: 0 },
    ]);
    expect(totals).toEqual({ "2026-11-10": 3.5 });
  });
});

describe("heatmapWeeks", () => {
  const now = at("2026-11-16T12:00:00Z"); // a Monday
  const weeks = heatmapWeeks({ "2026-11-16": 5, "2026-11-10": 1 }, now);
  it("has 52 weeks of 7 days starting on Sunday", () => {
    expect(weeks).toHaveLength(52);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(new Date(`${weeks[0][0].key}T00:00:00Z`).getUTCDay()).toBe(0);
  });
  it("ends in the week of today, with later days marked future", () => {
    const last = weeks[51];
    expect(last[0].key).toBe("2026-11-15");
    expect(last[1]).toMatchObject({ key: "2026-11-16", hours: 5, band: 3, future: false });
    expect(last[2].future).toBe(true);
  });
  it("places a day in its band", () => {
    expect(weeks[51].find((cell) => cell.key === "2026-11-10")).toBeUndefined();
    expect(weeks[50].find((cell) => cell.key === "2026-11-10")).toMatchObject({ band: 1 });
  });
  it("can make a shorter map", () => {
    expect(heatmapWeeks({}, now, "UTC", 13)).toHaveLength(13);
  });
});

describe("monthLabels", () => {
  it("labels each new month once", () => {
    const labels = monthLabels(heatmapWeeks({}, at("2026-11-16T12:00:00Z"))).filter(Boolean);
    expect(labels.length).toBeGreaterThanOrEqual(11);
    expect(new Set(labels).size).toBe(labels.length - (labels.length > 12 ? 1 : 0));
  });
});

describe("streaks", () => {
  const now = at("2026-11-16T12:00:00Z");
  it("counts days in a row ending today", () => {
    expect(currentStreak(["2026-11-16", "2026-11-15", "2026-11-14", "2026-11-10"], now)).toBe(3);
  });
  it("stays alive when only yesterday is logged", () => {
    expect(currentStreak(["2026-11-15", "2026-11-14"], now)).toBe(2);
  });
  it("is zero after a missed day", () => {
    expect(currentStreak(["2026-11-14"], now)).toBe(0);
    expect(currentStreak([], now)).toBe(0);
  });
  it("gives 30 minutes after midnight to the day before", () => {
    // 00:20 on the 17th still counts as the 16th, so a streak ending on the 16th is a streak of today.
    expect(currentStreak(["2026-11-16", "2026-11-15"], at("2026-11-17T00:20:00Z"))).toBe(2);
    // At 00:40 the 17th has begun; the 16th is yesterday and the streak is still alive.
    expect(currentStreak(["2026-11-16", "2026-11-15"], at("2026-11-17T00:40:00Z"))).toBe(2);
    // Two days later it is broken.
    expect(currentStreak(["2026-11-16", "2026-11-15"], at("2026-11-18T12:00:00Z"))).toBe(0);
  });
  it("finds the best run", () => {
    expect(bestStreak(["2026-01-01", "2026-01-02", "2026-01-03", "2026-02-01", "2026-02-02"])).toBe(3);
    expect(bestStreak([])).toBe(0);
    expect(bestStreak(["2026-02-28", "2026-03-01"])).toBe(2);
  });
});

describe("helpers", () => {
  it("adds days across a month end", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("formats hours", () => {
    expect(formatHours(2.54)).toBe("2.5 h");
    expect(formatHours(4)).toBe("4 h");
  });
});

describe("grid labels and keyboard moves", () => {
  const now = at("2026-11-16T12:00:00Z");
  const weeks = heatmapWeeks({ "2026-11-16": 2.5 }, now);
  it("labels Mon, Wed and Fri on seven rows", () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
    expect(WEEKDAY_LABELS.filter(Boolean)).toEqual(["Mon", "Wed", "Fri"]);
  });
  it("has one month label per new month, never two in a row", () => {
    const labels = monthLabels(weeks);
    expect(labels).toHaveLength(52);
    labels.forEach((label, index) => {
      if (label) expect(labels[index + 1]).toBeNull();
    });
  });
  it("names a day with its date and hours", () => {
    expect(dateLabel("2026-11-16")).toBe("Mon 16 Nov 2026");
    expect(describeDay({ key: "2026-11-16", hours: 2.5 })).toBe("Mon 16 Nov 2026: 2.5 h logged");
    expect(describeDay({ key: "2026-11-15", hours: 0 })).toBe("Sun 15 Nov 2026: no hours logged");
  });
  it("moves by day and week and stops at the edges and at the future", () => {
    expect(moveCell(weeks, { week: 51, day: 1 }, "ArrowUp")).toEqual({ week: 51, day: 0 });
    expect(moveCell(weeks, { week: 51, day: 1 }, "ArrowLeft")).toEqual({ week: 50, day: 1 });
    expect(moveCell(weeks, { week: 51, day: 1 }, "ArrowDown")).toEqual({ week: 51, day: 1 }); // Tuesday is in the future
    expect(moveCell(weeks, { week: 51, day: 1 }, "ArrowRight")).toEqual({ week: 51, day: 1 });
    expect(moveCell(weeks, { week: 0, day: 0 }, "ArrowUp")).toEqual({ week: 0, day: 0 });
    expect(moveCell(weeks, { week: 0, day: 0 }, "ArrowLeft")).toEqual({ week: 0, day: 0 });
  });
});

describe("intensityFor (Stasis levels)", () => {
  it("steps at 0.5, 1.5 and 3 hours", () => {
    expect([0, -1, NaN, 0.1, 0.49, 0.5, 1.49, 1.5, 2.99, 3, 10].map(intensityFor)).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("heatmapSummary", () => {
  const now = new Date("2026-11-17T12:00:00Z");
  const weeks = heatmapWeeks({}, now, "UTC", PROFILE_HEATMAP_WEEKS);
  it("shows 12 weeks of 7 days", () => {
    expect(weeks).toHaveLength(12);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });
  it("is all zeros with no hours", () => {
    expect(heatmapSummary(weeks, {}, now)).toEqual({ hours: 0, loggedDays: 0, current: 0, best: 0 });
  });
  it("counts hours in the window only, and streaks over every day", () => {
    const totals = { "2025-01-01": 5, "2025-01-02": 5, "2025-01-03": 5, "2026-11-16": 2, "2026-11-17": 1.5 };
    const summary = heatmapSummary(weeks, totals, now);
    expect(summary.hours).toBe(3.5);
    expect(summary.loggedDays).toBe(2);
    expect(summary.current).toBe(2);
    expect(summary.best).toBe(3);
  });
  it("ignores future days", () => {
    expect(heatmapSummary(weeks, { "2026-11-20": 4 }, now).hours).toBe(0);
  });
});
