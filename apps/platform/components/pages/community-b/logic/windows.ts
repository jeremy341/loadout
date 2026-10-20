// Leaderboard time windows and Season scheduling.
//
// Plan 02 section 22: "Competitive season rankings reset", Season 00 is 4 weeks, later seasons are
// 6 weeks "after validation", themes S00 BOOT .. S05 MEASURE. Plan 11: a weekly reset is a schedule boundary
// that is separate from both Seasons and Eras. Plans do not set dates or the reset time zone; callers pass in a
// Draft preview calendar (see data.ts) and every function here is a pure function of its arguments.

import { MS_DAY, addDays, weekStartMs } from "./dates";

export type Period = "week" | "season" | "all";

export interface TimeWindow {
  /** Inclusive, UTC milliseconds. */
  start: number;
  /** Exclusive, UTC milliseconds. */
  end: number;
}

export interface SeasonSpec {
  id: string;
  name: string;
  weeks: number;
}

export interface SeasonSlot extends SeasonSpec {
  index: number;
  startMs: number;
  endMs: number;
}

export type SeasonPhase = "upcoming" | "current" | "past";

/** Lays seasons end to end from `startMs`. */
export function buildSchedule(startMs: number, specs: readonly SeasonSpec[]): SeasonSlot[] {
  const slots: SeasonSlot[] = [];
  let cursor = startMs;
  specs.forEach((spec, index) => {
    const end = cursor + spec.weeks * 7 * MS_DAY;
    slots.push({ ...spec, index, startMs: cursor, endMs: end });
    cursor = end;
  });
  return slots;
}

export function phaseOf(slot: SeasonSlot, nowMs: number): SeasonPhase {
  if (nowMs < slot.startMs) return "upcoming";
  if (nowMs >= slot.endMs) return "past";
  return "current";
}

export interface CurrentSeason {
  slot: SeasonSlot;
  /** "active" inside a season, "before-start" ahead of the first, "schedule-ended" after the last. */
  state: "active" | "before-start" | "schedule-ended";
}

export function currentSeason(schedule: readonly SeasonSlot[], nowMs: number): CurrentSeason {
  const hit = schedule.find((slot) => nowMs >= slot.startMs && nowMs < slot.endMs);
  if (hit) return { slot: hit, state: "active" };
  if (nowMs < schedule[0].startMs) return { slot: schedule[0], state: "before-start" };
  return { slot: schedule[schedule.length - 1], state: "schedule-ended" };
}

export interface SeasonProgress {
  /** 0 to 100, whole percent. */
  pct: number;
  /** 1-based week of the season, clamped to the season length. */
  weekNumber: number;
  weeksTotal: number;
  daysLeft: number;
}

export function seasonProgress(slot: SeasonSlot, nowMs: number): SeasonProgress {
  const total = slot.endMs - slot.startMs;
  const elapsed = Math.min(total, Math.max(0, nowMs - slot.startMs));
  const weekNumber = Math.min(slot.weeks, Math.floor(elapsed / (7 * MS_DAY)) + 1);
  const daysLeft = Math.max(0, Math.ceil((slot.endMs - nowMs) / MS_DAY));
  return { pct: total <= 0 ? 0 : Math.round((elapsed / total) * 100), weekNumber, weeksTotal: slot.weeks, daysLeft };
}

/** The Monday-to-Sunday week that contains `nowMs`. */
export function weekWindow(nowMs: number): TimeWindow {
  const start = weekStartMs(nowMs);
  return { start, end: addDays(start, 7) };
}

export function seasonWindow(slot: SeasonSlot): TimeWindow {
  return { start: slot.startMs, end: slot.endMs };
}

/** `null` means no limit (all time). */
export function windowFor(period: Period, nowMs: number, slot: SeasonSlot): TimeWindow | null {
  if (period === "week") return weekWindow(nowMs);
  if (period === "season") return seasonWindow(slot);
  return null;
}

export function inWindow(atMs: number, window: TimeWindow | null): boolean {
  if (Number.isNaN(atMs)) return false;
  if (!window) return true;
  return atMs >= window.start && atMs < window.end;
}

/**
 * True when the stored window no longer matches the window computed for "now": the week rolled over or the
 * Season changed. Used to explain "this board just reset" after the Preview date moves.
 */
export function windowRolledOver(previous: TimeWindow | null, next: TimeWindow | null): boolean {
  if (!previous || !next) return false;
  return previous.start !== next.start || previous.end !== next.end;
}
