import { describe, expect, test } from "bun:test";
import {
  ageExceptionFromRow,
  canCancelErasure,
  checkAgeExceptionDraft,
  checkPayoutAmount,
  checkSelfReviewGrant,
  erasureScheduledFor,
  ERASURE_DELAY_MS,
  hasAcknowledged,
  highestGuidelinesVersion,
  isErasureDue,
  isSelfReviewActive,
  payoutCents,
  payoutCountsByReviewer,
  reviewerPayoutTotals,
  sampleFallbackAllowed,
  validShipCounts,
} from "./records-data";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-11-18T12:00:00Z");

describe("sample fallback", () => {
  test("only in development with an empty table", () => {
    expect(sampleFallbackAllowed({ nodeEnv: "development", rowCount: 0 })).toBe(true);
    expect(sampleFallbackAllowed({ nodeEnv: "development", rowCount: 3 })).toBe(false);
    expect(sampleFallbackAllowed({ nodeEnv: "production", rowCount: 0 })).toBe(false);
    expect(sampleFallbackAllowed({ nodeEnv: undefined, rowCount: 0 })).toBe(false);
  });
});

describe("review payouts", () => {
  test("amounts are whole Ore above zero", () => {
    expect(checkPayoutAmount(10).ok).toBe(true);
    expect(checkPayoutAmount(0).ok).toBe(false);
    expect(checkPayoutAmount(-5).ok).toBe(false);
    expect(checkPayoutAmount(2.5).ok).toBe(false);
    expect(checkPayoutAmount("10").ok).toBe(false);
  });

  test("USD comes from the Ore total at 4.35 per ten Ore, converted once", () => {
    expect(payoutCents(10)).toBe(435);
    expect(payoutCents(1)).toBe(44); // 43.5 cents, rounded once
    expect(payoutCents(100)).toBe(4350);
    // Three rows of 1 Ore sum to 3 Ore before conversion, not three rounded 44s.
    const totals = reviewerPayoutTotals([
      { reviewerId: "a", status: "paid", amountOre: 1 },
      { reviewerId: "a", status: "paid", amountOre: 1 },
      { reviewerId: "a", status: "paid", amountOre: 1 },
    ]);
    expect(totals.get("a")?.paidOre).toBe(3);
    expect(totals.get("a")?.paidUsdCents).toBe(payoutCents(3));
  });

  test("totals split paid and pending and ignore cancelled rows", () => {
    const totals = reviewerPayoutTotals([
      { reviewerId: "a", status: "paid", amountOre: 20 },
      { reviewerId: "a", status: "pending", amountOre: 5 },
      { reviewerId: "a", status: "cancelled", amountOre: 900 },
      { reviewerId: "b", status: "cancelled", amountOre: 900 },
    ]);
    expect(totals.get("a")).toEqual({ paidOre: 20, pendingOre: 5, paidUsdCents: payoutCents(20), pendingUsdCents: payoutCents(5) });
    expect(totals.has("b")).toBe(false);
  });
});

describe("guidelines acknowledgement", () => {
  test("each version is acknowledged on its own", () => {
    expect(hasAcknowledged(["1"], "1")).toBe(true);
    expect(hasAcknowledged(["1"], "2")).toBe(false);
    expect(hasAcknowledged([], "1")).toBe(false);
  });
});

describe("self-review exceptions", () => {
  const reason = "Solo ship, a second reviewer is not available.";
  test("an end time is required and there is no open-ended exception", () => {
    expect(checkSelfReviewGrant({ reason, expiresAt: null }, now).ok).toBe(false);
    expect(checkSelfReviewGrant({ reason, expiresAt: new Date("nope") }, now).ok).toBe(false);
  });
  test("the end time must be in the future", () => {
    expect(checkSelfReviewGrant({ reason, expiresAt: new Date(now.getTime() - 1) }, now).ok).toBe(false);
    expect(checkSelfReviewGrant({ reason, expiresAt: new Date(now.getTime() + DAY) }, now)).toEqual({ ok: true });
  });
  test("the reason uses the staff length rule", () => {
    expect(checkSelfReviewGrant({ reason: "short", expiresAt: new Date(now.getTime() + DAY) }, now).ok).toBe(false);
  });
  test("active only until the end time", () => {
    expect(isSelfReviewActive({ expiresAt: new Date(now.getTime() + 1) }, now)).toBe(true);
    expect(isSelfReviewActive({ expiresAt: now }, now)).toBe(false);
  });
});

