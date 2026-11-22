import { describe, expect, test } from "bun:test";
import { AWAY_RELEASE_MS, CLAIM_LEASE_MS, canClaim, claimStatus, heartbeat, type Claim } from "./claim";

const t0 = 1_000_000;
const claim: Claim = { reviewerId: "r1", claimedAt: t0, lastHeartbeatAt: t0, hiddenSince: null };

describe("claimStatus", () => {
  test("no claim is free", () => {
    expect(claimStatus(null, t0)).toEqual({ state: "free" });
  });

  test("a claim with no heartbeat is released when the lease runs out", () => {
    expect(claimStatus(claim, t0 + CLAIM_LEASE_MS - 1)).toMatchObject({ state: "held", expiresAt: t0 + CLAIM_LEASE_MS });
    expect(claimStatus(claim, t0 + CLAIM_LEASE_MS)).toEqual({ state: "released", reason: "lease" });
  });

  test("a tab reported hidden for 5 minutes releases the claim", () => {
    const hidden: Claim = { ...claim, hiddenSince: t0 };
    expect(claimStatus(hidden, t0 + AWAY_RELEASE_MS - 1)).toMatchObject({ state: "held" });
    expect(claimStatus(hidden, t0 + AWAY_RELEASE_MS)).toEqual({ state: "released", reason: "away" });
  });
});

describe("heartbeat", () => {
  test("a visible heartbeat renews the lease", () => {
    const later = t0 + 10 * 60_000;
    const result = heartbeat({ claim, reviewerId: "r1", now: later, visible: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claim.lastHeartbeatAt).toBe(later);
      expect(result.claim.hiddenSince).toBeNull();
      expect(claimStatus(result.claim, later + CLAIM_LEASE_MS - 1)).toMatchObject({ state: "held" });
    }
  });

  test("a hidden heartbeat starts the away clock and keeps it running", () => {
    const first = heartbeat({ claim, reviewerId: "r1", now: t0 + 60_000, visible: false });
    expect(first.ok && first.claim.hiddenSince).toBe(t0 + 60_000);
    if (!first.ok) throw new Error("expected ok");
    const second = heartbeat({ claim: first.claim, reviewerId: "r1", now: t0 + 120_000, visible: false });
    expect(second.ok && second.claim.hiddenSince).toBe(t0 + 60_000);
    expect(claimStatus(second.ok ? second.claim : first.claim, t0 + 60_000 + AWAY_RELEASE_MS)).toEqual({ state: "released", reason: "away" });
  });

  test("coming back to the tab clears the away clock", () => {
    const hidden = { ...claim, hiddenSince: t0 };
    const back = heartbeat({ claim: hidden, reviewerId: "r1", now: t0 + 60_000, visible: true });
    expect(back.ok && back.claim.hiddenSince).toBeNull();
  });

  test("another reviewer cannot renew the claim", () => {
    expect(heartbeat({ claim, reviewerId: "r2", now: t0 + 1000, visible: true })).toMatchObject({ ok: false, code: "not-holder" });
  });

  test("a released claim cannot be heartbeated back to life", () => {
    expect(heartbeat({ claim, reviewerId: "r1", now: t0 + CLAIM_LEASE_MS, visible: true })).toMatchObject({ ok: false, code: "released" });
  });
});

describe("canClaim", () => {
  test("a free ship can be claimed", () => {
    expect(canClaim({ claim: null, reviewerId: "r2", now: t0 })).toEqual({ ok: true });
  });

  test("a ship held by someone else cannot", () => {
    expect(canClaim({ claim, reviewerId: "r2", now: t0 })).toMatchObject({ ok: false, code: "held-by-other" });
  });

  test("the holder is told they already hold it", () => {
    expect(canClaim({ claim, reviewerId: "r1", now: t0 })).toMatchObject({ ok: false, code: "already-yours" });
  });

  test("an expired claim can be taken", () => {
    expect(canClaim({ claim, reviewerId: "r2", now: t0 + CLAIM_LEASE_MS })).toEqual({ ok: true });
  });
});
