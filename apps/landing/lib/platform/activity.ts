// Pure rules for the profile activity heatmap and streaks. No database, no framework; every function has a bun test
// (activity.test.ts). The data is self-reported journal hours ("logged hours"), never approved hours.
//
// A day ends 30 minutes after local midnight: an entry made at 00:20 counts for the day before, so a late session does not
// break a streak. The timezone is a parameter (an IANA name); it defaults to UTC until a person has one.
//
// API:
//   GRACE_MINUTES                       30
//   HEATMAP_WEEKS                       52
//   dayKeyFor(date, tz?)                -> "YYYY-MM-DD" of the grace-shifted local day
//   dayTotals(entries, tz?)             -> Record<dayKey, hours>   journal entries summed by day
//   bandFor(hours)                      -> 0 | 1 | 2 | 3           0, under 2, under 4, 4 and over
//   heatmapWeeks(totals, now, tz?, weeks?) -> HeatCell[][]         columns are weeks (Sunday first), 7 cells each
//   monthLabels(weeks)                  -> (string | null)[]       one per week, a short month name where a month starts
//   currentStreak(dayKeys, now, tz?)    -> days in a row ending today or yesterday (alive until the day ends)
//   bestStreak(dayKeys)                 -> the longest run of days in a row
//   formatHours(hours)                  -> "2.5 h"
//   WEEKDAY_LABELS, dateLabel, describeDay, moveCell: the grid labels, tooltip text and keyboard moves

export const GRACE_MINUTES = 30;
export const HEATMAP_WEEKS = 52;
// The profile shows the last 12 weeks: the run is 80 days, so a longer grid would sit empty.
export const PROFILE_HEATMAP_WEEKS = 12;

export type HeatBand = 0 | 1 | 2 | 3;
export type HeatCell = { key: string; hours: number; band: HeatBand; future: boolean };

const DAY_MS = 86_400_000;

function validTz(tz: string): string {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

export function dayKeyFor(date: Date, tz = "UTC"): string {
  const shifted = new Date(date.getTime() - GRACE_MINUTES * 60_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: validTz(tz), year: "numeric", month: "2-digit", day: "2-digit" }).format(shifted);
}

const toUtc = (key: string): number => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
};
const fromUtc = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
export const addDays = (key: string, days: number): string => fromUtc(toUtc(key) + days * DAY_MS);

export function dayTotals(entries: readonly { createdAt: Date; hours: number }[], tz = "UTC"): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const entry of entries) {
    if (!Number.isFinite(entry.hours) || entry.hours <= 0) continue;
    const key = dayKeyFor(entry.createdAt, tz);
    totals[key] = (totals[key] ?? 0) + entry.hours;
  }
  return totals;
}

export function bandFor(hours: number): HeatBand {
  if (!(hours > 0)) return 0;
  if (hours < 2) return 1;
  if (hours < 4) return 2;
  return 3;
}

export function heatmapWeeks(totals: Readonly<Record<string, number>>, now: Date, tz = "UTC", weeks = HEATMAP_WEEKS): HeatCell[][] {
  const today = dayKeyFor(now, tz);
  const weekday = new Date(toUtc(today)).getUTCDay(); // 0 = Sunday
  const start = addDays(today, -weekday - (weeks - 1) * 7);
  const columns: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const key = addDays(start, w * 7 + d);
      const future = key > today;
      const hours = future ? 0 : (totals[key] ?? 0);
      column.push({ key, hours, band: bandFor(hours), future });
    }
    columns.push(column);
  }
  return columns;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// A label sits above the first week whose Sunday begins a new month (the first week always carries its own month).
export function monthLabels(weeks: readonly HeatCell[][]): (string | null)[] {
  let last = -1;
  return weeks.map((week, index) => {
    const month = Number(week[0].key.slice(5, 7)) - 1;
    if (month === last) return null;
    last = month;
    // Skip a label squeezed against the next one: the first week only gets a label when the month runs for 3 or more weeks.
    if (index === 0 && weeks[2] && Number(weeks[2][0].key.slice(5, 7)) - 1 !== month) return null;
    return MONTHS[month];
  });
}

export function bestStreak(dayKeys: Iterable<string>): number {
  const days = [...new Set(dayKeys)].sort();
  let best = 0;
  let run = 0;
  let previous = "";
  for (const key of days) {
    run = previous && addDays(previous, 1) === key ? run + 1 : 1;
    if (run > best) best = run;
    previous = key;
  }
  return best;
}

export function currentStreak(dayKeys: Iterable<string>, now: Date, tz = "UTC"): number {
  const set = new Set(dayKeys);
  const today = dayKeyFor(now, tz);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export const formatHours = (hours: number): string => `${Math.round(hours * 10) / 10} h`;

// Weekday names for the labels at the left of the grid: Mon, Wed and Fri only, so the rows stay quiet.
export const WEEKDAY_LABELS: readonly string[] = ["", "Mon", "", "Wed", "", "Fri", ""];

const LONG_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Mon 16 Nov 2026" for a day key.
export function dateLabel(key: string): string {
  const date = new Date(toUtc(key));
  return `${LONG_DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${LONG_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// The tooltip and the accessible name of one square: the date and the hours.
export const describeDay = (cell: Pick<HeatCell, "key" | "hours">): string =>
  `${dateLabel(cell.key)}: ${cell.hours > 0 ? `${formatHours(cell.hours)} logged` : "no hours logged"}`;

// Keyboard move on the grid, in (week, day) coordinates. Left and Right change week, Up and Down change day. Squares in the
// future are skipped (they are not focusable), so a move that lands on one stays where it was.
export function moveCell(weeks: readonly HeatCell[][], from: { week: number; day: number }, key: string): { week: number; day: number } {
  const delta = key === "ArrowLeft" ? [-1, 0] : key === "ArrowRight" ? [1, 0] : key === "ArrowUp" ? [0, -1] : key === "ArrowDown" ? [0, 1] : null;
  if (!delta) return from;
  const week = from.week + delta[0];
  const day = from.day + delta[1];
  const target = weeks[week]?.[day];
  return target && !target.future ? { week, day } : from;
}

// Stasis's five levels for a day on the profile heatmap: 0 none, 1 under half an hour, 2 under an hour and a half, 3 under three
// hours, 4 three hours and more.
export type Intensity = 0 | 1 | 2 | 3 | 4;
export function intensityFor(hours: number): Intensity {
  if (!(hours > 0)) return 0;
  if (hours < 0.5) return 1;
  if (hours < 1.5) return 2;
  if (hours < 3) return 3;
  return 4;
}

// The numbers in the heatmap header: hours logged inside the shown weeks, the days they fall on, and the two streaks over every
// logged day (not only the shown weeks).
export function heatmapSummary(
  weeks: readonly HeatCell[][],
  totals: Readonly<Record<string, number>>,
  now: Date,
  tz = "UTC",
): { hours: number; loggedDays: number; current: number; best: number } {
  const start = weeks[0][0].key;
  const days = Object.keys(totals).filter((key) => (totals[key] ?? 0) > 0);
  const inWindow = days.filter((key) => key >= start && key <= dayKeyFor(now, tz));
  const hours = inWindow.reduce((sum, key) => sum + (totals[key] ?? 0), 0);
  return { hours, loggedDays: inWindow.length, current: currentStreak(days, now, tz), best: bestStreak(days) };
}
