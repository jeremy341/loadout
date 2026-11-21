// The concurrency lock for scheduled jobs, as pure rules (no database, no clock: `now` is passed in). The database
// half lives in runner.ts, which examines JobRun rows and never edits or deletes them: a crashed run leaves a
// "running" row behind on purpose, and the lock simply waits it out rather than reaching for the row.
//
// Design: a JobRun that is still "running" and started less than LOCK_MINUTES ago means either a run is genuinely in
// progress, or the process died and took the row's finish with it. Which one it is cannot be told from the rows, so
// the lock treats both the same and refuses to start rather than leave two runs interleaving writes. Once the window
// has passed a stale row is ignored, so a dead run can never wedge a job forever (intent: 10 minutes, the same head
// room the Hackatime manual refresh gives one person).
//
// API:
//   LOCK_MINUTES = 10, LOCK_MS
//   lockHolds(startedAt, now)        true while the run is still inside the lock window (a future start holds too)
//   lockReleaseAt(startedAt)         when the window closes, for a Retry-After style answer
//   holdsLock(runs, now)            true if any "running" row in `runs` holds the lock
export const LOCK_MINUTES = 10;
export const LOCK_MS = LOCK_MINUTES * 60_000;

export function lockHolds(startedAt: Date, now: Date): boolean {
  return now.getTime() - startedAt.getTime() < LOCK_MS;
}

export function lockReleaseAt(startedAt: Date): Date {
  return new Date(startedAt.getTime() + LOCK_MS);
}

export function holdsLock(runs: ReadonlyArray<{ startedAt: Date }>, now: Date): boolean {
  return runs.some((run) => lockHolds(run.startedAt, now));
}
