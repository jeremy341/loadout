import { describe, expect, it } from "bun:test";
import { hoursToOre, oreForMinutes } from "./ledger";
import { creditFor as reviewCreditFor, TRACK_XP_PER_HOUR, USD_PER_TEN_ORE } from "./review";
import {
  assignmentWindow,
  assignmentReminderDue,
  canConfirmBan,
  canGiveSecondPassVerdict,
  canHold,
  recordFraudTriage,
  canReleaseHold,
  canSecondPass,
  equipGateMet,
  EQUIP_GATE_MINUTES,
  goesToSecondPass,
  placeHold,
  tenthsOfHour,
  canReview,
  checkChangeNote,
  claimState,
  cleanSeconds,
  EVIDENCE_SECONDS_MAX,
  correctionDelta,
  creditFor,
  fundingSplit,
  journalDecision,
  keptTotal,
  pendingCredit,
  stageAllows,
  trackXpFor,
  turnedNineteenSinceShipping,
  UPDATE_MIN_MINUTES,
  updateMinimumMet,
  updateShipCredit,
  validateAuditSections,
  verdictEffect,
  waitStart,
} from "./review-rules";

const t = (iso: string) => new Date(iso);

describe("turnedNineteenSinceShipping", () => {
  const now = t("2026-12-15T00:00:00Z");
  it("flags a builder who was under 19 at shipping and is 19 now", () => {
    expect(turnedNineteenSinceShipping(t("2007-12-01"), t("2026-11-01"), now)).toBe(true);
  });
  it("does not flag a builder still under 19, already 19 at shipping, or with no dates", () => {
    expect(turnedNineteenSinceShipping(t("2008-12-01"), t("2026-11-01"), now)).toBe(false);
    expect(turnedNineteenSinceShipping(t("2007-01-01"), t("2026-11-01"), now)).toBe(false);
    expect(turnedNineteenSinceShipping(null, t("2026-11-01"), now)).toBe(false);
    expect(turnedNineteenSinceShipping(t("2007-12-01"), null, now)).toBe(false);
  });
});

describe("validateAuditSections", () => {
  const full = { technicalFeatures: "a concrete description of the features checked", deflationReason: "I lowered the hours because the commits were not descriptive", ageJustification: "Builder was 18 at shipping and is 19 now; owner will decide", notes: "Originality and technical depth were checked" };
  it("accepts every required section when present", () => {
    expect(validateAuditSections(full, { technicalFeatures: true, deflationReason: true, ageJustification: true, notes: true })).toEqual({ ok: true });
  });
  it("requires technical features long enough and the additional notes on an approval", () => {
    expect(validateAuditSections({ ...full, technicalFeatures: "short" }, { technicalFeatures: true, notes: true })).toMatchObject({ ok: false, field: "technicalFeatures" });
    expect(validateAuditSections({ ...full, notes: "  " }, { technicalFeatures: true, notes: true })).toMatchObject({ ok: false, field: "notes" });
  });
  it("requires a deflation reason only when hours were lowered", () => {
    const none = { ...full, deflationReason: "" };
    expect(validateAuditSections(none, { deflationReason: true })).toMatchObject({ ok: false, field: "deflationReason" });
    expect(validateAuditSections(none, { deflationReason: false })).toEqual({ ok: true });
  });
  it("requires age justification only when the age flag is set", () => {
    const none = { ...full, ageJustification: "" };
    expect(validateAuditSections(none, { ageJustification: true })).toMatchObject({ ok: false, field: "ageJustification" });
    expect(validateAuditSections(none, { ageJustification: false })).toEqual({ ok: true });
  });
});

describe("creditFor", () => {
  it("rounds hours to 0.1 first, then pays 10 Ore per hour", () => {
    expect(creditFor({ approvedMinutes: 60 })).toBe(10);
    expect(creditFor({ approvedMinutes: 90 })).toBe(15);
    expect(creditFor({ approvedMinutes: 100 })).toBe(17);
    expect(creditFor({ approvedMinutes: 120 })).toBe(20);
  });
  it("is the ledger's one conversion: hoursToOre, review.ts creditFor and this agree", () => {
    for (const minutes of [0, 1, 3, 9, 59, 90, 100, 105, 135, 600, 725]) {
      expect(creditFor({ approvedMinutes: minutes })).toBe(oreForMinutes(minutes));
      expect(creditFor({ approvedMinutes: minutes })).toBe(hoursToOre(minutes / 60));
      expect(reviewCreditFor(minutes).ore).toBe(creditFor({ approvedMinutes: minutes }));
    }
  });
  it("matches review.ts creditFor for whole minutes", () => {
    for (const minutes of [1, 2, 3, 5, 9, 29, 59, 61, 100, 133, 725]) expect(creditFor({ approvedMinutes: minutes })).toBe(reviewCreditFor(minutes).ore);
  });
  it("one minute is 0 hours after the first rounding, so 0 Ore", () => {
    expect(creditFor({ approvedMinutes: 1 })).toBe(0);
    expect(creditFor({ approvedMinutes: 2 })).toBe(0);
  });
  it("3 minutes is the first to reach 0.1 hour, 1 Ore", () => {
    expect(creditFor({ approvedMinutes: 3 })).toBe(1);
    expect(creditFor({ approvedMinutes: 8 })).toBe(1);
    expect(creditFor({ approvedMinutes: 9 })).toBe(2);
  });
  it("is zero for zero, negative and broken input", () => {
    expect(creditFor({ approvedMinutes: 0 })).toBe(0);
    expect(creditFor({ approvedMinutes: -30 })).toBe(0);
    expect(creditFor({ approvedMinutes: Number.NaN })).toBe(0);
    expect(creditFor({ approvedMinutes: Infinity })).toBe(0);
  });
  it("drops fractions of a minute first", () => {
    expect(creditFor({ approvedMinutes: 2.9 })).toBe(0);
    expect(creditFor({ approvedMinutes: 59.9 })).toBe(creditFor({ approvedMinutes: 59 }));
  });
  it("rounds the Ore up for a rate that does not divide evenly", () => {
    expect(creditFor({ approvedMinutes: 60, ratePerHourOre: 20 })).toBe(20);
    expect(creditFor({ approvedMinutes: 6, ratePerHourOre: 5 })).toBe(1);
    expect(creditFor({ approvedMinutes: 18, ratePerHourOre: 5 })).toBe(2);
    expect(creditFor({ approvedMinutes: 60, ratePerHourOre: 0 })).toBe(0);
    expect(creditFor({ approvedMinutes: 60, ratePerHourOre: -5 })).toBe(0);
    expect(creditFor({ approvedMinutes: 60, ratePerHourOre: Number.NaN })).toBe(0);
  });
  it("pending credit is the same sum on the claimed minutes", () => {
    expect(pendingCredit(90)).toBe(15);
    expect(pendingCredit(100)).toBe(17);
    expect(pendingCredit(-1)).toBe(0);
  });
});

