import { describe, expect, test } from "bun:test";
import { canQualify, canRecordReferral, qualifiedTitle, stepsFromFacts } from "./referral-rules";
import { qualifies } from "./referrals";

const fresh = { referredId: "new", referrerId: "old", referrerBanned: false, referredAlreadyReferred: false };

describe("canRecordReferral", () => {
  test("a new builder can be referred by another builder", () => {
    expect(canRecordReferral(fresh)).toEqual({ ok: true });
  });
  test("no self-referral", () => {
    const result = canRecordReferral({ ...fresh, referrerId: "new" });
    expect(!result.ok && result.code).toBe("self");
  });
  test("a banned referrer is not found", () => {
    const result = canRecordReferral({ ...fresh, referrerBanned: true });
    expect(!result.ok && result.code).toBe("not-found");
  });
  test("one referral per referred builder", () => {
    const result = canRecordReferral({ ...fresh, referredAlreadyReferred: true });
    expect(!result.ok && result.code).toBe("already");
  });
});

describe("canQualify", () => {
  test("qualifies once the referred builder has an approved ship", () => {
    expect(canQualify({ referredBanned: false, alreadyQualified: false, hasApprovedShip: true })).toEqual({ ok: true });
  });
  test("does not qualify before a ship is approved", () => {
    const result = canQualify({ referredBanned: false, alreadyQualified: false, hasApprovedShip: false });
    expect(!result.ok && result.code).toBe("not-shipped");
  });
  test("never counts twice, and never for a banned builder", () => {
    expect(canQualify({ referredBanned: false, alreadyQualified: true, hasApprovedShip: true }).ok).toBe(false);
    const banned = canQualify({ referredBanned: true, alreadyQualified: false, hasApprovedShip: true });
    expect(!banned.ok && banned.code).toBe("banned");
  });
});

describe("stepsFromFacts", () => {
  test("a new referral has only joined", () => {
    expect(stepsFromFacts({ verified: false, tracked: false, journaled: false, shipped: false })).toEqual(["joined"]);
  });
  test("a later step without an earlier one does not count", () => {
    expect(stepsFromFacts({ verified: false, tracked: true, journaled: true, shipped: true })).toEqual(["joined"]);
  });
  test("all facts give every step, and that qualifies", () => {
    const steps = stepsFromFacts({ verified: true, tracked: true, journaled: true, shipped: true });
    expect(steps).toEqual(["joined", "verified", "tracked", "journaled", "shipped"]);
    expect(qualifies(steps)).toBe(true);
  });
  test("a shipped flag alone with a gap before it does not qualify", () => {
    expect(qualifies(stepsFromFacts({ verified: true, tracked: false, journaled: false, shipped: true }))).toBe(false);
  });
});

describe("qualifiedTitle", () => {
  test("names the referred builder", () => {
    expect(qualifiedTitle("ada")).toBe("ada you referred earned a first approved ship");
    expect(qualifiedTitle(null)).toBe("A builder you referred earned a first approved ship");
  });
});
