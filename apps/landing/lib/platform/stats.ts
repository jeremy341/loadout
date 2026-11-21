// Pure rules for the daily StatSnapshot rows. No database; every function has a bun test (stats.test.ts). The database reads
// and the nightly write are in stats-data.ts and scripts/snapshot-stats.ts.
//
// Days are UTC "YYYY-MM-DD". Counts only in overview and tracks: no names, no handles. Only the leaderboards carry handles, and
// only for people who turned statsVisible on.
//
// API:
//   ACTIVE_BUILDER_DAYS 7, WEEK_DAYS 7, LEADERBOARD_SIZE 50 (served), LEADERBOARD_STORED 200 (kept in the snapshot so that
//   hidden people cannot leave the served list short)
//   SNAPSHOT_KINDS: overview | tracks | leaderboard-week | leaderboard-all
//   snapshotDay(now) -> "YYYY-MM-DD"
//   windowStartDay(day, days) -> "YYYY-MM-DD"            first day of a window that ends on `day`, inclusive
//   buildOverview({ totalBuilders, activeBuilders, hoursLogged (seconds), projectsShipped }) -> overview data
//   buildTracks(rows, tracks?) -> { track, hours, builders }[]      every track, in TRACKS order, zero filled
//   rankLeaderboard(rows, visibleHandles, limit) -> { rank, personId, handle, hours }[]
import { addDays } from "./hackatime/rules";
import { TRACKS } from "./progress";

export const ACTIVE_BUILDER_DAYS = 7;
export const WEEK_DAYS = 7;
export const LEADERBOARD_SIZE = 50;
export const LEADERBOARD_STORED = 200;

export const SNAPSHOT_KINDS = ["overview", "tracks", "leaderboard-week", "leaderboard-all"] as const;
export type SnapshotKind = (typeof SNAPSHOT_KINDS)[number];

export function snapshotDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function windowStartDay(day: string, days: number): string {
  return addDays(day, -(days - 1));
}

export type OverviewInput = {
  totalBuilders: number;
  activeBuilders: number;
  hoursLogged: number;
  projectsShipped: number;
};

export function buildOverview(input: OverviewInput) {
  return {
    totalBuilders: Math.max(0, Math.trunc(input.totalBuilders)),
    activeBuilders: Math.max(0, Math.trunc(input.activeBuilders)),
    // Logged hours in whole hours to two decimals; the raw total is seconds.
    hoursLogged: Math.round((Math.max(0, input.hoursLogged) / 3600) * 100) / 100,
    projectsShipped: Math.max(0, Math.trunc(input.projectsShipped)),
  };
}

export type TrackInput = { track: string; seconds: number; builders: number };

export function buildTracks(rows: readonly TrackInput[], tracks: readonly string[] = TRACKS) {
  return tracks.map((track) => {
    const row = rows.find((r) => r.track === track);
    return {
      track,
      hours: Math.round((Math.max(0, row?.seconds ?? 0) / 3600) * 100) / 100,
      builders: Math.max(0, Math.trunc(row?.builders ?? 0)),
    };
  });
}

export type LeaderRow = { personId: string; seconds: number };

// Keeps only people whose handle is in `visibleHandles` (a map from personId to the current handle), sorts by hours, ties by
// handle, and numbers them from 1. Ranking happens after the filter, so a hidden person never takes a place.
export function rankLeaderboard(
  rows: readonly LeaderRow[],
  visibleHandles: ReadonlyMap<string, string>,
  limit: number = LEADERBOARD_SIZE,
): { rank: number; personId: string; handle: string; hours: number }[] {
  const listed = rows
    .filter((row) => visibleHandles.has(row.personId) && row.seconds > 0)
    .map((row) => ({ personId: row.personId, handle: visibleHandles.get(row.personId) ?? "", seconds: row.seconds }))
    .sort((a, b) => b.seconds - a.seconds || (a.handle < b.handle ? -1 : a.handle > b.handle ? 1 : 0))
    .slice(0, Math.max(0, limit));
  return listed.map((row, index) => ({
    rank: index + 1,
    personId: row.personId,
    handle: row.handle,
    hours: Math.round((row.seconds / 3600) * 100) / 100,
  }));
}

export function countDistinct(ids: readonly string[]): number {
  return new Set(ids).size;
}