describe("tenthsOfHour and trackXpFor", () => {
  it("rounds to the nearest tenth of an hour", () => {
    expect(tenthsOfHour(100)).toBe(17);
    expect(tenthsOfHour(2)).toBe(0);
    expect(tenthsOfHour(3)).toBe(1);
    expect(tenthsOfHour(-5)).toBe(0);
  });
  it("Track XP follows the shared rate on the same rounding", () => {
    expect(trackXpFor(60)).toBe(TRACK_XP_PER_HOUR);
    expect(trackXpFor(100)).toBe(Math.floor((17 * TRACK_XP_PER_HOUR) / 10));
    expect(trackXpFor(0)).toBe(0);
    expect(trackXpFor(-10)).toBe(0);
  });
});

describe("journalDecision", () => {
  const entry = { minutes: 90 };
  it("approve-all keeps everything claimed", () => {
    expect(journalDecision(entry, "approve-all")).toEqual({ ok: true, value: { action: "approve-all", keptMinutes: 90, resolved: true } });
  });
  it("approve-all ignores a stray kept value", () => {
    const result = journalDecision(entry, "approve-all", 10);
    expect(result.ok && result.value.keptMinutes).toBe(90);
  });
  it("reject as unverifiable keeps zero and is resolved", () => {
    expect(journalDecision(entry, "reject", 50)).toEqual({ ok: true, value: { action: "reject", keptMinutes: 0, resolved: true } });
  });
  it("clarify keeps nothing yet and is not resolved", () => {
    expect(journalDecision(entry, "clarify")).toEqual({ ok: true, value: { action: "clarify", keptMinutes: 0, resolved: false } });
  });
  it("partial keeps whole minutes from 0 up to the claim, both ends allowed", () => {
    expect(journalDecision(entry, "partial", 45)).toEqual({ ok: true, value: { action: "partial", keptMinutes: 45, resolved: true } });
    expect(journalDecision(entry, "partial", 0).ok).toBe(true);
    expect(journalDecision(entry, "partial", 90).ok).toBe(true);
  });
  it("partial refuses missing, fractional, negative, too many and not-a-number minutes", () => {
    expect(journalDecision(entry, "partial").ok).toBe(false);
    expect(journalDecision(entry, "partial", 45.5).ok).toBe(false);
    expect(journalDecision(entry, "partial", -1).ok).toBe(false);
    expect(journalDecision(entry, "partial", 91).ok).toBe(false);
    expect(journalDecision(entry, "partial", Number.NaN).ok).toBe(false);
  });
  it("refuses an entry that claims no whole minutes", () => {
    expect(journalDecision({ minutes: 0 }, "approve-all").ok).toBe(false);
    expect(journalDecision({ minutes: -5 }, "approve-all").ok).toBe(false);
    expect(journalDecision({ minutes: 10.5 }, "approve-all").ok).toBe(false);
  });
  it("refuses an action it does not know", () => {
    expect(journalDecision(entry, "shrug" as never).ok).toBe(false);
  });
});

describe("keptTotal", () => {
  it("adds kept minutes and reports whether everything was kept", () => {
    const result = keptTotal([
      { minutes: 60, action: "approve-all" },
      { minutes: 60, action: "partial", keptMinutes: 30 },
    ]);
    expect(result).toEqual({ ok: true, value: { claimed: 120, kept: 90, allFull: false } });
  });
  it("fails on an entry with no action and on a clarification", () => {
    expect(keptTotal([{ minutes: 60 }]).ok).toBe(false);
    expect(keptTotal([{ minutes: 60, action: "clarify" }]).ok).toBe(false);
  });
  it("fails on an invalid partial", () => {
    expect(keptTotal([{ minutes: 60, action: "partial", keptMinutes: 61 }]).ok).toBe(false);
  });
  it("is zero for no entries", () => {
    expect(keptTotal([])).toEqual({ ok: true, value: { claimed: 0, kept: 0, allFull: true } });
  });
});

