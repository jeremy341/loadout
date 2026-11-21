// Runs one registered job by hand, the same way /api/cron/<job> runs it: the registry's function, with a JobRun row
// ("manual") written before and after, and under the same 10 minute lock — a run just started by cron is refused, and
// this run holds the lock for cron too. The answer JSON is printed as counts only: never a person id, a Hackatime id
// or a response body.
// Run from apps/landing: bun run scripts/run-job.ts <job>   (needs DATABASE_URL; the job list is lib/platform/jobs/registry.ts)
import { db } from "../lib/platform/db";
import { runJob } from "../lib/platform/jobs/runner";

async function main(): Promise<void> {
  const name = process.argv[2] ?? "";
  const result = await runJob(name, "manual");
  if (result.code === "ok") {
    console.log(`Job ${result.job} ok: ${JSON.stringify(result.detail)}`);
    process.exitCode = 0;
  } else if (result.code === "locked") {
    console.log(`Job ${result.job} is still inside its run lock; safe to try again at ${result.releaseAt.toISOString()}.`);
    process.exitCode = 1;
  } else if (result.code === "error") {
    // The Error name only, never the message: a message can carry database detail.
    console.error(`Job ${result.job} stopped: ${result.errorName}`);
    process.exitCode = 1;
  } else {
    console.error("Unknown job. The registered jobs are in lib/platform/jobs/registry.ts.");
    process.exitCode = 1;
  }
  await db().$disconnect();
}

main().catch(async (e: unknown) => {
  // The error message can carry database detail, so only the error name is printed.
  console.error(`Job run stopped: ${(e as Error)?.name ?? "error"}`);
  await db().$disconnect().catch(() => undefined);
  process.exitCode = 1;
});
