// Pure Slack helpers with no I/O: the per-key rate limiter, Slack error mapping, retry delays and the event de-dupe set.
// API: createRateLimiter({ intervalMs, now, sleep }).acquire(key); describeSlackError(err) -> { code, retryAfterSec? };
// toFailure(code) -> { ok: false, code, final }; retryDelayMs(attempt, retryAfterSec?); createSeenSet(limit).add(id) -> isNew.
export type Failure = { ok: false; code: string; final: boolean };

// These codes mean the message can never be delivered, so the outbox must not retry them.
const FINAL_CODES = new Set(["user_not_found", "cannot_dm_bot", "channel_not_found"]);
const SHORT_CODE = /^[a-z_]{1,60}$/;
const MAX_DELAY_MS = 30_000;

export function toFailure(code: string): Failure {
  return { ok: false, code, final: FINAL_CODES.has(code) };
}

// Maps a thrown @slack/web-api error to a short code. Rate limits carry Retry-After in seconds.
export function describeSlackError(err: unknown): { code: string; retryAfterSec?: number } {
  if (typeof err !== "object" || err === null) return { code: "unknown" };
  const e = err as { code?: unknown; data?: unknown; retryAfter?: unknown };
  if (e.code === "slack_webapi_rate_limited_error") {
    return { code: "ratelimited", retryAfterSec: typeof e.retryAfter === "number" ? e.retryAfter : 1 };
  }
  if (e.code === "slack_webapi_platform_error") {
    const data = e.data as { error?: unknown } | undefined;
    if (data && typeof data.error === "string") {
      if (data.error === "ratelimited") {
        return { code: "ratelimited", retryAfterSec: typeof e.retryAfter === "number" ? e.retryAfter : 1 };
      }
      if (SHORT_CODE.test(data.error)) return { code: data.error };
    }
  }
  return { code: "unknown" };
}

// Honours Retry-After when Slack gave one, otherwise backs off 1 s, 2 s, 4 s. Capped at 30 s.
export function retryDelayMs(attempt: number, retryAfterSec?: number): number {
  const ms = retryAfterSec !== undefined ? retryAfterSec * 1000 : 1000 * 2 ** attempt;
  return Math.min(Math.max(ms, 0), MAX_DELAY_MS);
}

// One slot per key every intervalMs (1 message per second per channel). Slots are reserved synchronously,
// so concurrent callers queue in order.
export function createRateLimiter(opts: { intervalMs: number; now: () => number; sleep: (ms: number) => Promise<void> }) {
  const nextFree = new Map<string, number>();
  return {
    async acquire(key: string): Promise<void> {
      const t = opts.now();
      const slot = Math.max(t, nextFree.get(key) ?? t);
      nextFree.set(key, slot + opts.intervalMs);
      if (nextFree.size > 5000) {
        for (const [k, v] of nextFree) if (v <= t) nextFree.delete(k);
      }
      if (slot > t) await opts.sleep(slot - t);
    },
  };
}

// Remembers the last `limit` event ids. add() returns false for an id seen before (a Slack retry).
export function createSeenSet(limit: number) {
  const order: string[] = [];
  const seen = new Set<string>();
  return {
    add(id: string): boolean {
      if (seen.has(id)) return false;
      seen.add(id);
      order.push(id);
      if (order.length > limit) {
        const old = order.shift();
        if (old !== undefined) seen.delete(old);
      }
      return true;
    },
  };
}