describe("verdictEffect", () => {
  const full = [
    { minutes: 60, action: "approve-all" as const },
    { minutes: 30, action: "approve-all" as const },
  ];
  const cut = [
    { minutes: 60, action: "approve-all" as const },
    { minutes: 60, action: "partial" as const, keptMinutes: 30 },
  ];
  const second = { stage: "second-pass" as const };
  const first = { stage: "first-pass" as const };
  it("a second-pass approval credits everything claimed, confirmed", () => {
    const result = verdictEffect({ kind: "approve" }, full, second);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ minutes: 90, hours: 1.5, ore: 15, oreStatus: "confirmed", claimable: true, state: "approved", unlocksTrack: false, reduced: false, claimedMinutes: 90 });
    expect(result.value.trackXp).toBe(trackXpFor(90));
  });
  it("an approval with time cut credits only what was kept and says reduced", () => {
    const result = verdictEffect({ kind: "approve" }, cut, second);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ minutes: 90, ore: 15, state: "approved", reduced: true, claimedMinutes: 120 });
  });
  it("credits 100 kept minutes as 1.7 hours and 17 Ore", () => {
    const result = verdictEffect({ kind: "approve" }, [{ minutes: 100, action: "approve-all" }], second);
    expect(result.ok && [result.value.hours, result.value.ore]).toEqual([1.7, 17]);
  });
  it("a first-pass approval goes to the second pass and pays nothing yet", () => {
    const result = verdictEffect({ kind: "approve" }, full, first);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ minutes: 0, ore: 0, trackXp: 0, oreStatus: "pending", state: "second-pass", claimable: true });
  });
  it("refuses to approve with no entries, an undecided entry, a clarification or zero kept", () => {
    expect(verdictEffect({ kind: "approve" }, [], second).ok).toBe(false);
    expect(verdictEffect({ kind: "approve" }, [{ minutes: 60 }], second).ok).toBe(false);
    expect(verdictEffect({ kind: "approve" }, [{ minutes: 60, action: "clarify" }], second).ok).toBe(false);
    expect(verdictEffect({ kind: "approve" }, [{ minutes: 60, action: "reject" }], second).ok).toBe(false);
  });
  it("needs changes credits nothing, needs a reason, stays claimable, at either stage", () => {
    for (const opts of [first, second]) {
      const result = verdictEffect({ kind: "needs_changes", reason: "README is missing steps" }, full, opts);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toMatchObject({ minutes: 0, ore: 0, trackXp: 0, oreStatus: null, claimable: true, state: "needs-changes", unlocksTrack: false, claimedMinutes: 90 });
    }
    expect(verdictEffect({ kind: "needs_changes", reason: "   " }, full, second).ok).toBe(false);
  });
  it("needs changes works while entries are still undecided", () => {
    expect(verdictEffect({ kind: "needs_changes", reason: "Please clarify" }, [{ minutes: 60 }, { minutes: 20, action: "clarify" }], first).ok).toBe(true);
  });
  it("does not fit the track is a needs-changes reason that opens the track", () => {
    const result = verdictEffect({ kind: "needs_changes", reason: "Does not fit the track", reasonCode: "track" }, full, second);
    expect(result.ok && result.value.unlocksTrack).toBe(true);
    expect(result.ok && result.value.state).toBe("needs-changes");
  });
  it("a first-pass ban is a proposal, a second-pass ban is the ban, neither pays or can be claimed", () => {
    const proposal = verdictEffect({ kind: "banned", reason: "Fabricated hours" }, full, first);
    expect(proposal.ok && proposal.value).toMatchObject({ ore: 0, claimable: false, state: "proposed-ban", oreStatus: null });
    const ban = verdictEffect({ kind: "banned", reason: "Fabricated hours" }, full, second);
    expect(ban.ok && ban.value).toMatchObject({ ore: 0, claimable: false, state: "banned" });
    expect(verdictEffect({ kind: "banned", reason: " " }, full, second).ok).toBe(false);
  });
  it("no verdict can be given while the ship is held", () => {
    expect(verdictEffect({ kind: "approve" }, full, { stage: "second-pass", held: true }).ok).toBe(false);
    expect(verdictEffect({ kind: "needs_changes", reason: "x" }, full, { stage: "first-pass", held: true }).ok).toBe(false);
    expect(verdictEffect({ kind: "banned", reason: "x" }, full, { stage: "first-pass", held: true }).ok).toBe(false);
  });
  it("refuses a verdict it does not know", () => {
    expect(verdictEffect({ kind: "maybe" } as never, full, second).ok).toBe(false);
  });
  it("claimed minutes ignore a broken entry", () => {
    const result = verdictEffect({ kind: "needs_changes", reason: "x" }, [{ minutes: -4 }, { minutes: 30 }], first);
    expect(result.ok && result.value.claimedMinutes).toBe(30);
  });

  describe("an update ship (project approved before) needs new kept minutes", () => {
    const prior = { minutes: 600, action: "approve-all" as const };
    const update = (newEntry: { minutes: number; action: "approve-all" | "reject" | "partial"; keptMinutes?: number }, stage: typeof first | typeof second) =>
      verdictEffect({ kind: "approve" }, [prior, newEntry], { ...stage, priorApprovedMinutes: 600 });
    it("refuses when the only new entry is rejected, even though the old minutes were kept", () => {
      const result = update({ minutes: 150, action: "reject" }, second);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.message).toContain("needs changes");
      expect(update({ minutes: 150, action: "reject" }, first).ok).toBe(false);
    });
    it("refuses 10 new kept minutes", () => {
      expect(update({ minutes: 150, action: "partial", keptMinutes: 10 }, second).ok).toBe(false);
      expect(update({ minutes: 10, action: "approve-all" }, first).ok).toBe(false);
    });
    it("refuses 149 and accepts exactly 150 new kept minutes (the ship gate minimum)", () => {
      expect(UPDATE_MIN_MINUTES).toBe(150);
      expect(update({ minutes: 150, action: "partial", keptMinutes: 149 }, second).ok).toBe(false);
      const ok = update({ minutes: 150, action: "approve-all" }, second);
      expect(ok.ok).toBe(true);
      if (!ok.ok) return;
      expect(ok.value).toMatchObject({ minutes: 750, state: "approved", oreStatus: "confirmed" });
    });
    it("accepts 150 new kept minutes at the first pass too", () => {
      const ok = update({ minutes: 150, action: "approve-all" }, first);
      expect(ok.ok && ok.value.state).toBe("second-pass");
    });
    it("a first ship (no prior approved minutes) has no minimum", () => {
      expect(verdictEffect({ kind: "approve" }, [{ minutes: 10, action: "approve-all" }], { ...second, priorApprovedMinutes: 0 }).ok).toBe(true);
      expect(verdictEffect({ kind: "approve" }, [{ minutes: 10, action: "approve-all" }], second).ok).toBe(true);
    });
    it("does not stop needs changes on an update ship", () => {
      expect(verdictEffect({ kind: "needs_changes", reason: "More work" }, [prior, { minutes: 150, action: "reject" }], { ...second, priorApprovedMinutes: 600 }).ok).toBe(true);
    });
  });
});

