import { describe, expect, test } from "bun:test";
import { checkFundingRequest, fundingCapUsd } from "./funding";

describe("the funding request rule", () => {
  test("the cap is what the ship's Ore payout is worth at the internal rate", () => {
    expect(fundingCapUsd(10)).toBeCloseTo(4.35, 10);
    expect(fundingCapUsd(0)).toBe(0);
    expect(fundingCapUsd(-3)).toBe(0);
  });

  test("a saved request is whole Ore, rounded up, and never more than the payout", () => {
    expect(checkFundingRequest({ amount: "4.35", payoutOre: 10 })).toEqual({ ok: true, usd: 4.35, cents: 435, ore: 10 });
    // $0.44 is just over one Ore ($0.435), so it rounds up to two.
    const small = checkFundingRequest({ amount: "0.44", payoutOre: 10 });
    expect(small.ok && small.ore).toBe(2);
    expect(checkFundingRequest({ amount: "0.43", payoutOre: 10 })).toMatchObject({ ok: true, ore: 1 });
  });

  test("zero, negative, too many decimals and over the payout are refused", () => {
    expect(checkFundingRequest({ amount: "0", payoutOre: 10 })).toMatchObject({ ok: false, code: "bad_amount" });
    expect(checkFundingRequest({ amount: "-1", payoutOre: 10 }).ok).toBe(false);
    expect(checkFundingRequest({ amount: "1.234", payoutOre: 10 }).ok).toBe(false);
    expect(checkFundingRequest({ amount: "4.36", payoutOre: 10 })).toMatchObject({ ok: false, code: "bad_amount" });
    expect(checkFundingRequest({ amount: "5", payoutOre: 0 }).ok).toBe(false);
  });

  test("an amount that passes never costs more Ore than the payout", () => {
    for (let payout = 1; payout <= 60; payout += 1) {
      const cap = checkFundingRequest({ amount: fundingCapUsd(payout).toFixed(2), payoutOre: payout });
      if (cap.ok) expect(cap.ore).toBeLessThanOrEqual(payout);
    }
  });
});
