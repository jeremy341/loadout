import type { EligibilityResult, EligibilityStatus, VerificationLabel } from "./engine";

export const ELIGIBILITY_FILTERS: EligibilityStatus[] = ["covered", "insufficient", "unverified", "review_required", "restricted"];

export const ELIGIBILITY_LABEL: Record<EligibilityStatus, string> = {
  covered: "Covered",
  insufficient: "Insufficient",
  unverified: "Unverified",
  review_required: "Review required",
  restricted: "Restricted",
};

export const ELIGIBILITY_SHORT: Record<EligibilityStatus, string> = {
  covered: "Covered",
  insufficient: "Insufficient",
  unverified: "Unverified",
  review_required: "Review",
  restricted: "Restricted",
};

export const ELIGIBILITY_TONE: Record<EligibilityStatus, "success" | "danger" | "warning" | "purple" | "neutral"> = {
  covered: "success",
  insufficient: "danger",
  unverified: "warning",
  review_required: "purple",
  restricted: "danger",
};

export const ELIGIBILITY_HINT: Record<EligibilityStatus, string> = {
  covered: "The builder's Ore cover this order",
  insufficient: "The builder's Ore are below the order",
  unverified: "Approved hours not established",
  review_required: "Needs a policy decision",
  restricted: "A restriction blocks fulfilment",
};

export function parseEligibilityFilter(v: string | undefined): EligibilityStatus | null {
  return ELIGIBILITY_FILTERS.includes(v as EligibilityStatus) ? (v as EligibilityStatus) : null;
}

export function usd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export const VERIFICATION_FILTERS: VerificationLabel[] = [
  "verified",
  "pending_submission",
  "not_found",
  "approval_unconfirmed",
  "needs_review",
  "unavailable",
];

export const VERIFICATION_LABEL: Record<VerificationLabel, string> = {
  verified: "Approved ship confirmed",
  approval_unconfirmed: "Approval unconfirmed",
  pending_submission: "Ship not yet submitted",
  not_found: "No approved ship found",
  unavailable: "Check unavailable",
  needs_review: "Needs review",
};

export const VERIFICATION_TONE: Record<VerificationLabel, "success" | "danger" | "warning" | "purple" | "neutral"> = {
  verified: "success",
  approval_unconfirmed: "warning",
  pending_submission: "neutral",
  not_found: "warning",
  unavailable: "warning",
  needs_review: "purple",
};

export function parseVerificationFilter(v: string | undefined): VerificationLabel | null {
  return VERIFICATION_FILTERS.includes(v as VerificationLabel) ? (v as VerificationLabel) : null;
}

export const SORT_KEYS = ["newest", "shortfall", "remaining", "hours"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABEL: Record<SortKey, string> = {
  newest: "Newest",
  shortfall: "Biggest shortfall",
  remaining: "Most left after order",
  hours: "Most approved hours",
};

export function parseSort(v: string | undefined): SortKey {
  return SORT_KEYS.includes(v as SortKey) ? (v as SortKey) : "newest";
}

export function listSummary(r: EligibilityResult | null): string {
  if (!r) return "Evidence unavailable";
  if (r.status === "restricted") return "Restriction blocks fulfilment";
  if (r.status === "review_required") return "Policy review required";
  if (r.status === "unverified") return "Ore not established";
  if (r.verification !== "verified") return VERIFICATION_LABEL[r.verification];
  const hours = `${r.verifiedHours % 1 === 0 ? r.verifiedHours.toFixed(0) : r.verifiedHours.toFixed(1)}h`;
  if (r.status === "insufficient" || r.afterCents < 0) return `${hours} · short ${usd(-r.afterCents)}`;
  return `${hours} · ${usd(r.afterCents)} left`;
}

export function sortKeyValue(r: EligibilityResult | undefined, key: SortKey): number {
  if (!r) return Number.NEGATIVE_INFINITY;
  if (key === "shortfall") return -r.afterCents;
  if (key === "remaining") return r.afterCents;
  if (key === "hours") return r.verifiedHours;
  return 0;
}

export function syncAgeText(ms: number | null): string {
  if (ms == null) return "never";
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}