describe("cleanSeconds (review timers from the browser)", () => {
  it("keeps whole seconds from zero to a day", () => {
    expect(cleanSeconds("42")).toBe(42);
    expect(cleanSeconds("12.9")).toBe(12);
    expect(cleanSeconds(0)).toBe(0);
  });
  it("turns negative, empty, not-a-number and infinite values into 0", () => {
    for (const raw of ["-5", "", "  ", "abc", "NaN", "Infinity", "-Infinity", null, undefined, {}]) expect(cleanSeconds(raw)).toBe(0);
  });
  it("cuts a huge value to a day", () => {
    expect(cleanSeconds("999999999999")).toBe(EVIDENCE_SECONDS_MAX);
    expect(cleanSeconds("1e308")).toBe(EVIDENCE_SECONDS_MAX);
    expect(EVIDENCE_SECONDS_MAX).toBe(86_400);
  });
});

describe("hold", () => {
  const now = t("2026-11-16T10:00:00Z");
  it("needs a reason and trims it to 500 characters", () => {
    expect(placeHold({ reason: "  ", by: "rev-a", now }).ok).toBe(false);
    const result = placeHold({ reason: "x".repeat(600), by: "rev-a", now });
    expect(result.ok && result.value.reason.length).toBe(500);
    expect(result.ok && result.value.by).toBe("rev-a");
  });
  it("does not overwrite another reviewer hold, unless an owner", () => {
    const existing = { by: "rev-a", reason: "wait", at: now };
    expect(placeHold({ reason: "mine", by: "rev-b", now, existing }).ok).toBe(false);
    expect(placeHold({ reason: "mine", by: "rev-b", now, existing, isOwner: true }).ok).toBe(true);
    expect(placeHold({ reason: "again", by: "rev-a", now, existing }).ok).toBe(true);
  });
  it("is released only by the setter or an owner", () => {
    const hold = { by: "rev-a", reason: "wait", at: now };
    expect(canReleaseHold({ hold, releaserId: "rev-a", isOwner: false })).toBe(true);
    expect(canReleaseHold({ hold, releaserId: "rev-b", isOwner: false })).toBe(false);
    expect(canReleaseHold({ hold, releaserId: "rev-b", isOwner: true })).toBe(true);
    expect(canReleaseHold({ hold: null, releaserId: "rev-a", isOwner: true })).toBe(false);
  });
});

describe("correctionDelta", () => {
  it("claws back the difference when lowered", () => {
    expect(correctionDelta({ previouslyCreditedOre: 100, correctedOre: 60 })).toEqual({ ok: true, value: { deltaOre: -40, direction: "claw_back" } });
  });
  it("pays the difference when raised", () => {
    expect(correctionDelta({ previouslyCreditedOre: 100, correctedOre: 130 })).toEqual({ ok: true, value: { deltaOre: 30, direction: "pay" } });
    expect(correctionDelta({ previouslyCreditedOre: 100, correctedOre: 101 })).toEqual({ ok: true, value: { deltaOre: 1, direction: "pay" } });
  });
  it("is zero when nothing changes, and can go down to or up from zero Ore", () => {
    expect(correctionDelta({ previouslyCreditedOre: 100, correctedOre: 100 })).toEqual({ ok: true, value: { deltaOre: 0, direction: "none" } });
    expect(correctionDelta({ previouslyCreditedOre: 100, correctedOre: 0 })).toEqual({ ok: true, value: { deltaOre: -100, direction: "claw_back" } });
    expect(correctionDelta({ previouslyCreditedOre: 0, correctedOre: 50 })).toEqual({ ok: true, value: { deltaOre: 50, direction: "pay" } });
  });
  it("refuses negative, fractional and broken numbers", () => {
    expect(correctionDelta({ previouslyCreditedOre: -1, correctedOre: 0 }).ok).toBe(false);
    expect(correctionDelta({ previouslyCreditedOre: 10, correctedOre: -1 }).ok).toBe(false);
    expect(correctionDelta({ previouslyCreditedOre: 10.5, correctedOre: 5 }).ok).toBe(false);
    expect(correctionDelta({ previouslyCreditedOre: 10, correctedOre: 5.5 }).ok).toBe(false);
    expect(correctionDelta({ previouslyCreditedOre: Number.NaN, correctedOre: 5 }).ok).toBe(false);
  });
});

