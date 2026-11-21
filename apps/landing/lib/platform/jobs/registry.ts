// The job registry: the list of scheduled jobs with a one-line description and the function that runs them. The cron
// route (app/api/cron/[job]) and the manual wrapper (scripts/run-job.ts) both dispatch through here, so a job added to
// JOBS is at once runnable by hand and schedulable in vercel.json — nothing else needs to know the names.
//
// Server only. The functions read and write through the platform modules (hackatime/data, stats-data, db); each returns
// a small JSON summary that the runner stores on the JobRun row. Summaries carry counts and fixed words only: never a
// person id, a handle, a Hackatime id or an upstream response body.
//
// API:
//   type JobName                          "hackatime-sync" | "stats-snapshot" | "queue-health" | "airbridge-preview" | "rate-limit-cleanup" | "session-cleanup"
//   type JobSummary                       a small JSON value for JobRun.detail
//   JOBS                                  the registry: name -> { description, run }
//   JOB_NAMES                             the names in registration order
//   isJobName(name)                       whether the route should look the name up at all
import { runAirbridgePreviewSync } from "../../reviewer/airbridge-preview";
import type { Prisma } from "../../generated/prisma/client";
import { runHackatimeSync } from "./jobs/hackatime-sync";
import { runQueueHealth } from "./jobs/queue-health";
import { runRateLimitCleanup } from "./jobs/rate-limit-cleanup";
import { runSessionCleanup } from "./jobs/session-cleanup";
import { runStatsSnapshot } from "./jobs/stats-snapshot";

export type JobSummary = Prisma.InputJsonValue;

export type JobDefinition = {
  // One line a staff member reads next to a JobRun row in a log; not shown to builders.
  description: string;
  // Runs the whole job once. `now` is passed in so the runner is reproducible and the job never reads the wall clock
  // itself. A run that dies mid-way leaves its "running" JobRun row behind — that is what the 10 minute lock absorbs.
  run: (now: Date) => Promise<JobSummary>;
};

export type JobName = "hackatime-sync" | "stats-snapshot" | "queue-health" | "airbridge-preview" | "rate-limit-cleanup" | "session-cleanup";

export const JOBS: Readonly<Record<JobName, JobDefinition>> = Object.freeze({
  "hackatime-sync": {
    description: "Syncs Hackatime hours for every linked, unbanned person, one at a time with a second between them.",
    run: runHackatimeSync,
  },
  "stats-snapshot": {
    description: "Writes today's StatSnapshot rows (overview, tracks, both leaderboards). Safe to run twice a day.",
    run: runStatsSnapshot,
  },
  "airbridge-preview": {
    description: "Refreshes cached Airbridge approval evidence for configured LOADOUT projects.",
    run: runAirbridgePreviewSync,
  },
  "queue-health": {
    description: "Counts the review-queue ships waiting too long and the failing or stuck BotOutbox rows. Reads only.",
    run: runQueueHealth,
  },
  "session-cleanup": {
    description: "Deletes Session rows whose expiry has passed. Safe to run often; reports only the number removed.",
    run: runSessionCleanup,
  },
  "rate-limit-cleanup": {
    description: "Drops RateLimitHit windows that ended more than a day ago. Reports only the number removed.",
    run: runRateLimitCleanup,
  },
});

export const JOB_NAMES: readonly JobName[] = Object.keys(JOBS) as JobName[];

export function isJobName(name: string): name is JobName {
  return Object.prototype.hasOwnProperty.call(JOBS, name);
}
