// UTC date helpers for Leaderboards, Seasons and Events. Everything is computed on UTC milliseconds so a
// server render and a browser render produce the same text (no locale or time zone differences), and so the
// rules can be tested without a clock. Plan 11 leaves the reset time zone open; the Draft preview rule is
// "weeks run Monday 00:00 UTC to Sunday 24:00 UTC".

export const MS_DAY = 86_400_000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseMs(iso: string): number {
  return Date.parse(iso);
}

export function addDays(ms: number, days: number): number {
  return ms + days * MS_DAY;
}

/** Whole days since 1970-01-01 (UTC). */
export function dayNumber(ms: number): number {
  return Math.floor(ms / MS_DAY);
}

/**
 * A number that goes up by exactly one for each ISO week (Monday to Sunday). 1970-01-01 was a Thursday, so the
 * Monday on or before it is day -3. Consecutive values mean consecutive weeks even across a year boundary, which
 * is why the streak and the windows use this instead of comparing "year" and "week" pairs.
 */
export function weekIndex(ms: number): number {
  return Math.floor((dayNumber(ms) + 3) / 7);
}

/** Monday 00:00 UTC of the week that contains `ms`. */
export function weekStartMs(ms: number): number {
  return (weekIndex(ms) * 7 - 3) * MS_DAY;
}

export function weekStartFromIndex(index: number): number {
  return (index * 7 - 3) * MS_DAY;
}

/** ISO 8601 week number and week-based year. The week belongs to the year that holds its Thursday. */
export function isoWeek(ms: number): { year: number; week: number } {
  const thursday = weekIndex(ms) * 7 - 3 + 3;
  const year = new Date(thursday * MS_DAY).getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1) / MS_DAY;
  return { year, week: Math.floor((thursday - jan1) / 7) + 1 };
}

export function isoWeekLabel(ms: number): string {
  const { year, week } = isoWeek(ms);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function startOfUtcDay(ms: number): number {
  return dayNumber(ms) * MS_DAY;
}

/** `YYYY-MM-DD` for an <input type="date">. */
export function toDateInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Whether UTC midnight `ms` falls on exactly this calendar date (false for rolled-over dates such as 31 Feb). */
function isSameUtcDate(ms: number, year: number, month: number, day: number): boolean {
  const back = new Date(ms);
  return back.getUTCFullYear() === year && back.getUTCMonth() === month - 1 && back.getUTCDate() === day;
}

/** Strict `YYYY-MM-DD` to UTC midnight, or null when it is not a real calendar date. */
export function fromDateInput(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(year, month - 1, day);
  return isSameUtcDate(ms, year, month, day) ? ms : null;
}

/** "20 Oct 2026". */
export function formatDateUtc(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Tue 20 Oct 2026". */
export function formatDayUtc(ms: number): string {
  return `${WEEKDAYS[new Date(ms).getUTCDay()]} ${formatDateUtc(ms)}`;
}

/** "Thu 22 Oct 2026, 18:00 UTC". */
export function formatDateTimeUtc(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${formatDayUtc(ms)}, ${hh}:${mm} UTC`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
