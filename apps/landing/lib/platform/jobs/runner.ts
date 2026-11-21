// The job runner: the one place that turns "a request to run a job" into JobRun rows. Both callers — the cron route
// (app/api/cron/[job]) and the manual wrapper (scripts/run-job.ts) — go through runJob, so the record is the same
// whichever way a job started.
//
// The rules, per the JobRun table comment (prisma/schema.prisma, "Scheduled work"):
//   - inserts a row with status "running" before the job starts, then finishes that row with "ok" or "error". Only
//     the row this run created is ever written again; the runner never edits or deletes another run's rows.
//   - refuses to start while a "running" row of the same job started less than LOCK_MINUTES ago (lock.ts). A dead
//     process leaves a "running" row behind on purpose — the lock waits it out instead of clearing it, so the rows
//     stay an honest log (who ran, when, for how long).
//   - an error row keeps the Error name only, never the message: a message can carry database detail.
//
// API:
//   type JobRunResult                ok | error | locked | unknown-job
//   runJob(name, trigger, now?)      checks the lock, records the run, executes the registry function
import type { Prisma } from "../../generated/prisma/client";
import { db } from "../db";
import { holdsLock, lockReleaseAt } from "./lock";
import { isJobName, JOBS, type JobName } from "./registry";

export type JobRunResult =
  | { code: "ok"; job: JobName; detail: Prisma.InputJsonValue }
  | { code: "error"; job: JobName; errorName: string }
  | { code: "locked"; job: JobName; releaseAt: Date }
  | { code: "unknown-job" };

// Every "running" row of this job is examined, not edited: one still inside the lock window means a run is in
// progress (or its process died holding it), so a fresh start is refused.
export async function recentRunningRows(job: string): Promise<Date[]> {
  const rows = await db().jobRun.findMany({
    where: { job, status: "running" },
    select: { startedAt: true },
    orderBy: { startedAt: "desc" },
  });
  return rows.map((row) => row.startedAt);
}

export async function runJob(
  name: string,
  trigger: "cron" | "manual",
  now: Date = new Date(),
): Promise<JobRunResult> {
  if (!isJobName(name)) return { code: "unknown-job" };

  // The lock check and the insert used to be two statements, so two simultaneous requests could both see no active run and
  // both execute the job. An advisory lock serializes the decision per job; the started rows stay an append-only log.
  const claimed = await db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`job:${name}`}))`;
    const rows = await tx.jobRun.findMany({ where: { job: name, status: "running" }, select: { startedAt: true }, orderBy: { startedAt: "desc" } });
    const running = rows.map((row) => row.startedAt);
    if (holdsLock(running.map((startedAt) => ({ startedAt })), now)) {
      return { locked: true, releaseAt: lockReleaseAt(running[0]) } as const;
    }
    const row = await tx.jobRun.create({ data: { job: name, trigger, status: "running" } });
    return { locked: false, row } as const;
  });
  if (claimed.locked) return { code: "locked", job: name, releaseAt: claimed.releaseAt };
  const run = claimed.row;
  try {
    const detail = await JOBS[name].run(now);
    await db().jobRun.update({ where: { id: run.id }, data: { status: "ok", finishedAt: new Date(), detail } });
    return { code: "ok", job: name, detail };
  } catch (e) {
    const errorName = (e as Error)?.name ?? "error";
    await db().jobRun.update({
      where: { id: run.id },
      data: { status: "error", finishedAt: new Date(), detail: { error: errorName } },
    });
    return { code: "error", job: name, errorName };
  }
}
