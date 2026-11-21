// What a scored review from Robert means for a ship. Pure. Ported from Pixl's apps/internal-dashboard/lib/robertOutcome.ts at
// upstream 1468ba6942b13add1ac50e1319541a033ee1df38.
//
// Pixl's rule: Robert's own fraud score IS the fraud determination, so every real score parks the project straight in Spot check as
// "not fraud"; a score of 4 or less (Robert's own "Fraud! Fraud! Fraud!" band) only adds an alert, it never bans or rejects on its
// own. LOADOUT keeps the spirit and drops the write: the score becomes evidence. 4 or less is "flagged" (the desk should look
// hard), anything else is "cleared". Neither moves the project, sets triage or sends a DM; the human triage on the desk is still
// the only thing that decides.
import type { FraudStatus } from "./checks";

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
