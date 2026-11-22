import { describe, expect, test } from "bun:test";
import { ageOn, eligibilityMessage, eligibilityState, isUnder19 } from "./eligibility";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe("ageOn", () => {
  test("counts whole years", () => {
    expect(ageOn(d("2010-06-15"), d("2026-06-14"))).toBe(15);
    expect(ageOn(d("2010-06-15"), d("2026-06-15"))).toBe(16);
  });
  test("leap day births turn a year older on 1 March in common years", () => {
    expect(ageOn(d("2008-02-29"), d("2026-02-28"))).toBe(17);
    expect(ageOn(d("2008-02-29"), d("2026-03-01"))).toBe(18);
    expect(ageOn(d("2008-02-29"), d("2028-02-29"))).toBe(20);
  });
  test("a future birthday is negative", () => {
    expect(ageOn(d("2030-01-01"), d("2026-11-16"))).toBeLessThan(0);
  });
});

describe("isUnder19", () => {
  test("the day before the 19th birthday is under, the day itself is not", () => {
    expect(isUnder19(d("2007-11-17"), d("2026-11-16"))).toBe(true);
    expect(isUnder19(d("2007-11-16"), d("2026-11-16"))).toBe(false);
  });
  test("a future birthday is not under 19", () => {
    expect(isUnder19(d("2030-01-01"), d("2026-11-16"))).toBe(false);
  });
});

describe("eligibilityState", () => {
  test("ok when Hack Club Auth reports verified; the birthday is not checked", () => {
    expect(eligibilityState({ verificationStatus: "verified" })).toBe("ok");
  });
  test("unverified for pending, needs_submission, empty, unknown or missing text", () => {
    for (const status of ["pending", "needs_submission", "", null, undefined, "ineligible", "VERIFIED-ish"]) {
      expect(eligibilityState({ verificationStatus: status })).toBe("unverified");
    }
  });
  test("verified status is case and whitespace tolerant", () => {
    expect(eligibilityState({ verificationStatus: "  Verified " })).toBe("ok");
  });
  test("messages are plain and carry no dashes", () => {
    for (const s of ["ok", "unverified"] as const) {
      expect(eligibilityMessage(s)).not.toMatch(/[–—]| - /);
    }
  });
});
