// Community Era advancement. Policy: plans/11-eras-and-community-progression.md ("Cadence and advancement").
//
//   - An Era starts on a weekly reset and lasts at least 14 days.
//   - The first eligible advancement check is the second weekly reset after it begins.
//   - Reaching the threshold earlier only sets ADVANCEMENT READY; the Era stays active until the check.
//   - Advancement needs BOTH the minimum duration and the threshold. If the threshold is unmet at the check the
//     Era stays active and advances at the next weekly reset after the threshold is met.
//   - Never advance on a timer alone, never shorten the minimum.
//
// What the plan leaves open is configuration here, not logic: the reset time zone (Draft: UTC), the points
// formula, each Era's threshold, and the Era sequence (the plan's sequence is "an example, not a launch order").
// Era Points come only from approved (shipped) project work, so only "ship approved" log entries add points.

import { MS_DAY, addDays } from "./dates";

export interface EraSpec {
  id: string;
  name: string;
  /** Sample community points already in the pool when the Era begins. Preview data only. */
  sampleBaseline: number;
  /** Draft threshold in Era Points. Not a program value. */
  threshold: number;
}

export interface EraConfig {
  /** A weekly reset (Draft: a Monday 00:00 UTC). */
  startMs: number;
  /** Plan 11: at least 14 days. */
  minDays: number;
  /** Plan 11: weekly reset cadence. */
  resetDays: number;
  specs: readonly EraSpec[];
}

export interface ShipEvent {
  atMs: number;
  points: number;
}

export type EraStatus = "completed" | "active" | "ready";

export interface EraState {
  index: number;
  spec: EraSpec;
  startMs: number;
  /** When the next Era began, or null while this one is current. */
  endMs: number | null;
  baseline: number;
  /** Era Points from your own logged ships inside this Era. */
  yourPoints: number;
  points: number;
  threshold: number;
  thresholdMet: boolean;
  /** Whole days since the Era began (current Era), or the length it ran (completed). */
  elapsedDays: number;
  minDurationMet: boolean;
  /** Date the minimum duration is met. */
  minDurationEndsMs: number;
  /** The next weekly reset at or after the minimum duration where an advancement check runs. Null for completed or final. */
  nextCheckMs: number | null;
  hasNext: boolean;
  status: EraStatus;
}

export interface EraSimulation {
  /** Completed Eras then the current one, oldest first. */
  eras: EraState[];
  current: EraState;
}

function pointsBetween(ships: readonly ShipEvent[], fromMs: number, toMs: number): number {
  let sum = 0;
  for (const ship of ships) if (ship.atMs >= fromMs && ship.atMs < toMs) sum += ship.points;
  return sum;
}

interface EraRun {
  config: EraConfig;
  ships: readonly ShipEvent[];
  nowMs: number;
}

/** Index (in resets after the start) of the first eligible check: never before the minimum duration. */
function firstCheckIndex(config: EraConfig): number {
  return Math.ceil(config.minDays / config.resetDays);
}

/**
 * The first weekly reset at or after the minimum duration, up to now, where the threshold is already met.
 * Null when there is no later Era or no such reset yet.
 */
function findAdvancementMs(run: EraRun, spec: EraSpec, startMs: number, hasNext: boolean): number | null {
  if (!hasNext) return null;
  const { config, ships, nowMs } = run;
  const resetMs = config.resetDays * MS_DAY;
  const minEnd = addDays(startMs, config.minDays);
  for (let k = firstCheckIndex(config); startMs + k * resetMs <= nowMs; k += 1) {
    const reset = startMs + k * resetMs;
    if (reset >= minEnd && spec.sampleBaseline + pointsBetween(ships, startMs, reset) >= spec.threshold) return reset;
  }
  return null;
}

/** The next weekly reset after now that is also at or after the minimum duration. */
function findNextCheckMs(config: EraConfig, startMs: number, nowMs: number): number {
  const resetMs = config.resetDays * MS_DAY;
  const minEnd = addDays(startMs, config.minDays);
  let k = firstCheckIndex(config);
  while (startMs + k * resetMs < minEnd || startMs + k * resetMs <= nowMs) k += 1;
  return startMs + k * resetMs;
}

function eraStatus(advancedAt: number | null, thresholdMet: boolean): EraStatus {
  if (advancedAt !== null) return "completed";
  return thresholdMet ? "ready" : "active";
}

/** One Era that began at `startMs`: its points, timing and, when it advanced, the reset it ended at. */
function buildEraState(run: EraRun, index: number, startMs: number): EraState {
  const { config, ships, nowMs } = run;
  const spec = config.specs[index];
  const hasNext = index + 1 < config.specs.length;
  const minEnd = addDays(startMs, config.minDays);
  const baseline = spec.sampleBaseline;
  const advancedAt = findAdvancementMs(run, spec, startMs, hasNext);

  const yourPoints = pointsBetween(ships, startMs, advancedAt ?? nowMs + 1);
  const points = baseline + yourPoints;
  const thresholdMet = points >= spec.threshold;
  const elapsedMs = Math.max(0, Math.min(nowMs, advancedAt ?? nowMs) - startMs);

  return {
    index,
    spec,
    startMs,
    endMs: advancedAt,
    baseline,
    yourPoints,
    points,
    threshold: spec.threshold,
    thresholdMet,
    elapsedDays: Math.floor(elapsedMs / MS_DAY),
    minDurationMet: nowMs >= minEnd && (advancedAt === null || advancedAt >= minEnd),
    minDurationEndsMs: minEnd,
    nextCheckMs: advancedAt === null && hasNext ? findNextCheckMs(config, startMs, nowMs) : null,
    hasNext,
    status: eraStatus(advancedAt, thresholdMet),
  };
}

/**
 * Replays the weekly resets from the first Era's start up to `nowMs`.
 * Ships dated before an Era began, or after `nowMs`, never count for it.
 */
export function simulateEras(config: EraConfig, ships: readonly ShipEvent[], nowMs: number): EraSimulation {
  const run: EraRun = { config, ships, nowMs };
  const states: EraState[] = [];
  let startMs = config.startMs;

  // Safety bound: the loop advances at most one Era per reset and a reset is a week.
  for (let index = 0; index < 2000; index += 1) {
    const state = buildEraState(run, index, startMs);
    states.push(state);
    if (state.endMs === null) return { eras: states, current: state };
    startMs = state.endMs;
  }
  return { eras: states, current: states[states.length - 1] };
}

/** 0 to 100 whole percent of the threshold, never above 100. */
export function eraProgressPct(state: Pick<EraState, "points" | "threshold">): number {
  if (state.threshold <= 0) return 0;
  return Math.min(100, Math.round((state.points / state.threshold) * 100));
}
