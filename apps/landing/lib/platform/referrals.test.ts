import { describe, expect, test } from "bun:test";
import { nextStep, NO_REWARD_SENTENCE, qualifies, REFERRAL_LINK_SENTENCE, REFERRAL_STEPS, REFERRED_BUILDERS, referralStatus, referralTotals, stepsReached, type ReferralStepKey } from "./referrals";

const all = REFERRAL_STEPS.map((step) => step.key) as ReferralStepKey[];

describe("steps", () => {
  test("the order is join, verify, track, journal, first approved ship", () => {
    expect(all).toEqual(["joined", "verified", "tracked", "journaled", "shipped"]);
  });

  test("nothing finished is zero steps", () => {
    expect(stepsReached([])).toBe(0);
  });

  test("counts the steps finished in order", () => {
    expect(stepsReached(["joined"])).toBe(1);
    expect(stepsReached(["joined", "verified", "tracked"])).toBe(3);
  });

  test("a skipped step stops the count", () => {
    expect(stepsReached(["joined", "tracked", "journaled", "shipped"])).toBe(1);
    expect(stepsReached(["shipped"])).toBe(0);
  });

  test("order in the list does not matter, only which steps are present", () => {
    expect(stepsReached(["verified", "joined"])).toBe(2);
  });
});

describe("qualifying", () => {
  test("a referral counts only after the first approved ship", () => {
    expect(qualifies(all.slice(0, 4))).toBe(false);
    expect(qualifies(all)).toBe(true);
  });

  test("a ship without the work before it does not count", () => {
    expect(qualifies(["joined", "shipped"])).toBe(false);
  });

  test("the next step is the first one missing, and none after qualifying", () => {
    expect(nextStep([])?.key).toBe("joined");
    expect(nextStep(["joined", "verified"])?.key).toBe("tracked");
    expect(nextStep(all)).toBeNull();
  });

  test("status is waiting or qualified", () => {
    expect(referralStatus(["joined"])).toBe("waiting");
    expect(referralStatus(all)).toBe("qualified");
  });
});

describe("totals and the empty release", () => {
  test("counts referred, qualified and waiting builders", () => {
    const builders = [
      { handle: "a", completed: all },
      { handle: "b", completed: ["joined"] as ReferralStepKey[] },
      { handle: "c", completed: [] as ReferralStepKey[] },
    ];
    expect(referralTotals(builders)).toEqual({ referred: 3, qualified: 1, waiting: 2 });
  });

  test("this release has no referred builders", () => {
    expect(REFERRED_BUILDERS).toHaveLength(0);
    expect(referralTotals(REFERRED_BUILDERS)).toEqual({ referred: 0, qualified: 0, waiting: 0 });
  });

  test("no reward amount appears in the copy", () => {
    const text = [REFERRAL_LINK_SENTENCE, NO_REWARD_SENTENCE, ...REFERRAL_STEPS.flatMap((step) => [step.label, step.note])].join(" ");
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/[€$£]/);
  });
});
