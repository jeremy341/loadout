// Age and eligibility rules. Pure: no database, no clock of its own. Policy: under 19 (owner, 16 Nov 2026), and 13 or over (the
// program's documented lower bound: LOADOUT is for ages 13 to 18).
export const AGE_MIN = 13;
export const AGE_LIMIT = 19;

export type EligibilityState = "ok" | "too_young" | "too_old" | "missing_birthday" | "unverified";

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

// Order matters: a missing birthday is asked for before anything else; a birthday in the future is treated as missing,
// because it cannot be right. A builder under 13 is refused (too_young), apart from a missing birthday. A builder aged 19 or
// over is sent to manual review, not rejected (too_old).
export function eligibilityState(input: {
  birthday: Date | null | undefined;
  verificationStatus: string | null | undefined;
  on: Date;
}): EligibilityState {
  const { birthday, verificationStatus, on } = input;
  if (!birthday || Number.isNaN(birthday.getTime())) return "missing_birthday";
  const age = ageOn(birthday, on);
  if (age < 0) return "missing_birthday";
  if (age < AGE_MIN) return "too_young";
  if (age >= AGE_LIMIT) return "too_old";
  if (!isVerified(verificationStatus)) return "unverified";
  return "ok";
}

export const ELIGIBILITY_MESSAGES: Record<EligibilityState, string> = {
  ok: "Your account is eligible.",
  too_young: "LOADOUT is for ages 13 to 18.",
  too_old: "Your account is past the age limit for LOADOUT, so a reviewer will look at your projects by hand.",
  missing_birthday: "We need your birthday from Hack Club Auth to check eligibility. Sign in again to share it.",
  unverified: "Hack Club Auth has not verified your identity yet. Finish verification there, then sign in again.",
};

export function eligibilityMessage(state: EligibilityState): string {
  return ELIGIBILITY_MESSAGES[state];
}
