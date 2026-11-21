// Small in-memory sliding-window rate limiter. Pure apart from the Map it owns; time is passed in so tests need no clock.
// One process only (a restart or another instance starts fresh), which is enough to stop a stuck search box hammering the server.
//
// API:
//   createRateLimiter({ limit, windowMs }) -> { check(key, now?) -> { ok: true } | { ok: false, retryAfterMs }, reset() }
//   searchLimiter   30 requests per 10 seconds per viewer, used by app/platform-search/route.ts
export type RateLimiter = {
  check(key: string, now?: number): { ok: true } | { ok: false; retryAfterMs: number };
  reset(): void;
};

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: Math.max(1, windowMs - (now - recent[0])) };
      }
      recent.push(now);
      hits.set(key, recent);
      // Keep the map small: drop keys that have gone quiet.
      if (hits.size > 5000) {
        for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      return { ok: true };
    },
    reset() {
      hits.clear();
    },
  };
}

const globalForLimit = globalThis as unknown as { loadoutSearchLimiter?: RateLimiter };
export const searchLimiter: RateLimiter = (globalForLimit.loadoutSearchLimiter ??= createRateLimiter({ limit: 30, windowMs: 10_000 }));
