// Syncs Hackatime hours for every linked, unbanned person. The logic lives in lib/platform/jobs/jobs/hackatime-sync.ts,
// shared with the hourly cron endpoint, so this manual run also goes through the job runner and leaves a JobRun row
// (same 10-minute lock as the schedule). Prints counts only: never a person id, Hackatime id or response body.
// Run from apps/landing: bun run scripts/sync-hackatime.ts   (needs DATABASE_URL; HACKATIME_API_TOKEN is optional)
import { db } from "../lib/platform/db";
import { runJob } from "../lib/platform/jobs/runner";

async function main(): Promise<void> {
  const result = await runJob("hackatime-sync", "manual");
  if (result.code === "unknown-job") {
    console.error("Unknown job. Run `bun run scripts/run-job.ts` with no arguments to list them.");
    await db().$disconnect();
    process.exitCode = 1;
    return;
  }
  if (result.code === "locked") {
    console.log(`Hackatime sync is locked by a recent run. Try again at ${result.releaseAt.toISOString()}.`);
    await db().$disconnect();
    process.exitCode = 1;
    return;
  }
  if (result.code === "error") {
    // The error message can carry database detail, so only the error name is printed.
    console.error(`Hackatime sync stopped: ${result.errorName}`);
    await db().$disconnect();
    process.exitCode = 1;
    return;
  }
  const d = result.detail as {
    linked: number;
    synced: number;
    failed: number;
    flagged: number;
    failures: Record<string, number>;
  };
  console.log(
    `Hackatime sync: ${d.linked} linked, ${d.synced} synced, ${d.failed} failed, ${d.flagged} days flagged for review.`,
  );
  for (const [code, count] of Object.entries(d.failures ?? {})) console.log(`  ${code}: ${count}`);
  await db().$disconnect();
  process.exitCode = d.failed > 0 ? 1 : 0;
}

main().catch(async (e: unknown) => {
  // The error message can carry database detail, so only the error name is printed.
  console.error(`Hackatime sync stopped: ${(e as Error)?.name ?? "error"}`);
  await db().$disconnect().catch(() => undefined);
  process.exitCode = 1;
});