describe("ships snapshot", () => {
  test("counts are a flat object of non-negative whole numbers", () => {
    expect(validShipCounts({ shipped: 12, reviewed: 0 })).toEqual({ shipped: 12, reviewed: 0 });
    expect(validShipCounts({ shipped: -1 })).toBeNull();
    expect(validShipCounts({ shipped: 1.5 })).toBeNull();
    expect(validShipCounts({ shipped: "3" })).toBeNull();
    expect(validShipCounts([])).toBeNull();
    expect(validShipCounts({})).toBeNull();
    expect(validShipCounts(null)).toBeNull();
  });
});

describe("erasure requests", () => {
  test("scheduled seven days after the request", () => {
    expect(ERASURE_DELAY_MS).toBe(7 * DAY);
    expect(erasureScheduledFor(now).getTime()).toBe(now.getTime() + 7 * DAY);
  });
  test("due once the scheduled time has passed while still requested", () => {
    const scheduledFor = erasureScheduledFor(now);
    expect(isErasureDue({ status: "requested", scheduledFor }, scheduledFor)).toBe(true);
    expect(isErasureDue({ status: "requested", scheduledFor }, new Date(scheduledFor.getTime() - 1))).toBe(false);
    expect(isErasureDue({ status: "cancelled", scheduledFor }, new Date(scheduledFor.getTime() + DAY))).toBe(false);
    expect(isErasureDue({ status: "done", scheduledFor }, new Date(scheduledFor.getTime() + DAY))).toBe(false);
  });
  test("cancel only while scheduled and not yet due", () => {
    const scheduledFor = erasureScheduledFor(now);
    expect(canCancelErasure({ status: "requested", scheduledFor }, new Date(now.getTime() + DAY))).toBe(true);
    expect(canCancelErasure({ status: "requested", scheduledFor }, scheduledFor)).toBe(false);
    expect(canCancelErasure({ status: "cancelled", scheduledFor }, now)).toBe(false);
  });
});

describe("age exceptions", () => {
  test("the row maps to the page shape, with the reason as the justification", () => {
    expect(ageExceptionFromRow({ id: "x", reason: "Turned 19 after shipping.", person: { handle: "ostler" } })).toEqual({
      id: "x",
      handle: "ostler",
      ship: "",
      justification: "Turned 19 after shipping.",
    });
    expect(ageExceptionFromRow({ id: "y", reason: "r", person: { handle: null } }).handle).toBe("");
  });
  test("a new exception needs a new handle and a long enough justification", () => {
    expect(checkAgeExceptionDraft("newhandle", "short", []).ok).toBe(false);
    expect(checkAgeExceptionDraft("ostler", "x".repeat(40), [{ handle: "ostler" }]).ok).toBe(false);
    expect(checkAgeExceptionDraft("@NewHandle", "x".repeat(40), [])).toEqual({ ok: true });
  });
  test("an exception for one project shows that project as its ship", () => {
    expect(ageExceptionFromRow({ id: "z", reason: "Turned 19 after shipping.", projectId: "cproj9", person: { handle: "ostler" } }).ship).toBe("cproj9");
  });
});

describe("guidelines version", () => {
  test("the highest whole-number version counts, so a later acknowledgement covers an earlier one", () => {
    expect(highestGuidelinesVersion([])).toBeNull();
    expect(highestGuidelinesVersion(["1"])).toBe(1);
    expect(highestGuidelinesVersion(["1", "3", "2"])).toBe(3);
  });

  test("text that is not a whole number is ignored", () => {
    expect(highestGuidelinesVersion(["abc", "", "-2", "1.5", " 2 "])).toBe(2);
  });
});

describe("payout counts", () => {
  test("paid and pending payouts are counted and summed per reviewer; cancelled ones count for nothing", () => {
    const counts = payoutCountsByReviewer([
      { reviewerId: "r1", status: "paid", amountOre: 40 },
      { reviewerId: "r1", status: "pending", amountOre: 10 },
      { reviewerId: "r1", status: "cancelled", amountOre: 999 },
      { reviewerId: "r2", status: "paid", amountOre: 5 },
    ]);
    expect(counts.get("r1")).toEqual({ paid: 1, pending: 1, paidOre: 40, pendingOre: 10 });
    expect(counts.get("r2")).toEqual({ paid: 1, pending: 0, paidOre: 5, pendingOre: 0 });
    expect(counts.has("r3")).toBe(false);
  });
});
