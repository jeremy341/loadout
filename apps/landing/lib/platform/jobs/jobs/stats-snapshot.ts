// stats-snapshot: the scheduled shape of scripts/snapshot-stats.ts. refreshStats (lib/platform/stats-data.ts)
// computes today's rows and upserts them — one row per day and kind, replaced rather than added, so a second run on
// the same day is safe and a repeated cron never double-counts. The summary carries the day and the per-kind row
// counts, the same numbers the manual script prints.
//
// Server only (uses the database and writes StatSnapshot rows).
import type { JobSummary } from "../registry";
import { refreshStats } from "../../stats-data";

export async function runStatsSnapshot(now: Date): Promise<JobSummary> {
  const { day, counts } = await refreshStats(now);
  return { day, counts: { ...counts } as Record<string, number> };
}
