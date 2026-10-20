import type { TrackName } from "../../../../lib/sample/builders";
import { TRACKS } from "../data";
import type { PriceableItem } from "./pricing";

// Custom Orders (plans/02 section 28). The request, review and quote mechanism is agreed. Level tiers, limits,
// quote validity, the sourcing formula and buyer-cancellation terms are NOT, so this preview records a request and
// lets a "Preview tools" step stand in for the team's review. A quote is entered by hand, never computed here.

export type CustomStatus = "requested" | "in-review" | "approved" | "declined" | "ordered" | "withdrawn";

export const CUSTOM_STATUS_LABELS: Record<CustomStatus, string> = {
  requested: "Requested",
  "in-review": "In review",
  approved: "Quote ready",
  declined: "Declined",
  ordered: "Ordered",
  withdrawn: "Withdrawn",
};

export const CURRENCIES = ["EUR", "USD", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export interface CustomRequest {
  id: string;
  item: string;
  url: string;
  why: string;
  estimate: number;
  currency: Currency;
  tracks: TrackName[];
  status: CustomStatus;
  history: { status: CustomStatus; at: string }[];
  /** Ore quote entered in Preview tools. Null until approved. */
  quote: number | null;
  /** Whether the approved quote marks Requisitions as allowed (plans/02 section 28.3). */
  quoteAllowsRequisition: boolean;
  orderId: string | null;
  createdAt: string;
}

export interface CustomInput {
  item: string;
  url: string;
  why: string;
  estimate: string;
  currency: string;
  tracks: readonly string[];
}

export type CustomErrors = Partial<Record<"item" | "url" | "why" | "estimate" | "tracks", string>>;

export const WHY_MIN = 20;
export const WHY_MAX = 500;

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateCustomInput(input: CustomInput): CustomErrors {
  const errors: CustomErrors = {};
  const item = input.item.trim();
  if (item.length < 3 || item.length > 80) errors.item = "Describe the item in 3 to 80 characters.";
  if (!isHttpUrl(input.url)) errors.url = "Enter a link that starts with http:// or https://.";
  const why = input.why.trim();
  if (why.length < WHY_MIN) errors.why = `Explain what building capability it adds, in at least ${WHY_MIN} characters.`;
  else if (why.length > WHY_MAX) errors.why = `Keep it to ${WHY_MAX} characters.`;
  const estimate = Number(input.estimate.trim().replace(/,/g, ""));
  if (!input.estimate.trim() || !Number.isFinite(estimate) || estimate <= 0 || estimate > 100000) {
    errors.estimate = "Enter an estimated price above 0 and up to 100,000.";
  }
  if (!input.tracks.some((track) => (TRACKS as readonly string[]).includes(track))) errors.tracks = "Choose at least one track the item helps.";
  return errors;
}

export function createCustomRequest(input: CustomInput, id: string, now: string): { ok: true; request: CustomRequest } | { ok: false; errors: CustomErrors } {
  const errors = validateCustomInput(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const currency = (CURRENCIES as readonly string[]).includes(input.currency) ? (input.currency as Currency) : "EUR";
  return {
    ok: true,
    request: {
      id,
      item: input.item.trim(),
      url: input.url.trim(),
      why: input.why.trim(),
      estimate: Math.round(Number(input.estimate.trim().replace(/,/g, "")) * 100) / 100,
      currency,
      tracks: TRACKS.filter((track) => input.tracks.includes(track)),
      status: "requested",
      history: [{ status: "requested", at: now }],
      quote: null,
      quoteAllowsRequisition: false,
      orderId: null,
      createdAt: now,
    },
  };
}

function move(list: readonly CustomRequest[], id: string, from: readonly CustomStatus[], patch: Partial<CustomRequest> & { status: CustomStatus }, now: string): CustomRequest[] {
  return list.map((request) =>
    request.id === id && from.includes(request.status)
      ? { ...request, ...patch, history: [...request.history, { status: patch.status, at: now }] }
      : request,
  );
}

/** Preview tools: the team starts reviewing. */
export function startReview(list: readonly CustomRequest[], id: string, now: string): CustomRequest[] {
  return move(list, id, ["requested"], { status: "in-review" }, now);
}

export function approveQuote(
  list: readonly CustomRequest[],
  id: string,
  rawQuote: string | number,
  allowsRequisition: boolean,
  now: string,
): { ok: true; list: CustomRequest[] } | { ok: false; error: string } {
  const quote = typeof rawQuote === "number" ? rawQuote : Number(String(rawQuote).trim());
  if (!Number.isInteger(quote) || quote < 1 || quote > 1_000_000) return { ok: false, error: "Enter a whole Ore quote from 1 to 1,000,000." };
  if (list.find((request) => request.id === id)?.status !== "in-review") return { ok: false, error: "Only a request that is in review can get a quote." };
  return { ok: true, list: move(list, id, ["in-review"], { status: "approved", quote, quoteAllowsRequisition: allowsRequisition }, now) };
}

export function declineRequest(list: readonly CustomRequest[], id: string, now: string): CustomRequest[] {
  return move(list, id, ["requested", "in-review"], { status: "declined" }, now);
}

export function withdrawRequest(list: readonly CustomRequest[], id: string, now: string): CustomRequest[] {
  return move(list, id, ["requested", "in-review", "approved"], { status: "withdrawn" }, now);
}

export function markOrdered(list: readonly CustomRequest[], id: string, orderId: string, now: string): CustomRequest[] {
  return move(list, id, ["approved"], { status: "ordered", orderId }, now);
}

/** The approved quote as something the shop can price. Null until a quote exists. */
export function quoteItem(request: CustomRequest): PriceableItem | null {
  if (request.quote === null || request.status !== "approved") return null;
  return {
    id: `custom:${request.id}`,
    name: `Custom Order: ${request.item}`,
    basePrice: request.quote,
    tracks: request.tracks,
    requisitionEligible: request.quoteAllowsRequisition,
  };
}

export function isActive(request: CustomRequest): boolean {
  return request.status === "requested" || request.status === "in-review" || request.status === "approved";
}
