// Pure text and sort rules for the Leaderboards page, kept out of the component so they can be tested.

import { formatDateUtc, isoWeekLabel } from "./dates";
import type { SortDir, SortKey } from "./ranking";
import type { Scope } from "./standings";
import type { Period, TimeWindow } from "./windows";

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

export const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "season", label: "This Season" },
  { id: "all", label: "All time" },
];

export const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "rank", label: "Rank", numeric: true },
  { key: "name", label: "Builder" },
  { key: "track", label: "Home track" },
  { key: "value", label: "Score", numeric: true },
];

/** Score sorts high to low first; every other column starts A to Z / low to high. */
export function defaultDir(key: SortKey): SortDir {
  return key === "value" ? "desc" : "asc";
}

/** Clicking the sorted column flips its direction; clicking another column starts at that column's default. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, dir: defaultDir(key) };
  return { key, dir: current.dir === "asc" ? "desc" : "asc" };
}

const DIR_WORD: Record<SortDir, "ascending" | "descending"> = { asc: "ascending", desc: "descending" };

/** "Sorted by builder, ascending." */
export function sortAnnouncement(key: SortKey, dir: SortDir): string {
  return `Sorted by ${COLUMNS.find((c) => c.key === key)?.label.toLowerCase()}, ${DIR_WORD[dir]}.`;
}

export function ariaSortValue(sort: SortState, key: SortKey): "ascending" | "descending" | undefined {
  return sort.key === key ? DIR_WORD[sort.dir] : undefined;
}

export interface WindowTextInput {
  usesPeriod: boolean;
  /** The period actually in force ("all" when the metric ignores periods). */
  period: Period;
  win: TimeWindow | null;
  seasonLabelText: string;
}

/** The sentence under the board filters saying which dates the board covers. */
export function windowText({ usesPeriod, period, win, seasonLabelText }: WindowTextInput): string {
  if (!usesPeriod) return "Levels are lifetime and never reset.";
  if (period === "all") return "All time since the preview began.";
  if (!win) return "";
  const prefix = period === "week" ? `Week ${isoWeekLabel(win.start)}, ` : `${seasonLabelText}, `;
  return `${prefix}${formatDateUtc(win.start)} to ${formatDateUtc(win.end - 1)} (UTC).`;
}

export interface BoardCaptionInput {
  metricLabel: string;
  scope: Scope;
  usesPeriod: boolean;
  period: Period;
  sort: SortState;
}

/** The accessible table caption. */
export function boardCaption({ metricLabel, scope, usesPeriod, period, sort }: BoardCaptionInput): string {
  const scopeLabel = scope === "all" ? "All tracks" : scope;
  const periodLabel = usesPeriod ? PERIODS.find((p) => p.id === period)?.label : "Lifetime";
  return `${metricLabel}, ${scopeLabel}, ${periodLabel}. ${sortAnnouncement(sort.key, sort.dir)}`;
}

export interface YourLineInput {
  hidden: boolean;
  youValue: number;
  unit: string;
  /** Your rank on this board, or null when you are not ranked. */
  rank: number | null;
  rowCount: number;
}

/** The hint under "Your position". */
export function yourLine({ hidden, youValue, unit, rank, rowCount }: YourLineInput, formatNumber: (n: number) => string): string {
  if (hidden) return `Hidden from boards. Your value is ${formatNumber(youValue)} ${unit.toLowerCase()}, visible only to you.`;
  if (rank !== null) return `Rank ${rank} of ${rowCount}.`;
  if (youValue > 0) return "Not ranked on this board (not in scope).";
  return "Not ranked yet. A board needs a value above zero.";
}
