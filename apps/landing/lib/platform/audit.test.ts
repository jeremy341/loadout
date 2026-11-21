import { describe, expect, test } from "bun:test";
import { checkReason, REASON_MAX, REASON_MIN } from "./audit";

describe("checkReason", () => {
  test("accepts a reason of the minimum length after trimming", () => {
    const result = checkReason(`  ${"x".repeat(REASON_MIN)}  `);
    expect(result).toEqual({ ok: true, reason: "x".repeat(REASON_MIN) });
  });

  test("rejects a short or blank reason", () => {
    expect(checkReason("too short").ok).toBe(false);
    expect(checkReason("   ").ok).toBe(false);
    expect(checkReason(undefined).ok).toBe(false);
  });

  test("rejects a reason over the maximum length", () => {
    expect(checkReason("x".repeat(REASON_MAX + 1)).ok).toBe(false);
    expect(checkReason("x".repeat(REASON_MAX)).ok).toBe(true);
  });
});
