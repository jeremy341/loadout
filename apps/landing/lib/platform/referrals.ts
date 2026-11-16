// Referrals (plans/02 section 16, plans/proposals/future-platform-ui.md). A referral counts real builders, not accounts: it
// qualifies only after the referred builder verifies, tracks and journals real work, and earns a first approved ship. The
// reward amounts and the milestone ladder are open, so nothing here states one. The page has no invite link and no referred
// builders yet, and it says so.

export const REFERRAL_STEPS = [
  { key: "joined", label: "Joins", note: "They sign up through your link." },
  { key: "verified", label: "Verifies", note: "They finish Hack Club teen verification." },
  { key: "tracked", label: "Tracks work", note: "They log real, reviewable work on a project." },
  { key: "journaled", label: "Journals", note: "They write journal entries as they build." },
  { key: "shipped", label: "First approved ship", note: "A reviewer approves their first ship. This is when the referral counts." },
] as const;

export type ReferralStepKey = (typeof REFERRAL_STEPS)[number]["key"];

export const REFERRAL_LINK_SENTENCE = "Referral links open with the platform release.";
export const NO_REWARD_SENTENCE = "The reward for a qualifying referral has not been set.";

// One person who joined through a link, with the steps they have finished. The list is empty in this release; the type is
// here so the page and its helpers are written once for the real data.
export type ReferredBuilder = { handle: string; completed: readonly ReferralStepKey[] };

export const REFERRED_BUILDERS: readonly ReferredBuilder[] = [];

// The steps finished in order. A step counts only when every step before it is also finished, so a skipped or reordered
// record cannot make a referral look further along than it is.
export function stepsReached(completed: readonly ReferralStepKey[]): number {
  let reached = 0;
  for (const step of REFERRAL_STEPS) {
    if (!completed.includes(step.key)) break;
    reached += 1;
  }
  return reached;
}

// The referral counts only when the first approved ship is reached, which needs every step before it.
export function qualifies(completed: readonly ReferralStepKey[]): boolean {
  return stepsReached(completed) === REFERRAL_STEPS.length;
}

// The step the referred builder is on, or null once the referral has qualified.
export function nextStep(completed: readonly ReferralStepKey[]): (typeof REFERRAL_STEPS)[number] | null {
  return REFERRAL_STEPS[stepsReached(completed)] ?? null;
}

export type ReferralStatus = "waiting" | "qualified";

export function referralStatus(completed: readonly ReferralStepKey[]): ReferralStatus {
  return qualifies(completed) ? "qualified" : "waiting";
}

export type ReferralTotals = { referred: number; qualified: number; waiting: number };

export function referralTotals(builders: readonly ReferredBuilder[]): ReferralTotals {
  const qualified = builders.filter((builder) => qualifies(builder.completed)).length;
  return { referred: builders.length, qualified, waiting: builders.length - qualified };
}
