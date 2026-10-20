// Soft rate limits (Draft preview rule, see rules.ts). The check is made from the saved timestamps of your own
// items, so it needs no extra storage and survives a reload.

export interface RateLimit {
  max: number;
  windowMs: number;
}

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export interface RateResult {
  allowed: boolean;
  /** Whole minutes until the oldest counted item leaves the window; 0 when allowed. */
  retryInMinutes: number;
}

export function checkRate(timestamps: string[], nowMs: number, limit: RateLimit): RateResult {
  const recent = timestamps
    .map((t) => Date.parse(t))
    .filter((t) => Number.isFinite(t) && t > nowMs - limit.windowMs && t <= nowMs)
    .sort((a, b) => a - b);
  if (recent.length < limit.max) return { allowed: true, retryInMinutes: 0 };
  // The slot that frees first is the one `max` places from the newest.
  const frees = recent[recent.length - limit.max] + limit.windowMs;
  return { allowed: false, retryInMinutes: Math.max(1, Math.ceil((frees - nowMs) / 60000)) };
}

export function describeWait(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
