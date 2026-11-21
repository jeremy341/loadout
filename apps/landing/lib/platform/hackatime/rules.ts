// Pure anti-gaming rules for synced Hackatime hours. No database and no clock: `now` is passed in. Every rule has a bun test.
// Flags never remove time on their own, except the cap and the overlap rule, which only count what they must. A flagged day is
// shown to reviewers.
//
// API:
//   DAILY_CAP_SECONDS = 57600 (16 h), HISTORY_DAYS = 120, MEDIAN_DAYS = 14, SPIKE_FACTOR = 3, SPIKE_MIN_SECONDS = 36000 (10 h)
//   MANUAL_REFRESH_MS = 10 minutes
//   dayKey(date) -> "YYYY-MM-DD" (UTC)            addDays(day, n) -> "YYYY-MM-DD"
//   median(values) -> number                      0 for an empty list
//   normaliseDays(rows, now, opts?) -> { rows: NormalisedDay[], flags: DayFlag[] }
//       rows: { day, name, seconds, projectId? } as the API returned them, projectId from HackatimeProject.projectId (null if unmapped)
//       1. drops rows that are not a YYYY-MM-DD day, older than HISTORY_DAYS, or in the future (UTC)
//       2. clamps negative or non-finite seconds to 0 and rounds; a repeated (day, name) keeps the largest value
//       3. overlap: two or more Hackatime projects mapped to the same LOADOUT project on one day count only the largest value
//          (flag "overlap"). Per-day totals do not carry intervals, so this is the safe stand-in for "one second counts once".
//       4. cap: the person's total for one day is at most opts.capSeconds (default DAILY_CAP_SECONDS), flag "capped"
//       5. spike: a day above SPIKE_MIN_SECONDS and above SPIKE_FACTOR x the median of the person's non-zero days in the
//          MEDIAN_DAYS before it is flagged "suspicious". The seconds still count; reviewers look at it.
//   canManualRefresh(lastSyncAt, now) -> { ok: true } | { ok: false, retryAt: Date }

export const DAILY_CAP_SECONDS = 57600;
export const HISTORY_DAYS = 120;
export const MEDIAN_DAYS = 14;
export const SPIKE_FACTOR = 3;
export const SPIKE_MIN_SECONDS = 36000;
export const MANUAL_REFRESH_MS = 10 * 60 * 1000;

export type DayRow = { day: string; name: string; seconds: number; projectId?: string | null };
export type NormalisedDay = { day: string; name: string; projectId: string | null; seconds: number };
export type DayFlag = { day: string; kind: "suspicious" | "capped" | "overlap"; seconds: number };

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86400 * 1000;

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

function isDay(value: unknown): value is string {
  return typeof value === "string" && DAY_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function cleanSeconds(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

export function normaliseDays(
  input: DayRow[],
  now: Date,
  opts: { capSeconds?: number } = {},
): { rows: NormalisedDay[]; flags: DayFlag[] } {
  const cap = opts.capSeconds ?? DAILY_CAP_SECONDS;
  const today = dayKey(now);
  const oldest = addDays(today, -HISTORY_DAYS);
  const flags: DayFlag[] = [];

  // 1 and 2: keep valid in-window rows, one per (day, name, project), with the largest value.
  const byKey = new Map<string, NormalisedDay>();
  for (const row of input) {
    if (!isDay(row.day) || typeof row.name !== "string" || row.day < oldest || row.day > today) continue;
    const projectId = row.projectId ?? null;
    const seconds = cleanSeconds(row.seconds);
    const key = `${row.day}\u0000${row.name}\u0000${projectId ?? ""}`;
    const prev = byKey.get(key);
    if (!prev || seconds > prev.seconds) byKey.set(key, { day: row.day, name: row.name, projectId, seconds });
  }
  const rows = [...byKey.values()];

  // 3: overlap. Within one day, Hackatime projects mapped to the same LOADOUT project keep only the largest value.
  const groups = new Map<string, NormalisedDay[]>();
  for (const row of rows) {
    if (row.projectId === null) continue;
    const key = `${row.day}\u0000${row.projectId}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  for (const [key, members] of groups) {
    if (members.length < 2) continue;
    const keep = members.reduce((best, r) => (r.seconds > best.seconds ? r : best));
    let dropped = 0;
    for (const member of members) {
      if (member === keep) continue;
      dropped += member.seconds;
      member.seconds = 0;
    }
    if (dropped > 0) flags.push({ day: key.split("\u0000")[0], kind: "overlap", seconds: dropped });
  }

  // 4: cap per day. Rows are walked in name order so the result does not depend on input order.
  const days = [...new Set(rows.map((r) => r.day))].sort();
  for (const day of days) {
    const dayRows = rows.filter((r) => r.day === day).sort((a, b) => a.name.localeCompare(b.name));
    const total = dayRows.reduce((sum, r) => sum + r.seconds, 0);
    if (total <= cap) continue;
    let remaining = cap;
    for (const r of dayRows) {
      const kept = Math.min(r.seconds, remaining);
      remaining -= kept;
      r.seconds = kept;
    }
    flags.push({ day, kind: "capped", seconds: total - cap });
  }

  // 5: spikes. Compare each day with the non-zero days in the window before it.
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.day, (totals.get(r.day) ?? 0) + r.seconds);
  for (const day of days) {
    const total = totals.get(day) ?? 0;
    if (total <= SPIKE_MIN_SECONDS) continue;
    const prior: number[] = [];
    for (let i = 1; i <= MEDIAN_DAYS; i++) {
      const prev = totals.get(addDays(day, -i));
      if (prev && prev > 0) prior.push(prev);
    }
    if (total > SPIKE_FACTOR * median(prior)) flags.push({ day, kind: "suspicious", seconds: total });
  }

  const out = rows
    .filter((r) => r.seconds > 0)
    .sort((a, b) => (a.day === b.day ? a.name.localeCompare(b.name) : a.day < b.day ? -1 : 1));
  return { rows: out, flags: flags.sort((a, b) => (a.day === b.day ? a.kind.localeCompare(b.kind) : a.day < b.day ? -1 : 1)) };
}

export function canManualRefresh(lastSyncAt: Date | null, now: Date): { ok: true } | { ok: false; retryAt: Date } {
  if (!lastSyncAt) return { ok: true };
  const retryAt = new Date(lastSyncAt.getTime() + MANUAL_REFRESH_MS);
  return now.getTime() >= retryAt.getTime() ? { ok: true } : { ok: false, retryAt };
}