describe("updateShipCredit", () => {
  it("pays only the new minutes", () => {
    expect(updateShipCredit({ priorApprovedMinutes: 90, totalMinutes: 180 })).toEqual({ newMinutes: 90, ore: 15 });
  });
  it("pays nothing when the total is equal or lower", () => {
    expect(updateShipCredit({ priorApprovedMinutes: 90, totalMinutes: 90 })).toEqual({ newMinutes: 0, ore: 0 });
    expect(updateShipCredit({ priorApprovedMinutes: 90, totalMinutes: 30 })).toEqual({ newMinutes: 0, ore: 0 });
  });
  it("pays everything when there is no prior approval", () => {
    expect(updateShipCredit({ priorApprovedMinutes: 0, totalMinutes: 120 })).toEqual({ newMinutes: 120, ore: 20 });
  });
  it("keeps rounding fair across ships: the two steps add up to the one-step total", () => {
    const first = creditFor({ approvedMinutes: 10 });
    const second = updateShipCredit({ priorApprovedMinutes: 10, totalMinutes: 20 }).ore;
    expect(first + second).toBe(creditFor({ approvedMinutes: 20 }));
    expect(updateShipCredit({ priorApprovedMinutes: 100, totalMinutes: 200 }).ore).toBe(creditFor({ approvedMinutes: 200 }) - 17);
  });
  it("never goes negative on broken input", () => {
    expect(updateShipCredit({ priorApprovedMinutes: -5, totalMinutes: -10 })).toEqual({ newMinutes: 0, ore: 0 });
    expect(updateShipCredit({ priorApprovedMinutes: Number.NaN, totalMinutes: 60 })).toEqual({ newMinutes: 60, ore: 10 });
  });
});

describe("checkChangeNote", () => {
  it("needs 100 characters once trimmed and squeezed", () => {
    expect(checkChangeNote("a".repeat(99)).ok).toBe(false);
    expect(checkChangeNote("a".repeat(100)).ok).toBe(true);
    expect(checkChangeNote(`  ${"a".repeat(99)}  `).ok).toBe(false);
    expect(checkChangeNote(`${"a ".repeat(60)}`).ok).toBe(true);
  });
  it("refuses a missing or non-text note", () => {
    expect(checkChangeNote(undefined).ok).toBe(false);
    expect(checkChangeNote(42).ok).toBe(false);
  });
  it("does not accept invisible characters as a note", () => {
    expect(checkChangeNote("\u200B".repeat(100)).ok).toBe(false);
    expect(checkChangeNote("😀".repeat(100)).ok).toBe(false);
  });
});

describe("fundingSplit", () => {
  it("takes the funding in Ore from the payout and pays the rest", () => {
    expect(fundingSplit({ payoutOre: 500, fundingUsd: 43.5, usdPerTenOre: 4.35 })).toEqual({ fundingOre: 100, paidOre: 400, capped: false });
  });
  it("rounds the funding to the nearest whole Ore, as Pixl does", () => {
    expect(fundingSplit({ payoutOre: 500, fundingUsd: 4.36, usdPerTenOre: 4.35 })).toEqual({ fundingOre: 10, paidOre: 490, capped: false });
    expect(fundingSplit({ payoutOre: 500, fundingUsd: 4.5, usdPerTenOre: 4.35 })).toEqual({ fundingOre: 10, paidOre: 490, capped: false });
    expect(fundingSplit({ payoutOre: 500, fundingUsd: 6.6, usdPerTenOre: 4.35 })).toEqual({ fundingOre: 15, paidOre: 485, capped: false });
    expect(fundingSplit({ payoutOre: 500, fundingUsd: 0.01, usdPerTenOre: 4.35 }).fundingOre).toBe(0);
  });
  it("does not round up a value that is exactly whole", () => {
    expect(fundingSplit({ payoutOre: 500, fundingUsd: 4.35, usdPerTenOre: 4.35 }).fundingOre).toBe(10);
  });
  it("caps the funding at the payout and says so", () => {
    expect(fundingSplit({ payoutOre: 50, fundingUsd: 500, usdPerTenOre: 4.35 })).toEqual({ fundingOre: 50, paidOre: 0, capped: true });
  });
  it("is not capped when the funding equals the payout", () => {
    expect(fundingSplit({ payoutOre: 10, fundingUsd: 4.35, usdPerTenOre: 4.35 })).toEqual({ fundingOre: 10, paidOre: 0, capped: false });
  });
  it("takes nothing for no funding or a bad amount", () => {
    expect(fundingSplit({ payoutOre: 100, fundingUsd: 0, usdPerTenOre: 4.35 })).toEqual({ fundingOre: 0, paidOre: 100, capped: false });
    expect(fundingSplit({ payoutOre: 100, fundingUsd: -5, usdPerTenOre: 4.35 }).fundingOre).toBe(0);
    expect(fundingSplit({ payoutOre: 100, fundingUsd: Number.NaN, usdPerTenOre: 4.35 }).fundingOre).toBe(0);
  });
  it("pays nothing from a zero, negative or fractional payout", () => {
    expect(fundingSplit({ payoutOre: 0, fundingUsd: 10, usdPerTenOre: 4.35 })).toEqual({ fundingOre: 0, paidOre: 0, capped: true });
    expect(fundingSplit({ payoutOre: -5, fundingUsd: 10, usdPerTenOre: 4.35 }).paidOre).toBe(0);
    expect(fundingSplit({ payoutOre: 10.5, fundingUsd: 0, usdPerTenOre: 4.35 }).paidOre).toBe(0);
  });
  it("uses the shared rate by default and rejects a rate of zero or less", () => {
    expect(fundingSplit({ payoutOre: 500, fundingUsd: USD_PER_TEN_ORE, usdPerTenOre: USD_PER_TEN_ORE }).fundingOre).toBe(10);
    expect(fundingSplit({ payoutOre: 500, fundingUsd: USD_PER_TEN_ORE }).fundingOre).toBe(10);
    expect(() => fundingSplit({ payoutOre: 500, fundingUsd: 1, usdPerTenOre: 0 })).toThrow(RangeError);
    expect(() => fundingSplit({ payoutOre: 500, fundingUsd: 1, usdPerTenOre: -1 })).toThrow(RangeError);
  });
});

