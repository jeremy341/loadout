// Live values that are not yet confirmed: eligibility, dates, stock, prices and delivery. Staging shows these as provisional so nobody
// reads a working value as final (see docs/development/staging-posture.md). Every such value carries its source and the label below.
// This file never decides a value; it only marks one.

export const PROVISIONAL_KINDS = ["eligibility", "dates", "stock", "price", "delivery"] as const;
export type ProvisionalKind = (typeof PROVISIONAL_KINDS)[number];

export const PROVISIONAL_LABEL = "Provisional, not confirmed";

export type ProvisionalValue<T> = {
  value: T;
  kind: ProvisionalKind;
  provisional: true;
  /** Where the working value came from, e.g. "owner working value" or "placeholder". Shown next to the label. */
  source: string;
  label: typeof PROVISIONAL_LABEL;
};

export function provisional<T>(kind: ProvisionalKind, value: T, source: string): ProvisionalValue<T> {
  return { value, kind, provisional: true, source: source.trim() || "unspecified", label: PROVISIONAL_LABEL };
}

/** True only for a value that is explicitly not provisional. Anything unmarked is treated as not final either. */
export function isFinal(value: { provisional?: boolean } | null | undefined): boolean {
  return value != null && value.provisional === false;
}

/** The text a screen shows beside a provisional value, e.g. "£5.00 (Provisional, not confirmed: owner working value)". */
export function formatProvisional(value: ProvisionalValue<string | number>): string {
  return `${value.value} (${value.label}: ${value.source})`;
}
