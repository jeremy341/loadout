// In-process timers for pending jobs (reminders, countdowns, polls). Jobs are persisted by the site; this only
// decides when to run them in this process.
// API: createScheduler({ run, timers, log }) -> { schedule(job), cancel(id), pending() }.
// Why: timers are injected so tests can run a job without waiting. Jobs are at most 24 h away, so one setTimeout
// per job is enough; a job whose time has passed (after a restart) runs at once.
import type { JobRow, Logger } from "../../types";

export type Timers = {
  now(): number;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
};

export const realTimers: Timers = {
  now: () => Date.now(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export type Scheduler = {
  schedule(job: JobRow): void;
  cancel(id: string): void;
  pending(): number;
};

export function createScheduler(opts: { run: (job: JobRow) => Promise<void>; timers: Timers; log: Logger }): Scheduler {
  const handles = new Map<string, unknown>();

  const schedule = (job: JobRow): void => {
    const existing = handles.get(job.id);
    if (existing !== undefined) opts.timers.clearTimer(existing);
    const due = Date.parse(job.runAt);
    const delay = Number.isNaN(due) ? 0 : Math.max(0, due - opts.timers.now());
    const handle = opts.timers.setTimer(() => {
      handles.delete(job.id);
      opts.run(job).catch((err: unknown) => {
        opts.log.error("job.failed", { kind: job.kind, id: job.id, error: err instanceof Error ? err.name : "unknown" });
      });
    }, delay);
    handles.set(job.id, handle);
  };

  return {
    schedule,
    cancel(id) {
      const handle = handles.get(id);
      if (handle !== undefined) opts.timers.clearTimer(handle);
      handles.delete(id);
    },
    pending: () => handles.size,
  };
}