describe("claimState", () => {
  const claimedAt = t("2026-11-16T10:00:00Z");
  const base = { reviewerId: "rev-a", claimedAt, awayMinutes: 0 };
  it("is none with no holder or no claim time", () => {
    expect(claimState({ ...base, reviewerId: null, now: t("2026-11-16T10:05:00Z") }).state).toBe("none");
    expect(claimState({ ...base, reviewerId: "  ", now: t("2026-11-16T10:05:00Z") }).state).toBe("none");
    expect(claimState({ ...base, claimedAt: null, now: t("2026-11-16T10:05:00Z") }).state).toBe("none");
  });
  it("is active until 30 minutes after the claim, and blocks another reviewer", () => {
    const state = claimState({ ...base, now: t("2026-11-16T10:29:59Z"), viewerId: "rev-b" });
    expect(state).toMatchObject({ state: "active", holder: "rev-a", blocksViewer: true, minutesLeft: 1 });
  });
  it("does not block the holder", () => {
    expect(claimState({ ...base, now: t("2026-11-16T10:10:00Z"), viewerId: "rev-a" }).blocksViewer).toBe(false);
  });
  it("expires exactly at 30 minutes", () => {
    const state = claimState({ ...base, now: t("2026-11-16T10:30:00Z"), viewerId: "rev-b" });
    expect(state).toMatchObject({ state: "expired", blocksViewer: false, minutesLeft: 0 });
  });
  it("a heartbeat restarts the 30 minutes", () => {
    const state = claimState({ ...base, lastHeartbeatAt: t("2026-11-16T10:25:00Z"), now: t("2026-11-16T10:50:00Z"), viewerId: "rev-b" });
    expect(state.state).toBe("active");
    expect(state.minutesLeft).toBe(5);
  });
  it("expires at four hours even when heartbeats keep the 30-minute window fresh", () => {
    const state = claimState({ ...base, lastHeartbeatAt: t("2026-11-16T13:55:00Z"), now: t("2026-11-16T14:00:00Z"), viewerId: "rev-b" });
    expect(state).toMatchObject({ state: "expired", blocksViewer: false, minutesLeft: 0 });
  });
  it("an older heartbeat than the claim does not move the start back", () => {
    const state = claimState({ ...base, lastHeartbeatAt: t("2026-11-16T09:00:00Z"), now: t("2026-11-16T10:20:00Z") });
    expect(state.state).toBe("active");
  });
  it("releases at 5 minutes away, not at 4", () => {
    expect(claimState({ ...base, awayMinutes: 4, now: t("2026-11-16T10:10:00Z"), viewerId: "rev-b" }).state).toBe("active");
    const released = claimState({ ...base, awayMinutes: 5, now: t("2026-11-16T10:10:00Z"), viewerId: "rev-b" });
    expect(released).toMatchObject({ state: "released", blocksViewer: false });
  });
  it("treats missing or broken away minutes as present", () => {
    expect(claimState({ ...base, awayMinutes: null, now: t("2026-11-16T10:10:00Z") }).state).toBe("active");
    expect(claimState({ ...base, awayMinutes: Number.NaN, now: t("2026-11-16T10:10:00Z") }).state).toBe("active");
  });
  it("a claim time in the future is not a claim", () => {
    expect(claimState({ ...base, now: t("2026-11-16T09:00:00Z") }).state).toBe("none");
  });
  it("a claim at the same instant is active with the full 30 minutes", () => {
    expect(claimState({ ...base, now: claimedAt }).minutesLeft).toBe(30);
  });
  it("ignores a heartbeat in the future instead of dropping the claim", () => {
    const state = claimState({ ...base, lastHeartbeatAt: t("2026-11-16T10:15:00Z"), now: t("2026-11-16T10:10:00Z"), viewerId: "rev-b" });
    expect(state).toMatchObject({ state: "active", holder: "rev-a", blocksViewer: true, minutesLeft: 20 });
  });
});

describe("assignmentWindow", () => {
  const reshippedAt = t("2026-11-10T12:00:00Z");
  it("has 72 hours, shown as time left", () => {
    const result = assignmentWindow({ reshippedAt, now: t("2026-11-11T12:00:00Z") });
    expect(result.backToQueue).toBe(false);
    expect(result.hoursLeft).toBe(48);
    expect(result.deadline?.toISOString()).toBe("2026-11-13T12:00:00.000Z");
  });
  it("is still the reviewer's one millisecond before the deadline", () => {
    expect(assignmentWindow({ reshippedAt, now: t("2026-11-13T11:59:59.999Z") }).backToQueue).toBe(false);
  });
  it("goes back to the queue exactly at 72 hours and after", () => {
    expect(assignmentWindow({ reshippedAt, now: t("2026-11-13T12:00:00Z") })).toMatchObject({ backToQueue: true, msLeft: 0, hoursLeft: 0 });
    expect(assignmentWindow({ reshippedAt, now: t("2026-11-20T12:00:00Z") }).backToQueue).toBe(true);
  });
  it("has nothing to time before the builder ships again", () => {
    expect(assignmentWindow({ reshippedAt: null, now: reshippedAt })).toEqual({ deadline: null, msLeft: 0, hoursLeft: 0, backToQueue: false });
    expect(assignmentWindow({ reshippedAt: new Date(Number.NaN), now: reshippedAt }).backToQueue).toBe(false);
  });
});

