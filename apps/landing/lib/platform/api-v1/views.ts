// Pure shaping for the /api/v1 "me" views: track levels from approved hours, hour series by day or week, and daily activity.
// No database. Every function has a bun test (views.test.ts). The database reads are in queries-data.ts.
//
// API:
//   trackLevelRows(projects) -> TrackLevelRow[]     one per track, in TRACKS order; hours are APPROVED hours (project minutes)
//   hourSeries(rows, granularity) -> { start, seconds }[]   daily sums, or ISO weeks (Monday start)
//   sumSecondsByName(rows) -> { name, seconds }[]   for a window, largest first
//   activityDays(entries, from, to) -> { day, hours }[]    every day in the window, grace-shifted like the heatmap
import { bucket, type DaySeconds } from "../hackatime/hours";
import { dayTotals } from "../activity";
import { discountForHours, hoursToNextLevel, LEVEL_CAP, levelForHours, shownDiscount, TRACKS } from "../progress";
import { addDaysUtc } from "./query";

export type TrackLevelRow = {
  track: string;
  approvedHours: number;
  level: number;
  levelCap: number;
  discountPercent: number;
  hoursToNextLevel: number | null;
};

export function trackLevelRows(projects: readonly { track: string | null; approvedMinutes: number }[]): TrackLevelRow[] {
  const minutes = new Map<string, number>();
  for (const project of projects) {
    if (!project.track) continue;
    minutes.set(project.track, (minutes.get(project.track) ?? 0) + Math.max(0, project.approvedMinutes));
  }
  return TRACKS.map((track) => {
    const hours = (minutes.get(track) ?? 0) / 60;
    return {
      track,
      approvedHours: Math.round(hours * 100) / 100,
      level: levelForHours(hours),
      levelCap: LEVEL_CAP,
      discountPercent: shownDiscount(discountForHours(hours)),
      hoursToNextLevel: hoursToNextLevel(hours),
    };
  });
}

export function hourSeries(rows: readonly DaySeconds[], granularity: "day" | "week"): { start: string; seconds: number }[] {
  return bucket([...rows], granularity);
}

export function sumSecondsByName(rows: readonly { name: string; seconds: number }[]): { name: string; seconds: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.name, (totals.get(row.name) ?? 0) + row.seconds);
  return [...totals.entries()].map(([name, seconds]) => ({ name, seconds })).sort((a, b) => b.seconds - a.seconds || (a.name < b.name ? -1 : 1));
}

// Every day from `from` to `to`, inclusive, with zero where nothing was logged. Entries are grouped with the same grace rule as
// the profile heatmap (activity.ts), so the two views agree on which day an entry belongs to.
export function activityDays(
  entries: readonly { createdAt: Date; hours: number }[],
  from: string,
  to: string,
): { day: string; hours: number }[] {
  const totals = dayTotals(entries, "UTC");
  const days: { day: string; hours: number }[] = [];
  for (let day = from; day <= to; day = addDaysUtc(day, 1)) {
    days.push({ day, hours: Math.round((totals[day] ?? 0) * 100) / 100 });
  }
  return days;
}

