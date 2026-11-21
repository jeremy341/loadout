// Writes today's StatSnapshot rows (overview, tracks, leaderboard-week, leaderboard-all). Safe to run twice a day: rows are replaced.
// The logic lives in lib/platform/jobs/jobs/stats-snapshot.ts, shared with the daily cron endpoint, so this manual run also
// goes through the job runner and leaves a JobRun row (same 10-minute lock as the schedule). Prints counts only: never a
// handle, a person id or a total for one person.
// Run from apps/landing: bun run scripts/snapshot-stats.ts   (needs DATABASE_URL)
import { db } from "../lib/platform/db";
import { runJob } from "../lib/platform/jobs/runner";

async function main(): Promise<void> {
  const result = await runJob("stats-snapshot", "manual");
  if (result.code === "ok") {
    const d = result.detail as { day: string; counts: Record<string, number> };
    console.log(
      `Stats snapshot ${d.day}: overview ${d.counts.overview}, tracks ${d.counts.tracks}, ` +
        `leaderboard-week ${d.counts["leaderboard-week"]}, leaderboard-all ${d.counts["leaderboard-all"]}.`,
    );
  } else if (result.code === "error") {
    // The error message can carry database detail, so only the error name is printed.
    console.error(`Stats snapshot stopped: ${result.errorName}`);
  } else if (result.code === "locked") {
    console.log(`Stats snapshot is locked by a recent run. Try again at ${result.releaseAt.toISOString()}.`);
  } else {
    console.error("Unknown job. Run `bun run scripts/run-job.ts` with no arguments to list them.");
  }
  await db().$disconnect();
  if (result.code !== "ok") process.exitCode = 1;
}

main().catch(async (e: unknown) => {
  // The error message can carry database detail, so only the error name is printed.
  console.error(`Stats snapshot stopped: ${(e as Error)?.name ?? "error"}`);
  await db().$disconnect().catch(() => undefined);
  process.exitCode = 1;
});
