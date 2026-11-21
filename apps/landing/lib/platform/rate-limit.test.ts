import { describe, expect, test } from "bun:test";
import { createRateLimiter, searchLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  test("allows up to the limit, then refuses with a retry time", () => {
    const l = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(l.check("a", 0).ok).toBe(true);
    expect(l.check("a", 100).ok).toBe(true);
    expect(l.check("a", 200).ok).toBe(true);
    const r = l.check("a", 300);
    expect(r).toEqual({ ok: false, retryAfterMs: 700 });
  });
  test("keys are independent", () => {
    const l = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(l.check("a", 0).ok).toBe(true);
    expect(l.check("b", 0).ok).toBe(true);
    expect(l.check("a", 1).ok).toBe(false);
  });
  test("the window slides", () => {
    const l = createRateLimiter({ limit: 2, windowMs: 1000 });
    l.check("a", 0);
    l.check("a", 500);
    expect(l.check("a", 900).ok).toBe(false);
    expect(l.check("a", 1000).ok).toBe(true);
    expect(l.check("a", 1100).ok).toBe(false);
  });
  test("refused calls are not counted", () => {
    const l = createRateLimiter({ limit: 1, windowMs: 1000 });
    l.check("a", 0);
    for (let t = 1; t < 900; t += 100) l.check("a", t);
    expect(l.check("a", 1000).ok).toBe(true);
  });
  test("reset clears everything", () => {
    const l = createRateLimiter({ limit: 1, windowMs: 1000 });
    l.check("a", 0);
    l.reset();
    expect(l.check("a", 1).ok).toBe(true);
  });
  test("many quiet keys are pruned", () => {
    const l = createRateLimiter({ limit: 1, windowMs: 10 });
    for (let i = 0; i < 5100; i++) l.check(`k${i}`, 0);
    expect(l.check("late", 1000).ok).toBe(true);
  });
  test("searchLimiter is 30 per 10 seconds", () => {
    searchLimiter.reset();
    for (let i = 0; i < 30; i++) expect(searchLimiter.check("v", 0).ok).toBe(true);
    expect(searchLimiter.check("v", 5000).ok).toBe(false);
    expect(searchLimiter.check("v", 10_000).ok).toBe(true);
    searchLimiter.reset();
  });
});
