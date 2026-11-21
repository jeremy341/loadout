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
  const on = d("2026-11-16");
  test("ok for a verified builder under 19", () => {
    expect(eligibilityState({ birthday: d("2010-01-01"), verificationStatus: "verified", on })).toBe("ok");
  });
  test("too_old on the 19th birthday, even when verified", () => {
    expect(eligibilityState({ birthday: d("2007-11-16"), verificationStatus: "verified", on })).toBe("too_old");
  });
  test("too_young below 13, distinct from a missing birthday; 13 is the first eligible age", () => {
    expect(eligibilityState({ birthday: d("2014-11-17"), verificationStatus: "verified", on })).toBe("too_young");
    expect(eligibilityState({ birthday: d("2020-01-01"), verificationStatus: "verified", on })).toBe("too_young");
    // too_young wins over unverified: a child is refused before verification is asked for.
    expect(eligibilityState({ birthday: d("2018-01-01"), verificationStatus: "pending", on })).toBe("too_young");
    expect(eligibilityState({ birthday: d("2013-11-16"), verificationStatus: "verified", on })).toBe("ok");
    expect(eligibilityMessage("too_young")).toBe("LOADOUT is for ages 13 to 18.");
  });
  test("aged 19 or over stays too_old, never too_young", () => {
    expect(eligibilityState({ birthday: d("1990-05-05"), verificationStatus: "verified", on })).toBe("too_old");
  });
  test("missing birthday and future birthday both ask for the birthday", () => {
    expect(eligibilityState({ birthday: null, verificationStatus: "verified", on })).toBe("missing_birthday");
    expect(eligibilityState({ birthday: d("2030-01-01"), verificationStatus: "verified", on })).toBe("missing_birthday");
    expect(eligibilityState({ birthday: new Date("nope"), verificationStatus: "verified", on })).toBe("missing_birthday");
  });
  test("unverified for pending, needs_submission, empty or unknown text", () => {
    for (const status of ["pending", "needs_submission", "", null, "ineligible", "VERIFIED-ish"]) {
      expect(eligibilityState({ birthday: d("2010-01-01"), verificationStatus: status, on })).toBe("unverified");
    }
  });
  test("messages are plain and carry no dashes", () => {
    for (const s of ["ok", "too_young", "too_old", "missing_birthday", "unverified"] as const) {
      expect(eligibilityMessage(s)).not.toMatch(/[–—]| - /);
    }
  });
});
