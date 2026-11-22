// What a scored review from Robert means for a ship. Pure. Ported from Pixl's apps/internal-dashboard/lib/robertOutcome.ts at
// upstream 1468ba6942b13add1ac50e1319541a033ee1df38.
//
// Robert's score gates progression (plans/proposals/platform-parity-pixl.md, step 2.2). A first-pass approval parks the ship in
// PARKED_STATUS; any real 1-10 score moves it on to the second pass. A score above 4 is "cleared", and 4 or less is "flagged": the
// flagged FraudCheck row is the alert the final reviewer reads, not a park. Pixl does the same — a low score never bans or rejects on
// its own. There is no human fraud triage.
import type { FraudStatus } from "./checks";

// Both score bands advance the ship: a flagged score is an alert, not a park. The type stays for callers and tests.
export type ScoreMove = "advance" | "hold";
export function scoreMoveFor(_status: Extract<FraudStatus, "cleared" | "flagged">): ScoreMove {
  return "advance";
}

// Robert's own "Fraud" band (its docs: 1-4).
export const FRAUD_SCORE_THRESHOLD = 4;

export const isFraudRangeScore = (trustScore: number): boolean => trustScore <= FRAUD_SCORE_THRESHOLD;

export type IncomingReview = {
  trustScore: number;
  note: string;
  reviewedAt: string;
  // Robert's state when the review was read: awaiting_outcome (above 4, nobody has decided), rejected_fraud (4 or less, final
  // there) or decided.
  robertState: string;
};

export type ReviewVerdict = { status: Extract<FraudStatus, "cleared" | "flagged">; score: number; summary: string };

// null when there is no real 1-10 score to record (a malformed or missing one), mirroring Pixl's Number.isFinite guard.
export function verdictFor(review: IncomingReview): ReviewVerdict | null {
  const score = review.trustScore;
  if (!Number.isFinite(score) || score < 1 || score > 10) return null;
  const rounded = Math.round(score);
  return isFraudRangeScore(score)
    ? { status: "flagged", score: rounded, summary: `Telescreen scored this ${rounded}/10, in its fraud range (1-${FRAUD_SCORE_THRESHOLD}). Read its note before crediting.` }
    : { status: "cleared", score: rounded, summary: `Telescreen scored this ${rounded}/10.` };
}
