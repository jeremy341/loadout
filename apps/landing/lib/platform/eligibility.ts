// Eligibility rules. Pure: no database, no clock of its own. A builder is eligible when Hack Club Auth reports their identity
// as "verified". That status is the YSWS eligibility for ages 13 to 18, and it lapses on the 19th birthday, so the app does not
// check the birthday itself. The age helpers below are kept for the shipping rule in review-rules.ts (under 19 when the project
// shipped), which is a separate policy.
export const AGE_LIMIT = 19;

export type EligibilityState = "ok" | "unverified";

// Whole years lived on the day `on`, counted by calendar date in UTC. A 29 Feb birthday passes on 1 Mar in common years.
export function ageOn(birthday: Date, on: Date): number {
  const by = birthday.getUTCFullYear();
  const bm = birthday.getUTCMonth();
  const bd = birthday.getUTCDate();
  let years = on.getUTCFullYear() - by;
  const om = on.getUTCMonth();
  const od = on.getUTCDate();
  if (om < bm || (om === bm && od < bd)) years -= 1;
  return years;
}

export function isUnder19(birthday: Date, on: Date): boolean {
  const age = ageOn(birthday, on);
  return age >= 0 && age < AGE_LIMIT;
}

// HCA says "verified" once identity checks pass. Anything else (pending, needs_submission, ineligible, empty) is not enough.
export function isVerified(status: string | null | undefined): boolean {
  return typeof status === "string" && status.trim().toLowerCase() === "verified";
}

export function eligibilityState(input: { verificationStatus: string | null | undefined }): EligibilityState {
  return isVerified(input.verificationStatus) ? "ok" : "unverified";
}

export const ELIGIBILITY_MESSAGES: Record<EligibilityState, string> = {
  ok: "Your account is eligible.",
  unverified: "Hack Club Auth has not verified your identity yet. Finish verification there, then sign in again.",
};

export function eligibilityMessage(state: EligibilityState): string {
  return ELIGIBILITY_MESSAGES[state];
}
