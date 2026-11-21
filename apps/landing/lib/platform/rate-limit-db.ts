// Fixed-window rate limiter backed by the RateLimitHit table, so every process and every deploy shares the same counts.
// It replaces the in-memory limiter in rate-limit.ts for anything that must hold across instances (the /api/v1 routes).
// Each window is one row keyed by (key, windowStart); one atomic upsert increments it.
//
// Put the preset name in the key (for example "api-key:<id>:minute") so two presets never share a row.
//
// API:
//   RATE_LIMIT_PRESETS                       API_KEY_MINUTE, API_KEY_DAY, API_IP_MINUTE, EXPORT_DAY
//   windowStartFor(now, windowMs) -> Date    pure
//   decide(count, limit) -> { ok, remaining } pure
//   buildLimitResult({ count, limit, windowMs, now }) -> LimitResult   pure
//   rateLimitHeaders(result) -> Record<string, string>                 pure
//   checkLimit({ key, limit, windowMs, now? }) -> Promise<LimitResult>  database (one upsert)
//   cleanupExpired(now?) -> Promise<number>                             database (drops windows older than a day)
import { db } from "./db";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export type RateLimitPreset = { readonly limit: number; readonly windowMs: number };

export const RATE_LIMIT_PRESETS = Object.freeze({
  API_KEY_MINUTE: { limit: 60, windowMs: MINUTE_MS },
  API_KEY_DAY: { limit: 5000, windowMs: DAY_MS },
  API_IP_MINUTE: { limit: 20, windowMs: MINUTE_MS },
  EXPORT_DAY: { limit: 2, windowMs: DAY_MS },
} satisfies Record<string, RateLimitPreset>);

export type LimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  // When the current window ends.
  resetAt: Date;
  // Whole seconds until the window ends, at least 1. Used for X-RateLimit-Reset.
  resetSeconds: number;
  // Value for Retry-After: 0 while allowed, the seconds to wait once rejected.
  retryAfterSeconds: number;
};

// The start of the fixed window that contains `now`, aligned to the epoch so every process agrees.
export function windowStartFor(now: number | Date, windowMs: number): Date {
  const t = now instanceof Date ? now.getTime() : now;
  return new Date(Math.floor(t / windowMs) * windowMs);
}

// `count` is the hit count after this request (1 for the first). A request at the limit is still allowed.
export function decide(count: number, limit: number): { ok: boolean; remaining: number } {
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}

export function buildLimitResult(input: { count: number; limit: number; windowMs: number; now: number }): LimitResult {
  const windowStart = windowStartFor(input.now, input.windowMs);
  const resetAt = new Date(windowStart.getTime() + input.windowMs);
  const { ok, remaining } = decide(input.count, input.limit);
  const resetSeconds = Math.max(1, Math.ceil((resetAt.getTime() - input.now) / 1000));
  return {
    ok,
    limit: input.limit,
    remaining,
    resetAt,
    resetSeconds,
    retryAfterSeconds: ok ? 0 : resetSeconds,
  };
}

// Headers for every response; Retry-After only on a rejection (429).
export function rateLimitHeaders(result: LimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetSeconds),
  };
  if (!result.ok) headers["Retry-After"] = String(result.retryAfterSeconds);
  return headers;
}

// Counts one hit against `key` in the current window. A single INSERT ... ON CONFLICT keeps the count right under
// concurrent requests, so no read-then-write race.
export async function checkLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): Promise<LimitResult> {
  const now = input.now ?? Date.now();
  const windowStart = windowStartFor(now, input.windowMs);
  const rows = await db().$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimitHit" ("key", "windowStart", "count")
    VALUES (${input.key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimitHit"."count" + 1
    RETURNING "count"`;
  const count = Number(rows[0]?.count);
  if (!Number.isFinite(count)) throw new Error("rate limit upsert returned no count");
  return buildLimitResult({ count, limit: input.limit, windowMs: input.windowMs, now });
}

// Removes windows that ended more than one day ago. Run from a scheduled job; the table stays small without it.
export async function cleanupExpired(now: number = Date.now()): Promise<number> {
  const cutoff = new Date(now - DAY_MS);
  return db().$executeRaw`DELETE FROM "RateLimitHit" WHERE "windowStart" < ${cutoff}`;
}
