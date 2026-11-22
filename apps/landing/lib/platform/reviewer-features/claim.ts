// Ship claims. Opening a review page never claims; only the explicit Claim action does. A claim is kept by heartbeats.
//
// Rules (the roadmap says "a claim lasts 30 minutes, a heartbeat keeps it, leaving the tab for 5 minutes releases it"):
//   - The lease lasts 30 minutes from the last heartbeat. With no heartbeat at all (lost connection, closed app), the claim
//     is released when the lease runs out.
//   - A heartbeat says whether the reviewer's tab is visible. A tab reported hidden for 5 minutes releases the claim at once.
//   - Only the holder's heartbeat renews the claim; another reviewer's heartbeat is refused.
//
// API:
//   CLAIM_LEASE_MS = 30 min, AWAY_RELEASE_MS = 5 min, HEARTBEAT_EVERY_MS = 60 s
//   claimStatus(claim, now)                        -> { state: "free" } | { state: "held", reviewerId, expiresAt } | { state: "released", reason }
//   canClaim({ claim, reviewerId, now })           -> { ok: true } | { ok: false, code, message }
//   heartbeat({ claim, reviewerId, now, visible }) -> { ok: true, claim } | { ok: false, code, message }

export const CLAIM_LEASE_MS = 30 * 60 * 1000;
export const AWAY_RELEASE_MS = 5 * 60 * 1000;
export const HEARTBEAT_EVERY_MS = 60 * 1000;

// hiddenSince is the first moment of the current hidden stretch, or null while the tab is visible.
export type Claim = { reviewerId: string; claimedAt: number; lastHeartbeatAt: number; hiddenSince: number | null };

export type ClaimStatus =
  | { state: "free" }
  | { state: "held"; reviewerId: string; expiresAt: number }
  | { state: "released"; reason: "away" | "lease" };

export function claimStatus(claim: Claim | null, now: number): ClaimStatus {
  if (!claim) return { state: "free" };
  if (claim.hiddenSince !== null && now - claim.hiddenSince >= AWAY_RELEASE_MS) return { state: "released", reason: "away" };
  const expiresAt = claim.lastHeartbeatAt + CLAIM_LEASE_MS;
  if (now >= expiresAt) return { state: "released", reason: "lease" };
  return { state: "held", reviewerId: claim.reviewerId, expiresAt };
}

export type ClaimCheck = { ok: true } | { ok: false; code: "held-by-other" | "already-yours"; message: string };

export function canClaim(input: { claim: Claim | null; reviewerId: string; now: number }): ClaimCheck {
  const status = claimStatus(input.claim, input.now);
  if (status.state !== "held") return { ok: true };
  if (status.reviewerId === input.reviewerId) {
    return { ok: false, code: "already-yours", message: "You already hold this ship." };
  }
  return { ok: false, code: "held-by-other", message: "Another reviewer has this ship." };
}

export type HeartbeatResult = { ok: true; claim: Claim } | { ok: false; code: "not-holder" | "released"; message: string };

export function heartbeat(input: { claim: Claim | null; reviewerId: string; now: number; visible: boolean }): HeartbeatResult {
  const status = claimStatus(input.claim, input.now);
  if (status.state !== "held" || !input.claim) {
    return { ok: false, code: "released", message: "The claim has been released. Claim the ship again to keep working on it." };
  }
  if (input.claim.reviewerId !== input.reviewerId) {
    return { ok: false, code: "not-holder", message: "Another reviewer holds this ship." };
  }
  return {
    ok: true,
    claim: {
      ...input.claim,
      lastHeartbeatAt: input.now,
      hiddenSince: input.visible ? null : (input.claim.hiddenSince ?? input.now),
    },
  };
}
