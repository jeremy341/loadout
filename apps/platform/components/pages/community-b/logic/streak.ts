// Weekly streak. Plans 02 and the future-platform proposal list "streaks" as a planned feature but do not
// define one, so this is a Draft preview rule (see DRAFT_RULES.streak in data.ts):
//
//   A streak is the number of consecutive ISO weeks (Monday to Sunday, UTC) that each contain at least one
//   qualifying action. A week that has not ended yet and has no action does not break the streak, but the
//   streak is flagged "at risk" because it ends if the week closes empty.

import { weekIndex, weekStartFromIndex, isoWeekLabel } from "./dates";

export interface StreakWeek {
  weekStartMs: number;
  label: string;
  done: boolean;
  isCurrent: boolean;
}

export interface StreakResult {
  current: number;
  longest: number;
  thisWeekDone: boolean;
  /** Current streak is alive only because this week is still open. */
  atRisk: boolean;
  /** Oldest to newest, ending with the current week. */
  recent: StreakWeek[];
}

/** Distinct week indexes that hold at least one action; invalid times and later weeks are skipped. */
function collectWeeks(actionTimes: readonly number[], nowWeek: number): Set<number> {
  const weeks = new Set<number>();
  for (const t of actionTimes) {
    if (Number.isNaN(t)) continue;
    const w = weekIndex(t);
    if (w <= nowWeek) weeks.add(w);
  }
  return weeks;
}

/** Consecutive weeks ending at the current week, or at the previous one while this week is still open and empty. */
function currentRun(weeks: ReadonlySet<number>, nowWeek: number): { current: number; viaPreviousWeek: boolean } {
  const viaPreviousWeek = !weeks.has(nowWeek) && weeks.has(nowWeek - 1);
  let cursor = viaPreviousWeek ? nowWeek - 1 : nowWeek;
  let current = 0;
  while (weeks.has(cursor)) {
    current += 1;
    cursor -= 1;
  }
  return { current, viaPreviousWeek };
}

/** Length of the longest run of consecutive week indexes. */
function longestRun(weeks: ReadonlySet<number>): number {
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of [...weeks].sort((a, b) => a - b)) {
    run = prev !== null && w === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = w;
  }
  return longest;
}

function recentWeeks(weeks: ReadonlySet<number>, nowWeek: number, recentCount: number): StreakWeek[] {
  const recent: StreakWeek[] = [];
  for (let i = recentCount - 1; i >= 0; i -= 1) {
    const w = nowWeek - i;
    const start = weekStartFromIndex(w);
    recent.push({ weekStartMs: start, label: isoWeekLabel(start), done: weeks.has(w), isCurrent: w === nowWeek });
  }
  return recent;
}

/**
 * @param actionTimes UTC milliseconds of each qualifying action. Actions in a later week than `nowMs` are ignored.
 * @param nowMs the Preview "now".
 * @param recentCount how many weeks (ending with the current one) to list in `recent`.
 */
export function computeStreak(actionTimes: readonly number[], nowMs: number, recentCount = 12): StreakResult {
  const nowWeek = weekIndex(nowMs);
  const weeks = collectWeeks(actionTimes, nowWeek);
  const { current, viaPreviousWeek } = currentRun(weeks, nowWeek);
  return {
    current,
    longest: longestRun(weeks),
    thisWeekDone: weeks.has(nowWeek),
    atRisk: viaPreviousWeek && current > 0,
    recent: recentWeeks(weeks, nowWeek, recentCount),
  };
}
