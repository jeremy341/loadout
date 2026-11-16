// The pre-check state machine: a ship waits, runs, and ends passed, failed or timed out. Pure: time comes in as a number, never
// from a clock. A run that has been going for the timeout is timed out the next time anyone looks. Rewritten for LOADOUT; the
// idea follows Pixl's lib/precheck.ts.

export const PRECHECK_TIMEOUT_MS = 10 * 60 * 1000;

export type PreCheckState = "queued" | "running" | "passed" | "failed" | "timed-out";

export type PreCheckRun =
  | { state: "queued"; attempt: number; queuedAt: number }
  | { state: "running"; attempt: number; queuedAt: number; startedAt: number }
  | { state: "passed"; attempt: number; queuedAt: number; startedAt: number; endedAt: number }
  | { state: "failed"; attempt: number; queuedAt: number; startedAt: number; endedAt: number; reason: string }
  | { state: "timed-out"; attempt: number; queuedAt: number; startedAt: number; endedAt: number };

export type PreCheckEvent =
  | { type: "start"; at: number }
  | { type: "pass"; at: number }
  | { type: "fail"; at: number; reason: string }
  | { type: "tick"; at: number }
  | { type: "requeue"; at: number };

export function newPreCheck(queuedAt: number): PreCheckRun {
  return { state: "queued", attempt: 1, queuedAt };
}

export function isTerminal(run: Pick<PreCheckRun, "state">): boolean {
  return run.state === "passed" || run.state === "failed" || run.state === "timed-out";
}

export function expired(run: PreCheckRun, now: number, timeoutMs: number = PRECHECK_TIMEOUT_MS): boolean {
  return run.state === "running" && now - run.startedAt >= timeoutMs;
}

// The only way a run changes. An event that makes no sense in the current state returns the same run, so replaying events is safe.
// A pass or fail that arrives after the timeout has passed is too late and the run is timed out instead.
export function reducePreCheck(run: PreCheckRun, event: PreCheckEvent, timeoutMs: number = PRECHECK_TIMEOUT_MS): PreCheckRun {
  if (run.state === "running" && event.type !== "start" && event.type !== "requeue" && expired(run, event.at, timeoutMs)) {
    return { state: "timed-out", attempt: run.attempt, queuedAt: run.queuedAt, startedAt: run.startedAt, endedAt: run.startedAt + timeoutMs };
  }
  switch (run.state) {
    case "queued":
      return event.type === "start" ? { state: "running", attempt: run.attempt, queuedAt: run.queuedAt, startedAt: event.at } : run;
    case "running":
      if (event.type === "pass") return { state: "passed", attempt: run.attempt, queuedAt: run.queuedAt, startedAt: run.startedAt, endedAt: event.at };
      if (event.type === "fail") return { state: "failed", attempt: run.attempt, queuedAt: run.queuedAt, startedAt: run.startedAt, endedAt: event.at, reason: event.reason.slice(0, 200) };
      return run;
    case "failed":
    case "timed-out":
      return event.type === "requeue" ? { state: "queued", attempt: run.attempt + 1, queuedAt: event.at } : run;
    case "passed":
      return run;
  }
}

export const PRECHECK_LABELS: Record<PreCheckState, string> = { queued: "Queued", running: "Running", passed: "Passed", failed: "Failed", "timed-out": "Timed out" };

export type PreCheckView = {
  state: PreCheckState;
  label: string;
  sentence: string;
  // Whole seconds left before a running check times out, else null.
  secondsLeft: number | null;
  // True while the ship still counts as "in pre-check" for queue health.
  inPreCheck: boolean;
};

function span(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 90) return `${seconds}s`;
  return `${Math.round(seconds / 60)} min`;
}

export function preCheckView(run: PreCheckRun, now: number, timeoutMs: number = PRECHECK_TIMEOUT_MS): PreCheckView {
  // Read the clock into the run first, so a stale running check shows as timed out.
  const current = reducePreCheck(run, { type: "tick", at: now }, timeoutMs);
  const label = PRECHECK_LABELS[current.state];
  switch (current.state) {
    case "queued":
      return { state: "queued", label, sentence: `Waiting for a free slot, ${span(now - current.queuedAt)} so far. Attempt ${current.attempt}.`, secondsLeft: null, inPreCheck: true };
    case "running": {
      const left = Math.max(0, timeoutMs - (now - current.startedAt));
      return { state: "running", label, sentence: `Running for ${span(now - current.startedAt)}. It stops after ${span(timeoutMs)}.`, secondsLeft: Math.ceil(left / 1000), inPreCheck: true };
    }
    case "passed":
      return { state: "passed", label, sentence: `Passed after ${span(current.endedAt - current.startedAt)}.`, secondsLeft: null, inPreCheck: false };
    case "failed":
      return { state: "failed", label, sentence: `Failed after ${span(current.endedAt - current.startedAt)}. ${current.reason}`, secondsLeft: null, inPreCheck: false };
    case "timed-out":
      return { state: "timed-out", label, sentence: `Stopped after ${span(timeoutMs)} with no answer. Queue it again, or review without it.`, secondsLeft: null, inPreCheck: false };
  }
}

// Counts for the queue health strip. `now` makes a stale running check count as timed out.
export function preCheckCounts(runs: readonly PreCheckRun[], now: number, timeoutMs: number = PRECHECK_TIMEOUT_MS): Record<PreCheckState, number> {
  const counts: Record<PreCheckState, number> = { queued: 0, running: 0, passed: 0, failed: 0, "timed-out": 0 };
  for (const run of runs) counts[preCheckView(run, now, timeoutMs).state] += 1;
  return counts;
}

export function inPreCheckCount(runs: readonly PreCheckRun[], now: number, timeoutMs: number = PRECHECK_TIMEOUT_MS): number {
  const counts = preCheckCounts(runs, now, timeoutMs);
  return counts.queued + counts.running;
}

// The three steps a strip shows, with the one that is current.
export type PreCheckStep = { label: string; state: "done" | "current" | "upcoming" };
export function preCheckSteps(view: Pick<PreCheckView, "state">): PreCheckStep[] {
  const result = view.state === "queued" || view.state === "running" ? "Result" : PRECHECK_LABELS[view.state];
  return [
    { label: "Queued", state: view.state === "queued" ? "current" : "done" },
    { label: "Running", state: view.state === "queued" ? "upcoming" : view.state === "running" ? "current" : "done" },
    { label: result, state: view.state === "queued" || view.state === "running" ? "upcoming" : "current" },
  ];
}
