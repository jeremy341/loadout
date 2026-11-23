import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { clearReviewCheer, markReviewCheer, takeReviewCheer } from "./cheerFlag";

// A tiny sessionStorage, since bun has no DOM.
function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const g = globalThis as { sessionStorage?: unknown };
let saved: unknown;
beforeEach(() => {
  saved = g.sessionStorage;
  g.sessionStorage = fakeStorage();
});
afterEach(() => {
  g.sessionStorage = saved;
});

describe("review cheer flag", () => {
  test("is taken once, then gone", () => {
    markReviewCheer();
    expect(takeReviewCheer()).toBe(true);
    expect(takeReviewCheer()).toBe(false);
  });
  test("a cleared flag is not taken", () => {
    markReviewCheer();
    clearReviewCheer();
    expect(takeReviewCheer()).toBe(false);
  });
  test("a flag older than a minute is ignored", () => {
    markReviewCheer();
    expect(takeReviewCheer(Date.now() + 61_000)).toBe(false);
  });
  test("blocked storage never throws", () => {
    g.sessionStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    };
    expect(() => markReviewCheer()).not.toThrow();
    expect(() => clearReviewCheer()).not.toThrow();
    expect(takeReviewCheer()).toBe(false);
  });
});