describe("waitStart", () => {
  const first = t("2026-11-01T00:00:00Z");
  const update = t("2026-11-10T00:00:00Z");
  it("counts from the first ship, even after a reship", () => {
    expect(waitStart({ firstShippedAt: first, updateShippedAt: update, isUpdate: false })).toBe(first);
  });
  it("an update ship starts a new wait", () => {
    expect(waitStart({ firstShippedAt: first, updateShippedAt: update, isUpdate: true })).toBe(update);
  });
  it("falls back to the other date, then null", () => {
    expect(waitStart({ firstShippedAt: null, updateShippedAt: update, isUpdate: false })).toBe(update);
    expect(waitStart({ firstShippedAt: first, updateShippedAt: null, isUpdate: true })).toBe(first);
    expect(waitStart({ isUpdate: false })).toBeNull();
    expect(waitStart({ isUpdate: true })).toBeNull();
  });
});


describe("canConfirmBan", () => {
  it("lets an owner confirm, including a proposal from a reviewer", () => {
    expect(canConfirmBan({ confirmerIsOwner: true }).ok).toBe(true);
  });
  it("refuses anyone who is not an owner", () => {
    expect(canConfirmBan({ confirmerIsOwner: false }).ok).toBe(false);
  });
});

describe("canHold (Pixl: holdReview allows the owner of the ship, not collaborators)", () => {
  it("lets the ship owner hold their own ship", () => {
    expect(canHold({ reviewerId: "own-a", ownerId: "own-a", collaboratorIds: ["col-a"] })).toBe(true);
  });
  it("refuses a collaborator and a person with a pending invite", () => {
    expect(canHold({ reviewerId: "col-a", ownerId: "own-a", collaboratorIds: ["col-a"] })).toBe(false);
    expect(canHold({ reviewerId: "inv-a", ownerId: "own-a", pendingInviteIds: ["inv-a"] })).toBe(false);
  });
  it("lets another reviewer hold", () => {
    expect(canHold({ reviewerId: "rev-b", ownerId: "own-a" })).toBe(true);
  });
  it("refuses an empty id", () => {
    expect(canHold({ reviewerId: "", ownerId: "own-a" })).toBe(false);
  });
  it("refuses a whitespace-only id", () => {
    expect(canHold({ reviewerId: "   ", ownerId: "own-a" })).toBe(false);
  });
});

describe("stageAllows", () => {
  it("lets every role do the first pass", () => {
    expect(stageAllows("reviewer", "first-pass")).toBe(true);
  });
  it("keeps second pass and proposed ban to final reviewers and owners", () => {
    expect(stageAllows("reviewer", "second-pass")).toBe(false);
    expect(stageAllows("reviewer", "proposed-ban")).toBe(false);
    expect(stageAllows("final-reviewer", "second-pass")).toBe(true);
    expect(stageAllows("owner", "proposed-ban")).toBe(true);
  });
  it("does not let an unknown or missing role through the first pass", () => {
    expect(stageAllows("" as never, "first-pass")).toBe(false);
    expect(stageAllows("fulfiller" as never, "first-pass")).toBe(false);
  });
});

describe("canReview", () => {
  const base = { reviewerId: "rev", ownerId: "maker", collaboratorIds: ["mate"], pendingInviteIds: ["invited"] };
  it("lets a stranger review", () => {
    expect(canReview(base)).toBe(true);
  });
  it("refuses the owner, a collaborator and a pending invite", () => {
    expect(canReview({ ...base, reviewerId: "maker" })).toBe(false);
    expect(canReview({ ...base, reviewerId: "mate" })).toBe(false);
    expect(canReview({ ...base, reviewerId: "invited" })).toBe(false);
  });
  it("refuses a platform owner on their own ship", () => {
    expect(canReview({ ...base, reviewerId: "maker", isPlatformOwner: true })).toBe(false);
  });
  it("refuses an empty reviewer id", () => {
    expect(canReview({ ...base, reviewerId: "" })).toBe(false);
  });
  it("refuses a whitespace-only reviewer id", () => {
    expect(canReview({ ...base, reviewerId: "   " })).toBe(false);
  });
  it("closes a ship reserved for another reviewer inside their window", () => {
    expect(canReview({ ...base, assignedReviewerId: "other" })).toBe(false);
  });
  it("opens it again for the assignee, once the window is over, and for a platform owner", () => {
    expect(canReview({ ...base, assignedReviewerId: "rev" })).toBe(true);
    expect(canReview({ ...base, assignedReviewerId: "other", assignmentOverdue: true })).toBe(true);
    expect(canReview({ ...base, assignedReviewerId: "other", isPlatformOwner: true })).toBe(true);
  });
  it("works with no collaborator lists", () => {
    expect(canReview({ reviewerId: "rev", ownerId: "maker" })).toBe(true);
  });
});

