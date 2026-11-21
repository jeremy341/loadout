import { describe, expect, test } from "bun:test";
import { createRateLimiter, createSeenSet, describeSlackError, retryDelayMs, toFailure } from "./pure";

describe("toFailure", () => {
  test("marks only the three spec codes as final", () => {
    expect(toFailure("user_not_found")).toEqual({ ok: false, code: "user_not_found", final: true });
    expect(toFailure("cannot_dm_bot").final).toBe(true);
    expect(toFailure("channel_not_found").final).toBe(true);
    expect(toFailure("ratelimited").final).toBe(false);
    expect(toFailure("internal_error").final).toBe(false);
  });
});

describe("describeSlackError", () => {
  test("maps a platform error to its Slack code", () => {
    expect(describeSlackError({ code: "slack_webapi_platform_error", data: { error: "user_not_found" } })).toEqual({
      code: "user_not_found",
    });
  });

  test("reads Retry-After on a rate limit", () => {
    expect(describeSlackError({ code: "slack_webapi_rate_limited_error", retryAfter: 7 })).toEqual({
      code: "ratelimited",
      retryAfterSec: 7,
    });
    expect(describeSlackError({ code: "slack_webapi_rate_limited_error" })).toEqual({ code: "ratelimited", retryAfterSec: 1 });
  });

  test("falls back to unknown for anything else", () => {
    expect(describeSlackError(new Error("boom"))).toEqual({ code: "unknown" });
    expect(describeSlackError("string")).toEqual({ code: "unknown" });
    expect(describeSlackError({ code: "slack_webapi_platform_error", data: { error: "Bad Thing!" } })).toEqual({
      code: "unknown",
    });
  });
});

describe("retryDelayMs", () => {
  test("honours Retry-After and otherwise backs off, capped at 30 s", () => {
    expect(retryDelayMs(0, 3)).toBe(3000);
    expect(retryDelayMs(0)).toBe(1000);
    expect(retryDelayMs(1)).toBe(2000);
    expect(retryDelayMs(2)).toBe(4000);
    expect(retryDelayMs(0, 600)).toBe(30_000);
  });
});

describe("createRateLimiter", () => {
  function fakeClock() {
    let t = 0;
    return {
      now: () => t,
      sleep: async (ms: number) => {
        t += ms;
      },
      advance: (ms: number) => {
        t += ms;
      },
      get value() {
        return t;
      },
    };
  }

  test("spaces messages to one channel by the interval", async () => {
    const clock = fakeClock();
    const limiter = createRateLimiter({ intervalMs: 1000, now: clock.now, sleep: clock.sleep });
    await limiter.acquire("C0000000001");
    expect(clock.value).toBe(0);
    await limiter.acquire("C0000000001");
    expect(clock.value).toBe(1000);
    await limiter.acquire("C0000000001");
    expect(clock.value).toBe(2000);
  });

  test("keys are independent", async () => {
    const clock = fakeClock();
    const limiter = createRateLimiter({ intervalMs: 1000, now: clock.now, sleep: clock.sleep });
    await limiter.acquire("C0000000001");
    await limiter.acquire("C0000000002");
    expect(clock.value).toBe(0);
  });

  test("a quiet channel does not wait", async () => {
    const clock = fakeClock();
    const limiter = createRateLimiter({ intervalMs: 1000, now: clock.now, sleep: clock.sleep });
    await limiter.acquire("C0000000001");
    clock.advance(5000);
    await limiter.acquire("C0000000001");
    expect(clock.value).toBe(5000);
  });
});

describe("createSeenSet", () => {
  test("reports repeats and forgets the oldest past the limit", () => {
    const seen = createSeenSet(2);
    expect(seen.add("Ev1")).toBe(true);
    expect(seen.add("Ev1")).toBe(false);
    expect(seen.add("Ev2")).toBe(true);
    expect(seen.add("Ev3")).toBe(true);
    // Ev1 fell out of the window, so it counts as new again.
    expect(seen.add("Ev1")).toBe(true);
    expect(seen.add("Ev3")).toBe(false);
  });
});
