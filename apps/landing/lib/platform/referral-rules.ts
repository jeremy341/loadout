// Pure rules for recording and qualifying referrals. No database; every function has a bun test (referral-rules.test.ts).
// The step order and the qualifying rule come from referrals.ts: a referral counts once the referred builder's first ship is approved.
//
// API:
//   canRecordReferral({ referredId, referrerId, referrerBanned, referredAlreadyReferred })
//       -> { ok: true } | { ok: false, code: "self" | "not-found" | "already", reason }
//   canQualify({ referredBanned, alreadyQualified, hasApprovedShip })
//       -> { ok: true } | { ok: false, code: "banned" | "already" | "not-shipped", reason }
//   stepsFromFacts({ verified, tracked, journaled, shipped }) -> ReferralStepKey[]
//       "joined" is always first (the referral row exists). Each later step counts only when every step before it does.
//   qualifiedTitle(referredHandle) -> string      the referrer's notification title (plain text, at most 120)
import { type ReferralStepKey } from "./referrals";
import { clipText } from "./notifications";

export type RecordResult = { ok: true } | { ok: false; code: "self" | "not-found" | "already"; reason: string };
export type QualifyResult = { ok: true } | { ok: false; code: "banned" | "already" | "not-shipped"; reason: string };

export function canRecordReferral({
  referredId,
  referrerId,
  referrerBanned,
  referredAlreadyReferred,
}: {
  referredId: string;
  referrerId: string;
  referrerBanned: boolean;
  referredAlreadyReferred: boolean;
}): RecordResult {
  if (referredId === referrerId) return { ok: false, code: "self", reason: "You cannot refer yourself." };
  if (referrerBanned) return { ok: false, code: "not-found", reason: "That referrer was not found." };
  // One referral per new builder, ever: the first link they came through is the one that counts.
  if (referredAlreadyReferred) return { ok: false, code: "already", reason: "This builder already has a referrer." };
  return { ok: true };
}

export function canQualify({
  referredBanned,
  alreadyQualified,
  hasApprovedShip,
}: {
  referredBanned: boolean;
  alreadyQualified: boolean;
  hasApprovedShip: boolean;
}): QualifyResult {
  if (alreadyQualified) return { ok: false, code: "already", reason: "This referral already counts." };
  if (referredBanned) return { ok: false, code: "banned", reason: "This referral cannot count." };
  if (!hasApprovedShip) return { ok: false, code: "not-shipped", reason: "The referred builder has no approved ship yet." };
  return { ok: true };
}

type LaterStep = Exclude<ReferralStepKey, "joined">;
const LATER_STEPS: readonly LaterStep[] = ["verified", "tracked", "journaled", "shipped"];

export function stepsFromFacts(facts: Record<LaterStep, boolean>): ReferralStepKey[] {
  const done: ReferralStepKey[] = ["joined"];
  for (const step of LATER_STEPS) {
    if (!facts[step]) break;
    done.push(step);
  }
  return done;
}

export function qualifiedTitle(referredHandle: string | null): string {
  return clipText(`${referredHandle ?? "A builder"} you referred earned a first approved ship`, 120);
}
