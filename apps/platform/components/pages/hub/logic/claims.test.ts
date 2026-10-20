import { describe, expect, test } from "bun:test";
import {
  CREDIT_KEY,
  CREDIT_REASON,
  CREDIT_SOURCE,
  NO_CLAIMS,
  approveClaim,
  canSubmit,
  isApproved,
  ledgerHasCredit,
  normalizeClaims,
  recordCredit,
  rejectClaim,
  submitClaim,
  validateClaim,
  withdrawClaim,
  type ClaimInput,
} from "./claims";

const projects = [
  { id: "p1", name: "Quickshell" },
  { id: "p2", name: "Pocketlint" },
];
const good: ClaimInput = { projectId: "p1", link: "https://example.org/pull/7", note: "A fix from a stranger", attested: true };
const T1 = "2026-10-20T10:00:00.000Z";
const T2 = "2026-10-20T11:00:00.000Z";

describe("validateClaim", () => {
  test("accepts a complete claim", () => {
    expect(validateClaim(good, projects).ok).toBe(true);
  });

  test("needs a known project, an https link and the attestation", () => {
    const bad = validateClaim({ projectId: "zzz", link: "http://example.org", note: "", attested: false }, projects);
    expect(bad.ok).toBe(false);
    expect(bad.errors.project).toBeDefined();
    expect(bad.errors.link).toBeDefined();
    expect(bad.errors.attested).toBeDefined();
  });

  test("rejects a javascript: link and an over-long note", () => {
    expect(validateClaim({ ...good, link: "javascript:alert(1)" }, projects).errors.link).toBeDefined();
    expect(validateClaim({ ...good, note: "x".repeat(301) }, projects).errors.note).toBeDefined();
  });
});

describe("claim lifecycle", () => {
  test("submit records a pending claim with the normalised link", () => {
    const result = submitClaim(NO_CLAIMS, good, projects, T1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.contributor).toMatchObject({ projectId: "p1", projectName: "Quickshell", status: "pending", submittedAt: T1, attested: true });
    expect(result.state.credited).toEqual({});
  });

  test("a second claim is refused while one is pending", () => {
    const first = submitClaim(NO_CLAIMS, good, projects, T1);
    if (!first.ok) throw new Error("setup");
    expect(canSubmit(first.state)).toBe(false);
    expect(submitClaim(first.state, good, projects, T2).ok).toBe(false);
  });

  test("withdraw clears a pending claim; reject allows a new one", () => {
    const first = submitClaim(NO_CLAIMS, good, projects, T1);
    if (!first.ok) throw new Error("setup");
    expect(withdrawClaim(first.state).contributor).toBeNull();
    const rejected = rejectClaim(first.state, T2);
    expect(rejected.contributor?.status).toBe("rejected");
    expect(canSubmit(rejected)).toBe(true);
    expect(withdrawClaim(rejected)).toBe(rejected);
  });
});

describe("approval credits +50 Ore exactly once", () => {
  function pending() {
    const first = submitClaim(NO_CLAIMS, good, projects, T1);
    if (!first.ok) throw new Error("setup");
    return first.state;
  }

  test("the first approval owes the Ore; recording the credit closes the guard", () => {
    const plan = approveClaim(pending(), [], T2);
    expect(plan.shouldCredit).toBe(true);
    expect(plan.state.contributor?.status).toBe("approved");
    const done = recordCredit(plan.state, "ore_1", T2);
    expect(done.credited[CREDIT_KEY]).toEqual({ at: T2, ledgerId: "ore_1" });
    expect(isApproved(done)).toBe(true);
  });

  test("approving again owes nothing", () => {
    const plan = approveClaim(pending(), [], T2);
    const done = recordCredit(plan.state, "ore_1", T2);
    const again = approveClaim(done, [], "2026-10-21T00:00:00.000Z");
    expect(again.shouldCredit).toBe(false);
    expect(again.state).toBe(done);
  });

  test("recording a credit twice keeps the first", () => {
    const done = recordCredit(recordCredit(NO_CLAIMS, "ore_1", T1), "ore_2", T2);
    expect(done.credited[CREDIT_KEY].ledgerId).toBe("ore_1");
  });

  test("a ledger that already holds the credit blocks a second one even without the guard", () => {
    const ledger = [{ id: "ore_9", reason: CREDIT_REASON, source: CREDIT_SOURCE }];
    expect(ledgerHasCredit(ledger)).toBe(true);
    expect(approveClaim(pending(), ledger, T2).shouldCredit).toBe(false);
  });

  test("nothing is owed when there is no pending claim", () => {
    expect(approveClaim(NO_CLAIMS, [], T2).shouldCredit).toBe(false);
    const rejected = rejectClaim(pending(), T2);
    expect(approveClaim(rejected, [], T2).shouldCredit).toBe(false);
  });

  test("once credited no new claim can be submitted", () => {
    const done = recordCredit(approveClaim(pending(), [], T2).state, "ore_1", T2);
    expect(canSubmit(done)).toBe(false);
  });
});

describe("normalizeClaims", () => {
  test("drops garbage and keeps a valid claim", () => {
    expect(normalizeClaims(42)).toEqual(NO_CLAIMS);
    const state = normalizeClaims({
      contributor: { projectId: "p1", projectName: "Q", link: "https://example.org/x", submittedAt: T1, status: "pending", attested: true },
      credited: { [CREDIT_KEY]: { at: T2, ledgerId: "ore_1" }, other: { at: T1, ledgerId: "x" } },
    });
    expect(state.contributor?.status).toBe("pending");
    expect(Object.keys(state.credited)).toEqual([CREDIT_KEY]);
  });

  test("a claim with a non-https link is discarded", () => {
    const state = normalizeClaims({ contributor: { projectId: "p1", projectName: "Q", link: "javascript:1", submittedAt: T1, status: "pending" } });
    expect(state.contributor).toBeNull();
  });
});
