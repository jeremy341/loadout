// Pure rules for the bot's jobs (reminders, countdowns and polls that must run later). No database; every function has a bun test
// (jobs.test.ts). The database wrappers are in jobs-data.ts.
//
// API:
//   JOB_KINDS, JobKind, isJobKind(raw)
//   JOB_MAX_PENDING: reminder 20, countdown 5, poll 5 (per owner; the poll limit is not in the spec, so it matches countdowns)
//   RUN_AT_MIN_MS = 1000, RUN_AT_MAX_MS = 86400000 (a job runs between one second and 24 hours ahead)
//   checkRunAt(raw, now) -> Check<Date>
//   checkPayload(raw) -> Check<Record<string, unknown>>     a plain object of at most 2000 characters once encoded
//   hasRoom(kind, pending) -> boolean
import type { Check } from "./auth";

export const JOB_KINDS = ["reminder", "countdown", "poll"] as const;
export type JobKind = (typeof JOB_KINDS)[number];
export const JOB_MAX_PENDING: Record<JobKind, number> = { reminder: 20, countdown: 5, poll: 5 };
export const RUN_AT_MIN_MS = 1000;
export const RUN_AT_MAX_MS = 86_400_000;
export const PAYLOAD_MAX_CHARS = 2000;

export function isJobKind(raw: unknown): raw is JobKind {
  return JOB_KINDS.includes(raw as JobKind);
}

export function checkRunAt(raw: unknown, now: Date): Check<Date> {
  if (typeof raw !== "string") return { ok: false, message: "runAt must be an ISO time" };
  const time = Date.parse(raw);
  if (Number.isNaN(time)) return { ok: false, message: "runAt must be an ISO time" };
  const ahead = time - now.getTime();
  if (ahead < RUN_AT_MIN_MS || ahead > RUN_AT_MAX_MS) return { ok: false, message: "runAt must be between 1 second and 24 hours ahead" };
  return { ok: true, value: new Date(time) };
}

export function checkPayload(raw: unknown): Check<Record<string, unknown>> {
  if (raw === undefined) return { ok: true, value: {} };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, message: "payload must be a JSON object" };
  if (JSON.stringify(raw).length > PAYLOAD_MAX_CHARS) return { ok: false, message: `payload must be at most ${PAYLOAD_MAX_CHARS} characters` };
  return { ok: true, value: raw as Record<string, unknown> };
}

export function hasRoom(kind: JobKind, pending: number): boolean {
  return pending < JOB_MAX_PENDING[kind];
}
