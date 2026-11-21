import { describe, expect, test } from "bun:test";
import {
  buildLimitResult,
  decide,
  RATE_LIMIT_PRESETS,
  rateLimitHeaders,
  windowStartFor,
} from "./rate-limit-db";

const MINUTE = 60_000;
const DAY = 86_400_000;
// A fake clock: 2026-11-18T10:00:00.000Z, aligned to the start of a minute and a day.
const T0 = Date.UTC(2026, 10, 18, 10, 0, 0);

describe("windowStartFor", () => {
  test("aligns to the start of the window containing now", () => {
    expect(windowStartFor(T0 + 30_500, MINUTE).getTime()).toBe(T0);
    expect(windowStartFor(T0 + MINUTE - 1, MINUTE).getTime()).toBe(T0);
    expect(windowStartFor(T0 + MINUTE, MINUTE).getTime()).toBe(T0 + MINUTE);
  });

  test("gives every process the same window for the same instant", () => {
    expect(windowStartFor(T0 + 5, DAY).getTime()).toBe(windowStartFor(new Date(T0 + 5), DAY).getTime());
  });

  test("accepts a Date", () => {
    expect(windowStartFor(new Date(T0 + 1000), MINUTE).getTime()).toBe(T0);
  });
});

describe("decide", () => {
  test("allows up to the limit and rejects after it", () => {
    expect(decide(1, 3)).toEqual({ ok: true, remaining: 2 });
    expect(decide(3, 3)).toEqual({ ok: true, remaining: 0 });
    expect(decide(4, 3)).toEqual({ ok: false, remaining: 0 });
  });

  test("never reports negative remaining", () => {
    expect(decide(100, 3).remaining).toBe(0);
  });
});

describe("buildLimitResult", () => {
  test("an allowed hit has a zero retry and the time left in the window", () => {
    const result = buildLimitResult({ count: 1, limit: 60, windowMs: MINUTE, now: T0 + 15_000 });
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(59);
    expect(result.resetAt.getTime()).toBe(T0 + MINUTE);
    expect(result.resetSeconds).toBe(45);
    expect(result.retryAfterSeconds).toBe(0);
  });

  test("a rejected hit reports the seconds until the window resets", () => {
    const result = buildLimitResult({ count: 61, limit: 60, windowMs: MINUTE, now: T0 + 15_000 });
    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBe(45);
  });

  test("the last allowed hit is still ok", () => {
    expect(buildLimitResult({ count: 60, limit: 60, windowMs: MINUTE, now: T0 }).ok).toBe(true);
  });

  test("rounds the reset up to whole seconds and never reports zero", () => {
    expect(buildLimitResult({ count: 1, limit: 5, windowMs: MINUTE, now: T0 + MINUTE - 1 }).resetSeconds).toBe(1);
    expect(buildLimitResult({ count: 1, limit: 5, windowMs: MINUTE, now: T0 + 100 }).resetSeconds).toBe(60);
  });

  test("a day window resets at the next UTC midnight", () => {
    const dayStart = windowStartFor(T0, DAY).getTime();
    const result = buildLimitResult({ count: 1, limit: 5000, windowMs: DAY, now: T0 });
    expect(result.resetAt.getTime()).toBe(dayStart + DAY);
    expect(result.resetSeconds).toBe(14 * 3600);
  });
});

describe("rateLimitHeaders", () => {
  test("an allowed response carries the three X-RateLimit headers and no Retry-After", () => {
    const headers = rateLimitHeaders(buildLimitResult({ count: 2, limit: 60, windowMs: MINUTE, now: T0 + 20_000 }));
    expect(headers).toEqual({
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": "58",
      "X-RateLimit-Reset": "40",
    });
    expect(headers["Retry-After"]).toBeUndefined();
  });

  test("a rejected response adds Retry-After", () => {
    const headers = rateLimitHeaders(buildLimitResult({ count: 3, limit: 2, windowMs: DAY, now: T0 }));
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["Retry-After"]).toBe(String(headers["X-RateLimit-Reset"]));
  });
});

describe("RATE_LIMIT_PRESETS", () => {
  test("match the documented limits", () => {
    expect(RATE_LIMIT_PRESETS.API_KEY_MINUTE).toEqual({ limit: 60, windowMs: MINUTE });
    expect(RATE_LIMIT_PRESETS.API_KEY_DAY).toEqual({ limit: 5000, windowMs: DAY });
    expect(RATE_LIMIT_PRESETS.API_IP_MINUTE).toEqual({ limit: 20, windowMs: MINUTE });
    expect(RATE_LIMIT_PRESETS.EXPORT_DAY).toEqual({ limit: 2, windowMs: DAY });
  });

  test("is frozen", () => {
    expect(Object.isFrozen(RATE_LIMIT_PRESETS)).toBe(true);
  });
});

describe("a sequence of hits on a fake clock", () => {
  test("counts through a window, then starts again in the next one", () => {
    const limit = 3;
    const results: boolean[] = [];
    // Hits at 0s, 1s, 2s, 3s in the first minute, then one in the next minute.
    const hits = [0, 1000, 2000, 3000, MINUTE + 1];
    const counts = new Map<number, number>();
    for (const at of hits) {
      const start = windowStartFor(T0 + at, MINUTE).getTime();
      const count = (counts.get(start) ?? 0) + 1;
      counts.set(start, count);
      results.push(buildLimitResult({ count, limit, windowMs: MINUTE, now: T0 + at }).ok);
    }
    expect(results).toEqual([true, true, true, false, true]);
  });
});