describe("canSecondPass (Pixl: role check; self-review is canReview)", () => {
  it("lets a final reviewer or an owner second-pass, including the first-pass reviewer", () => {
    expect(canSecondPass({ reviewerId: "fin-b", role: "final-reviewer" })).toBe(true);
    expect(canSecondPass({ reviewerId: "own-a", role: "owner" })).toBe(true);
  });
  it("refuses a plain reviewer and an empty id", () => {
    expect(canSecondPass({ reviewerId: "rev-b", role: "reviewer" })).toBe(false);
    expect(canSecondPass({ reviewerId: "", role: "owner" })).toBe(false);
  });
  it("refuses a whitespace-only id", () => {
    expect(canSecondPass({ reviewerId: "   ", role: "owner" })).toBe(false);
  });
});

describe("goesToSecondPass", () => {
  it("sends every first-pass approval, and only approvals", () => {
    expect(goesToSecondPass("approve")).toBe(true);
    expect(goesToSecondPass("needs_changes")).toBe(false);
    expect(goesToSecondPass("banned")).toBe(false);
  });
});

describe("equipGateMet", () => {
  it("fires at exactly 25 approved hours and above, on any ship", () => {
    expect(EQUIP_GATE_MINUTES).toBe(1500);
    expect(equipGateMet(1499)).toBe(false);
    expect(equipGateMet(1500)).toBe(true);
    expect(equipGateMet(3000)).toBe(true);
    expect(equipGateMet(-5)).toBe(false);
    expect(equipGateMet(Number.NaN)).toBe(false);
  });
});

describe("assignmentReminderDue (Pixl: a day into the window, once per re-ship)", () => {
  const re = t("2026-11-01T10:00:00Z");
  it("is not due before 24 hours have passed", () => {
    expect(assignmentReminderDue({ reshippedAt: re, now: t("2026-11-02T09:59:00Z") })).toBe(false);
  });
  it("is due from 24 hours until the window closes at 72 hours", () => {
    expect(assignmentReminderDue({ reshippedAt: re, now: t("2026-11-02T10:00:00Z") })).toBe(true);
    expect(assignmentReminderDue({ reshippedAt: re, now: t("2026-11-04T09:59:00Z") })).toBe(true);
  });
  it("is not due once the window has closed", () => {
    expect(assignmentReminderDue({ reshippedAt: re, now: t("2026-11-04T10:00:00Z") })).toBe(false);
  });
  it("is not due again after a reminder for this re-ship, but is due for a later re-ship", () => {
    expect(assignmentReminderDue({ reshippedAt: re, reminderSentAt: t("2026-11-02T10:00:00Z"), now: t("2026-11-03T10:00:00Z") })).toBe(false);
    expect(assignmentReminderDue({ reshippedAt: t("2026-11-03T08:00:00Z"), reminderSentAt: t("2026-11-02T10:00:00Z"), now: t("2026-11-04T08:00:00Z") })).toBe(true);
  });
  it("is never due without a re-ship", () => {
    expect(assignmentReminderDue({ reshippedAt: null, now: t("2026-11-05T00:00:00Z") })).toBe(false);
  });
});

describe("recordFraudTriage and the second-pass gate (Pixl: actions.ts 1137)", () => {
  it("only a final reviewer or an owner may triage", () => {
    expect(recordFraudTriage({ decision: "not-fraud", by: "rev-a", note: "Looks fine.", byIsFinalOrOwner: false }).ok).toBe(false);
  });
  it("needs a note and a valid choice", () => {
    expect(recordFraudTriage({ decision: "fraud", by: "fin-a", note: "  ", byIsFinalOrOwner: true }).ok).toBe(false);
    expect(recordFraudTriage({ decision: "maybe" as never, by: "fin-a", note: "x", byIsFinalOrOwner: true }).ok).toBe(false);
  });
  it("records a not-fraud or fraud triage with the note", () => {
    expect(recordFraudTriage({ decision: "not-fraud", by: "fin-a", note: " Checked the commits. ", byIsFinalOrOwner: true })).toEqual({ ok: true, value: { triage: "not-fraud", by: "fin-a", note: "Checked the commits." } });
  });
  it("refuses a second-pass verdict until the triage says not-fraud", () => {
    expect(canGiveSecondPassVerdict({ triage: null }).ok).toBe(false);
    expect(canGiveSecondPassVerdict({ triage: "fraud" }).ok).toBe(false);
    expect(canGiveSecondPassVerdict({ triage: "not-fraud" }).ok).toBe(true);
  });
});

describe("updateMinimumMet (owner decision, 16 Nov 2026: reship needs 2.5h minimum)", () => {
  it("needs 150 new minutes over the prior approved minutes", () => {
    expect(UPDATE_MIN_MINUTES).toBe(150);
    expect(updateMinimumMet({ priorApprovedMinutes: 600, totalMinutes: 749 })).toEqual({ met: false, newMinutes: 149, missingMinutes: 1 });
    expect(updateMinimumMet({ priorApprovedMinutes: 600, totalMinutes: 750 })).toEqual({ met: true, newMinutes: 150, missingMinutes: 0 });
    expect(updateMinimumMet({ priorApprovedMinutes: 0, totalMinutes: 150 }).met).toBe(true);
  });
  it("never counts negative or unreadable input as new time", () => {
    expect(updateMinimumMet({ priorApprovedMinutes: 600, totalMinutes: 300 })).toEqual({ met: false, newMinutes: 0, missingMinutes: 150 });
    expect(updateMinimumMet({ priorApprovedMinutes: Number.NaN, totalMinutes: Number.NaN }).newMinutes).toBe(0);
  });
});
