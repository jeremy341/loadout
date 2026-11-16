import { BUILDERS } from "../platform/community";
import { orderById, orderLines, orderSummary, type Order, type OrderLine, type OrderStatus } from "../platform/orders";
import { TRACKS, type Track } from "../platform/progress";
import { paginate, parsePage, type Page } from "../platform/review";
import { BULK_ORDERS, BULK_PLAYERS, BULK_TICKETS, type OrderSeed, type TicketSeed } from "../platform/review-fixtures-bulk";
import { ORE_PER_HOUR, sampleApprovedHours, type TrackHours } from "../platform/shop";
import { canSeeBuyerDetails, claimedBy, isOwnOrder, type OrderOwnership } from "./access";

// Fulfilment for the reviewer site: the orders to buy, pack and post, the people who do it, and builder support tickets. Pixl's
// fulfillment, fulfillers and tickets pages (references/pixl/apps/internal-dashboard, as of 5 Nov 2026) are the structural
// reference. Everything is a typed fixture: no order, ticket or address exists yet, and nothing here can be saved. The first
// three orders are the participant side's own sample orders (lib/platform/orders.ts), with the same catalog ids and the shop's
// own prices, so a builder and a fulfiller see one story. Prices follow the shop: 10 Ore = $4.35.
//
// Privacy, after Pixl's lib/fulfillmentAccess.ts: the buyer's name, contact details and address are shown only to the fulfiller
// who claimed that order, or to an owner. Everyone else sees the country. The rule itself is in lib/reviewer/access.ts; this
// file only maps the signed-in person onto the fixture people (see fixturePersonFor).

export const SAMPLE_SENTENCE = "Sample content. The orders, people and tickets on this page are invented, and nothing here is saved.";
export const DISABLED_SENTENCE = "Opens with the review service. Nothing here is saved.";

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

// ---- Stages ----

// Pixl's pipeline is New, Ordered, Credited, Shipped, Done and Cancelled. LOADOUT's fulfiller buys the item when they claim it,
// records the real cost when it is packed, and adds the carrier and tracking when it ships. The builder's own order history
// keeps its four words (Placed, Packed, Shipped, Delivered).
export const FULFILMENT_STATUSES = ["new", "claimed", "packed", "shipped", "delivered", "cancelled"] as const;
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];
export const FULFILMENT_STATUS_LABELS: Record<FulfilmentStatus, string> = {
  new: "New",
  claimed: "Claimed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export const FULFILMENT_STATUS_HINTS: Record<FulfilmentStatus, string> = {
  new: "Order received",
  claimed: "A fulfiller has it",
  packed: "Bought and packed",
  shipped: "Tracking added",
  delivered: "Arrived",
  cancelled: "Ore refunded",
};
// The steps of the progress strip. Cancelled is not a step.
export const FULFILMENT_STEPS = ["new", "claimed", "packed", "shipped", "delivered"] as const satisfies readonly FulfilmentStatus[];

// The builder's history has four statuses. Placed is New or Claimed (the team has not packed it yet).
export function fromParticipantStatus(status: OrderStatus): FulfilmentStatus {
  return status === "placed" ? "new" : status;
}

export function toParticipantStatus(status: FulfilmentStatus): OrderStatus | null {
  if (status === "cancelled") return null;
  return status === "new" || status === "claimed" ? "placed" : status;
}

export function isClosed(status: FulfilmentStatus): boolean {
  return status === "delivered" || status === "cancelled";
}

// ---- Orders ----

export type OrderFlag = { reason: string; by: string; hoursAgo: number };

export type FulfilmentOrder = {
  id: string;
  number: string;
  /** The builder's public handle. */
  buyer: string;
  /** The country only. No street, town or postcode is ever shown without the privacy check. */
  country: string;
  status: FulfilmentStatus;
  placedHoursAgo: number;
  claimedHoursAgo?: number;
  packedHoursAgo?: number;
  shippedHoursAgo?: number;
  deliveredHoursAgo?: number;
  /** A fulfiller id, or null while nobody has taken it. */
  assignee: string | null;
  lines: readonly OrderLine[];
  /** What the fulfiller really paid, in US dollars, once the order is packed. */
  actualCostUsd?: number;
  /** Where it was bought, as a plain name. */
  source?: string;
  carrier?: string;
  tracking?: string;
  /** Raised by the fulfiller who could not source the item within the budget; an owner clears it. */
  flag?: OrderFlag;
  buyerNote?: string;
  /** Why a cancelled order was cancelled. */
  note?: string;
};

// Approved hours behind each buyer's prices. kestrel42 is the participant sample: the same hours the Overview shows.
const SAMPLE_BUYER = "kestrel42";
// The seeded local test fulfiller is also a builder in the sample, so the "your own order" rule can be seen.
const SAMPLE_FULFILLER_BUYER_HOURS: TrackHours = { Tools: 12, Systems: 0, Compute: 0, Hardware: 4 };
export function approvedHoursFor(handle: string): TrackHours {
  if (handle === SAMPLE_BUYER) return sampleApprovedHours();
  if (handle === SAMPLE_FULFILLER_ID) return { ...SAMPLE_FULFILLER_BUYER_HOURS };
  const generated = BULK_PLAYERS.find((item) => item.handle === handle);
  if (generated) return { Tools: generated.approved[0], Systems: generated.approved[1], Compute: generated.approved[2], Hardware: generated.approved[3] };
  const builder = BUILDERS.find((item) => item.handle === handle);
  return builder ? { ...builder.allTime } : (Object.fromEntries(TRACKS.map((track) => [track, 0])) as TrackHours);
}

// Hours still in review, and the Ore already spent before any order below. Both are sample figures for the funding check.
type BuyerBooks = { pendingHours: number; spentBefore: number };
const BUYER_BOOKS: Record<string, BuyerBooks> = {
  kestrel42: { pendingHours: 6, spentBefore: 0 },
  tinwren: { pendingHours: 0, spentBefore: 700 },
  quartzfox: { pendingHours: 4, spentBefore: 900 },
  brasskettle: { pendingHours: 0, spentBefore: 650 },
  mothvector: { pendingHours: 0, spentBefore: 1200 },
  picopilgrim: { pendingHours: 3, spentBefore: 560 },
  solderbee: { pendingHours: 4, spentBefore: 560 },
  lathelark: { pendingHours: 2, spentBefore: 820 },
  nullwisp: { pendingHours: 5, spentBefore: 560 },
  examplepack: { pendingHours: 0, spentBefore: 0 },
};
export function booksFor(handle: string): BuyerBooks {
  return BUYER_BOOKS[handle] ?? { pendingHours: 0, spentBefore: 0 };
}

const participant = (id: string, rest: Omit<FulfilmentOrder, "id" | "number" | "lines" | "status" | "buyer">): FulfilmentOrder => {
  const source = orderById(id);
  if (!source) throw new Error(`Missing participant order ${id}`);
  return { id, number: source.number, buyer: SAMPLE_BUYER, status: fromParticipantStatus(source.status), lines: source.lines, ...rest };
};
const make = (id: string, rest: Omit<FulfilmentOrder, "id" | "number">): FulfilmentOrder => ({ id, number: id.toUpperCase(), ...rest });
const one = (itemId: string, quantity = 1): OrderLine => ({ itemId, quantity });

const HAND_ORDERS: readonly FulfilmentOrder[] = [
  participant("lo-1042", {
    country: "Germany",
    placedHoursAgo: 700,
    claimedHoursAgo: 690,
    packedHoursAgo: 680,
    shippedHoursAgo: 650,
    deliveredHoursAgo: 620,
    assignee: "tamsin",
    actualCostUsd: 24.9,
    source: "Sample parts shop",
    carrier: "Sample Post",
    tracking: "SP-1042-0001",
  }),
  participant("lo-1057", {
    country: "Germany",
    placedHoursAgo: 240,
    claimedHoursAgo: 230,
    packedHoursAgo: 215,
    shippedHoursAgo: 190,
    assignee: "tamsin",
    actualCostUsd: 32.4,
    source: "Sample keyboard maker",
    carrier: "Sample Express",
    tracking: "SE-1057-0042",
  }),
  participant("lo-1063", {
    country: "Germany",
    placedHoursAgo: 60,
    claimedHoursAgo: 50,
    packedHoursAgo: 20,
    assignee: "tamsin",
    actualCostUsd: 31.9,
    source: "Sample parts shop",
  }),
  make("lo-1058", { buyer: "tinwren", country: "United Kingdom", status: "new", placedHoursAgo: 30, assignee: null, lines: [one("pi-zero-2-w"), one("breadboard-kit")] }),
  make("lo-1059", { buyer: "quartzfox", country: "Germany", status: "new", placedHoursAgo: 18, assignee: null, lines: [one("security-key")] }),
  make("lo-1060", {
    buyer: "solderbee",
    country: "United States",
    status: "new",
    placedHoursAgo: 9,
    assignee: null,
    lines: [one("soldering-iron-kit"), one("multimeter")],
    buyerNote: "Either colour of the multimeter is fine.",
  }),
  make("lo-1071", { buyer: "nullwisp", country: "United States", status: "new", placedHoursAgo: 3, assignee: null, lines: [one("raspberry-pi-5")] }),
  make("lo-1073", { buyer: "examplepack", country: "Canada", status: "new", placedHoursAgo: 5, assignee: null, lines: [one("cable-kit")] }),
  make("lo-1061", {
    buyer: "brasskettle",
    country: "Netherlands",
    status: "claimed",
    placedHoursAgo: 46,
    claimedHoursAgo: 30,
    assignee: "saltmarsh",
    lines: [one("esp32-starter-kit", 2)],
  }),
  make("lo-1062", {
    buyer: "picopilgrim",
    country: "Canada",
    status: "packed",
    placedHoursAgo: 71,
    claimedHoursAgo: 60,
    packedHoursAgo: 35,
    assignee: "examplepack",
    lines: [one("pico-w", 3)],
    actualCostUsd: 15.9,
    source: "Sample parts shop",
  }),
  make("lo-1064", {
    buyer: "mothvector",
    country: "Poland",
    status: "claimed",
    placedHoursAgo: 130,
    claimedHoursAgo: 100,
    assignee: "tamsin",
    lines: [one("arduino-uno")],
    buyerNote: "I typed the wrong country when I ordered. Please check with me before it goes out.",
  }),
  make("lo-1065", {
    buyer: "lathelark",
    country: "United Kingdom",
    status: "claimed",
    placedHoursAgo: 200,
    claimedHoursAgo: 180,
    assignee: "saltmarsh",
    lines: [one("usb-microscope")],
    flag: { reason: "The cheapest I found is $84.00 at a sample supplier, and a refurbished unit is out of stock.", by: "saltmarsh", hoursAgo: 150 },
  }),
  make("lo-1066", {
    buyer: "nullwisp",
    country: "United States",
    status: "shipped",
    placedHoursAgo: 150,
    claimedHoursAgo: 140,
    packedHoursAgo: 125,
    shippedHoursAgo: 110,
    assignee: "deskcrate",
    lines: [one("calipers")],
    actualCostUsd: 19.8,
    source: "Sample tool shop",
    carrier: "Sample Express",
    tracking: "SE-1066-0007",
  }),
  make("lo-1067", {
    buyer: "tinwren",
    country: "United Kingdom",
    status: "shipped",
    placedHoursAgo: 300,
    claimedHoursAgo: 290,
    packedHoursAgo: 280,
    shippedHoursAgo: 260,
    assignee: "saltmarsh",
    lines: [one("macropad-kit")],
    actualCostUsd: 22.1,
    source: "Sample kit maker",
    carrier: "Sample Post",
    tracking: "SP-1067-0019",
  }),
  make("lo-1068", {
    buyer: "quartzfox",
    country: "Germany",
    status: "shipped",
    placedHoursAgo: 170,
    claimedHoursAgo: 160,
    packedHoursAgo: 140,
    shippedHoursAgo: 120,
    assignee: "tamsin",
    lines: [one("logic-analyzer"), one("debug-probe")],
    actualCostUsd: 31.5,
    source: "Sample parts shop",
    carrier: "Sample Post",
    tracking: "SP-1068-0033",
  }),
  make("lo-1069", {
    buyer: "brasskettle",
    country: "Netherlands",
    status: "delivered",
    placedHoursAgo: 520,
    claimedHoursAgo: 510,
    packedHoursAgo: 500,
    shippedHoursAgo: 480,
    deliveredHoursAgo: 440,
    assignee: "saltmarsh",
    lines: [one("sensor-kit")],
    actualCostUsd: 22.4,
    source: "Sample parts shop",
    carrier: "Sample Post",
    tracking: "SP-1069-0004",
  }),
  make("lo-1070", {
    buyer: "solderbee",
    country: "United States",
    status: "delivered",
    placedHoursAgo: 600,
    claimedHoursAgo: 590,
    packedHoursAgo: 580,
    shippedHoursAgo: 560,
    deliveredHoursAgo: 520,
    assignee: "deskcrate",
    lines: [one("pinecil")],
    actualCostUsd: 36.0,
    source: "Sample tool shop",
    carrier: "Sample Express",
    tracking: "SE-1070-0021",
  }),
  make("lo-1072", {
    buyer: "picopilgrim",
    country: "Canada",
    status: "cancelled",
    placedHoursAgo: 400,
    assignee: null,
    lines: [one("multimeter")],
    note: "Cancelled at the builder's request before anyone claimed it. The Ore were refunded.",
  }),
];

// Generated orders for the list pages (review-fixtures-bulk.ts): every stamp follows the stage, and only a new or cancelled order has no fulfiller.
function bulkOrder(seed: OrderSeed): FulfilmentOrder {
  const id = `lo-${seed.number}`;
  const lines = seed.items.map(([itemId, quantity]) => one(itemId, quantity));
  const placed = seed.placedHoursAgo;
  const base = { buyer: seed.buyer, country: seed.country, status: seed.status, placedHoursAgo: placed, lines };
  switch (seed.status) {
    case "new":
      return make(id, { ...base, assignee: null });
    case "cancelled":
      return make(id, { ...base, assignee: null, note: "The buyer cancelled before it was claimed." });
    case "claimed":
      return make(id, { ...base, assignee: seed.assignee, claimedHoursAgo: placed - 8 });
    case "packed":
      return make(id, { ...base, assignee: seed.assignee, claimedHoursAgo: placed - 8, packedHoursAgo: placed - 30, actualCostUsd: 18.5, source: "Sample parts shop" });
    case "shipped":
      return make(id, { ...base, assignee: seed.assignee, claimedHoursAgo: placed - 8, packedHoursAgo: placed - 30, shippedHoursAgo: placed - 60, actualCostUsd: 18.5, source: "Sample parts shop", carrier: "Sample Post", tracking: `SP-${seed.number}-0001` });
    default:
      return make(id, { ...base, assignee: seed.assignee, claimedHoursAgo: placed - 8, packedHoursAgo: placed - 30, shippedHoursAgo: placed - 60, deliveredHoursAgo: placed - 120, actualCostUsd: 18.5, source: "Sample parts shop", carrier: "Sample Post", tracking: `SP-${seed.number}-0001` });
  }
}

export const FULFILMENT_ORDERS: readonly FulfilmentOrder[] = [...HAND_ORDERS, ...BULK_ORDERS.map(bulkOrder)];

export function fulfilmentOrderById(id: string): FulfilmentOrder | null {
  return FULFILMENT_ORDERS.find((order) => order.id === id) ?? null;
}

// The participant-side Order shape, so the shop's own helpers price the lines.
function asOrder(order: FulfilmentOrder): Order {
  return { id: order.id, number: order.number, status: "placed", lines: order.lines };
}

// Lines with the catalog item and the price the builder pays at their own level.
export function linesFor(order: FulfilmentOrder) {
  return orderLines(asOrder(order), approvedHoursFor(order.buyer));
}

export function summaryFor(order: FulfilmentOrder): string {
  return orderSummary(asOrder(order), approvedHoursFor(order.buyer));
}

export function oreTotal(order: FulfilmentOrder): number {
  return linesFor(order).reduce((sum, line) => sum + line.total, 0);
}

export function itemTotal(order: FulfilmentOrder): number {
  return linesFor(order).reduce((sum, line) => sum + line.quantity, 0);
}

// 10 Ore = $4.35, so one Ore is $0.435. Whole cents, as the shop shows them.
export function oreToCents(ore: number): number {
  return Math.round((Math.max(0, ore) * 435) / 10);
}

export function oreToUsd(ore: number): string {
  return `$${(oreToCents(ore) / 100).toFixed(2)}`;
}

export function formatOre(ore: number): string {
  return `${ore.toLocaleString("en-GB")} Ore`;
}

export function formatUsd(cents: number): string {
  return `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

// The most a fulfiller should pay: the order's Ore total at the shop rate. Above it, flag the order instead of buying.
export function budgetCents(order: FulfilmentOrder): number {
  return oreToCents(oreTotal(order));
}

export function budgetUsd(order: FulfilmentOrder): string {
  return formatUsd(budgetCents(order));
}

export function costCents(order: FulfilmentOrder): number | null {
  return order.actualCostUsd === undefined ? null : Math.round(order.actualCostUsd * 100);
}

// The real cost came in above the budget.
export function isOverBudget(order: FulfilmentOrder): boolean {
  const cost = costCents(order);
  return cost !== null && cost > budgetCents(order);
}

// The newest thing that happened to an order, as hours ago.
export function lastUpdatedHours(order: FulfilmentOrder): number {
  const stamps = [order.placedHoursAgo, order.claimedHoursAgo, order.packedHoursAgo, order.shippedHoursAgo, order.deliveredHoursAgo, order.flag?.hoursAgo];
  return Math.min(...stamps.filter((value): value is number => typeof value === "number"));
}

// The hours-ago stamp for a stage, or null if the order never reached it.
export function stageStamp(order: FulfilmentOrder, stage: FulfilmentStatus): number | null {
  const value = {
    new: order.placedHoursAgo,
    claimed: order.claimedHoursAgo,
    packed: order.packedHoursAgo,
    shipped: order.shippedHoursAgo,
    delivered: order.deliveredHoursAgo,
    cancelled: undefined,
  }[stage];
  return value ?? null;
}

// ---- Who sees what ----

// The signed-in person, as the pages know them: the person id and owner flag from requireAccess, and the email.
export type FulfilmentViewer = { personId: string; isOwner: boolean; email: string };

// The fixtures cannot hold real person ids (they are generated per database), so the seeded local test fulfiller stands in for
// one fixture fulfiller. That is what lets a fulfiller see one claimed order with details and every other order country-only.
export const SAMPLE_FULFILLER_EMAIL = "fulfiller@loadout.test";
export const SAMPLE_FULFILLER_ID = "examplepack";

// The fixture person a signed-in account stands in for, or null (owners and everyone else stand in for no one).
export function fixturePersonFor(email: string): string | null {
  return email.trim().toLowerCase() === SAMPLE_FULFILLER_EMAIL ? SAMPLE_FULFILLER_ID : null;
}

const fixtureId = (id: string) => `fixture:${id}`;

// The order's claimer and buyer as person ids, with the viewer's own id swapped in where they stand in for that person.
export function ownershipFor(order: FulfilmentOrder, viewer: FulfilmentViewer): OrderOwnership {
  const me = fixturePersonFor(viewer.email);
  return {
    claimedById: order.assignee ? (order.assignee === me ? viewer.personId : fixtureId(order.assignee)) : null,
    buyerId: order.buyer === me ? viewer.personId : fixtureId(order.buyer),
  };
}

// Name, contact details and address: the claiming fulfiller or an owner only.
export function canSeeDetails(order: FulfilmentOrder, viewer: FulfilmentViewer): boolean {
  return canSeeBuyerDetails(ownershipFor(order, viewer), viewer);
}

// The label is the address in large print, so the same rule. Anyone else gets the same 404 as a missing order.
export const canViewLabel = canSeeDetails;

export function isOwnOrderFor(order: FulfilmentOrder, viewer: FulfilmentViewer): boolean {
  return isOwnOrder(ownershipFor(order, viewer), viewer.personId);
}

export type ClaimState = "unclaimed" | "mine" | "others";
export const CLAIM_STATE_LABELS: Record<ClaimState, string> = { unclaimed: "Unclaimed", mine: "Mine", others: "Claimed by others" };

export function claimStateFor(order: FulfilmentOrder, viewer: FulfilmentViewer): ClaimState {
  if (!order.assignee) return "unclaimed";
  return claimedBy(ownershipFor(order, viewer), viewer.personId) ? "mine" : "others";
}

// The buyer's details as shown to someone allowed to see them. Every value is a placeholder.
export type BuyerDetails = { name: string; email: string; phone: string; addressLines: string[]; country: string };
export function buyerDetailsFor(order: FulfilmentOrder): BuyerDetails {
  return {
    name: "Sample recipient",
    email: "sample.recipient@example.test",
    phone: "+00 000 000 0000",
    addressLines: ["Sample address line 1", "Sample address line 2", "00000 Sample town"],
    country: order.country,
  };
}

// ---- Actions ----

// Pixl's visibleOrderActions, with the Slack contact button left out. Reassigning, cancelling with a refund and the final
// "delivered" stay owner-only; a fulfiller works only the orders they claimed and never their own.
export type OrderActionContext = { status: FulfilmentStatus; flagged: boolean; mine: boolean; ownOrder: boolean; canManage: boolean };
export type VisibleOrderActions = { primary: boolean; flag: boolean; edit: boolean; any: boolean };

export function visibleOrderActions(context: OrderActionContext): VisibleOrderActions {
  const actionable = !isClosed(context.status);
  let primary = false;
  if (actionable) {
    if (context.status === "shipped") primary = context.canManage;
    else if (!context.mine && context.status !== "new") primary = context.canManage;
    else primary = true;
  }
  const flag = actionable && context.status !== "shipped" && (context.mine || context.canManage) && (!context.flagged || context.canManage);
  const edit = context.canManage && context.status !== "new" && context.status !== "cancelled";
  return { primary, flag, edit, any: primary || flag || edit };
}

export type PrimaryAction = "claim" | "own" | "pack" | "ship" | "deliver" | "reassign" | "none";

// The one main button for the order's stage. Claiming a new order is refused for a fulfiller's own order.
export function primaryAction(context: OrderActionContext): PrimaryAction {
  if (isClosed(context.status)) return "none";
  if (context.status === "shipped") return context.canManage ? "deliver" : "none";
  if (!context.mine && context.status !== "new") return context.canManage ? "reassign" : "none";
  if (context.status === "new") return context.ownOrder ? "own" : "claim";
  return context.status === "claimed" ? "pack" : "ship";
}

// Owners can cancel and refund until the order ships.
export function canCancel(status: FulfilmentStatus, canManage: boolean): boolean {
  return canManage && (status === "new" || status === "claimed" || status === "packed");
}

// ---- Funding check ----

// Pixl checks that the player's verified earnings cover what the fulfiller is about to buy. Here the builder's Ore stand in for
// them: approved hours earn 10 Ore each (hours still in review do not count), minus the Ore already spent before this order.
export const FUNDING_STATUSES = ["covered", "short", "unverified", "review"] as const;
export type FundingStatus = (typeof FUNDING_STATUSES)[number];
export const FUNDING_LABELS: Record<FundingStatus, string> = { covered: "Covered", short: "Short", unverified: "Unverified", review: "Review required" };
export const FUNDING_SHORT_LABELS: Record<FundingStatus, string> = { covered: "Covered", short: "Short", unverified: "Unverified", review: "Review" };
export const FUNDING_HINTS: Record<FundingStatus, string> = {
  covered: "Approved hours cover this order",
  short: "The builder's Ore are below this order",
  unverified: "Covered only if hours still in review are approved",
  review: "An owner needs to decide before it goes ahead",
};

export type Commitment = { id: string; number: string; summary: string; ore: number; status: FulfilmentStatus };
export type Funding = {
  status: FundingStatus;
  approvedHours: number;
  pendingHours: number;
  byTrack: { track: Track; hours: number }[];
  /** Ore earned from approved hours. */
  earned: number;
  /** Ore already spent before this order: the sample opening figure plus earlier orders that were not cancelled. */
  committed: number;
  commitments: Commitment[];
  spentBefore: number;
  /** Earned minus committed. */
  balance: number;
  cost: number;
  after: number;
  /** What the pending hours would add, once approved. */
  pendingOre: number;
  reasons: string[];
};

export function totalApproved(hours: TrackHours): number {
  return TRACKS.reduce((sum, track) => sum + hours[track], 0);
}

// Earlier orders of the same builder that took Ore and were not cancelled.
function earlierOrders(order: FulfilmentOrder, orders: readonly FulfilmentOrder[]): FulfilmentOrder[] {
  return orders.filter((other) => other.id !== order.id && other.buyer === order.buyer && other.status !== "cancelled" && other.placedHoursAgo > order.placedHoursAgo);
}

export function fundingFor(order: FulfilmentOrder, orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): Funding {
  const approved = approvedHoursFor(order.buyer);
  const books = booksFor(order.buyer);
  const approvedHours = totalApproved(approved);
  const earned = approvedHours * ORE_PER_HOUR;
  const commitments = earlierOrders(order, orders).map((other) => ({ id: other.id, number: other.number, summary: summaryFor(other), ore: oreTotal(other), status: other.status }));
  const committed = books.spentBefore + commitments.reduce((sum, item) => sum + item.ore, 0);
  const balance = earned - committed;
  const cost = order.status === "cancelled" ? 0 : oreTotal(order);
  const after = balance - cost;
  const pendingOre = books.pendingHours * ORE_PER_HOUR;
  const reasons: string[] = [];
  let status: FundingStatus;
  if (order.flag) {
    status = "review";
    reasons.push("The order is flagged over budget. An owner decides whether it goes ahead.");
  } else if (isOverBudget(order)) {
    status = "review";
    reasons.push("The recorded cost is above the budget for this order.");
  } else if (after >= 0) {
    status = "covered";
  } else if (after + pendingOre >= 0) {
    status = "unverified";
    reasons.push(`${books.pendingHours} ${books.pendingHours === 1 ? "hour is" : "hours are"} still in review. The order is covered only if they are approved.`);
  } else {
    status = "short";
    reasons.push("Approved hours do not cover this order, even with the hours still in review.");
  }
  return {
    status,
    approvedHours,
    pendingHours: books.pendingHours,
    byTrack: TRACKS.map((track) => ({ track, hours: approved[track] })),
    earned,
    committed,
    commitments,
    spentBefore: books.spentBefore,
    balance,
    cost,
    after,
    pendingOre,
    reasons,
  };
}

// How much of the order the balance covers, 0 to 100. A free order is fully covered.
export function coveragePercent(funding: Funding): number {
  if (funding.cost <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((Math.max(0, funding.balance) / funding.cost) * 100)));
}

// ---- The order list: stage, claim state, funding and sort ----

// "flagged" is the over-budget queue (a flag, not a stage). "active" is the working view behind My queue: claimed, packed or shipped.
export const STAGE_TABS = [...FULFILMENT_STATUSES, "flagged", "active", "all"] as const;
export type StageTab = (typeof STAGE_TABS)[number];
export const STAGE_TAB_LABELS: Record<StageTab, string> = { ...FULFILMENT_STATUS_LABELS, flagged: "Over budget", active: "In progress", all: "All" };
export const DEFAULT_STAGE: StageTab = "new";

export const CLAIM_FILTERS = ["any", "unclaimed", "mine", "others"] as const;
export type ClaimFilter = (typeof CLAIM_FILTERS)[number];
export const CLAIM_FILTER_LABELS: Record<ClaimFilter, string> = { any: "Any", unclaimed: "Unclaimed", mine: "Mine", others: "Claimed by others" };

export const SORT_KEYS = ["newest", "shortfall", "remaining", "hours"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export const SORT_LABELS: Record<SortKey, string> = { newest: "Newest", shortfall: "Biggest shortfall", remaining: "Most left after order", hours: "Most approved hours" };

export const ORDERS_PAGE_SIZE = 10;
export const SEARCH_MAX = 80;

export type FulfilmentQuery = {
  status: StageTab;
  claim: ClaimFilter;
  q: string;
  funding: FundingStatus | null;
  sort: SortKey;
  /** The order open in the detail pane, if the address names one. */
  order: string | null;
  page: number;
};

export type FulfilmentRaw = {
  status?: string | string[];
  claim?: string | string[];
  q?: string | string[];
  funding?: string | string[];
  sort?: string | string[];
  order?: string | string[];
  page?: string | string[];
};

export function parseFulfilmentQuery(raw: FulfilmentRaw): FulfilmentQuery {
  const status = first(raw.status).trim().toLowerCase();
  const claim = first(raw.claim).trim().toLowerCase();
  const funding = first(raw.funding).trim().toLowerCase();
  const sort = first(raw.sort).trim().toLowerCase();
  const order = first(raw.order).trim().toLowerCase();
  return {
    status: STAGE_TABS.find((item) => item === status) ?? DEFAULT_STAGE,
    claim: CLAIM_FILTERS.find((item) => item === claim) ?? "any",
    q: first(raw.q).trim().slice(0, SEARCH_MAX),
    funding: FUNDING_STATUSES.find((item) => item === funding) ?? null,
    sort: SORT_KEYS.find((item) => item === sort) ?? "newest",
    order: order && /^[a-z0-9-]{1,24}$/.test(order) ? order : null,
    page: parsePage(raw.page),
  };
}

export const DEFAULT_QUERY: FulfilmentQuery = { status: DEFAULT_STAGE, claim: "any", q: "", funding: null, sort: "newest", order: null, page: 1 };

// The address for a list state. Defaults leave no query, so the plain address stays plain.
export function fulfilmentHref(query: FulfilmentQuery): string {
  const params = new URLSearchParams();
  if (query.status !== DEFAULT_STAGE) params.set("status", query.status);
  if (query.claim !== "any") params.set("claim", query.claim);
  if (query.q) params.set("q", query.q);
  if (query.funding) params.set("funding", query.funding);
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.order) params.set("order", query.order);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/fulfilment?${text}` : "/fulfilment";
}

// My queue is the working view of what the viewer has claimed. It is the claim filter on the in-progress stages.
export function myQueueQuery(): FulfilmentQuery {
  return { ...DEFAULT_QUERY, status: "active", claim: "mine" };
}

export function isMyQueue(query: FulfilmentQuery): boolean {
  return query.status === "active" && query.claim === "mine";
}

export function matchesStage(order: FulfilmentOrder, stage: StageTab): boolean {
  if (stage === "all") return true;
  if (stage === "flagged") return Boolean(order.flag) && !isClosed(order.status);
  if (stage === "active") return order.status === "claimed" || order.status === "packed" || order.status === "shipped";
  return order.status === stage;
}

export function matchesSearch(order: FulfilmentOrder, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [order.number, order.buyer, order.country, summaryFor(order), order.assignee ?? "", order.buyerNote ?? ""].join(" ").toLowerCase();
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

function sortValue(order: FulfilmentOrder, key: SortKey, orders: readonly FulfilmentOrder[]): number {
  const funding = fundingFor(order, orders);
  if (key === "shortfall") return -funding.after;
  if (key === "remaining") return funding.after;
  if (key === "hours") return funding.approvedHours;
  return 0;
}

// Newest first by default, as in Pixl; the funding sorts put the biggest value first and keep newest first among equals.
export function sortOrders(orders: readonly FulfilmentOrder[], key: SortKey = "newest", all: readonly FulfilmentOrder[] = orders): FulfilmentOrder[] {
  const values = new Map(orders.map((order) => [order.id, sortValue(order, key, all)]));
  return [...orders].sort(
    (a, b) => (values.get(b.id) ?? 0) - (values.get(a.id) ?? 0) || lastUpdatedHours(a) - lastUpdatedHours(b) || a.id.localeCompare(b.id),
  );
}

export function filterOrders(orders: readonly FulfilmentOrder[], query: FulfilmentQuery, viewer: FulfilmentViewer, all: readonly FulfilmentOrder[] = orders): FulfilmentOrder[] {
  return orders.filter((order) => {
    if (!matchesStage(order, query.status)) return false;
    if (query.claim !== "any" && claimStateFor(order, viewer) !== query.claim) return false;
    if (!matchesSearch(order, query.q)) return false;
    if (query.funding && fundingFor(order, all).status !== query.funding) return false;
    return true;
  });
}

export type OrderCounts = Record<FulfilmentStatus | "flagged" | "all", number>;

export function statusCounts(orders: readonly FulfilmentOrder[]): OrderCounts {
  const counts = { all: orders.length, flagged: 0, new: 0, claimed: 0, packed: 0, shipped: 0, delivered: 0, cancelled: 0 } as OrderCounts;
  for (const order of orders) {
    counts[order.status] += 1;
    if (order.flag && !isClosed(order.status)) counts.flagged += 1;
  }
  return counts;
}

export type OrderView = {
  page: Page<FulfilmentOrder>;
  /** The order shown in the detail pane. */
  selected: FulfilmentOrder | null;
  /** The address named an order, so a narrow screen shows the detail first. */
  explicit: boolean;
};

export function orderView(orders: readonly FulfilmentOrder[], query: FulfilmentQuery, viewer: FulfilmentViewer, per = ORDERS_PAGE_SIZE): OrderView {
  const sorted = sortOrders(filterOrders(orders, query, viewer, orders), query.sort, orders);
  const page = paginate(sorted, query.page, per);
  const named = query.order ? sorted.find((order) => order.id === query.order) : undefined;
  return { page, selected: named ?? page.items[0] ?? null, explicit: Boolean(named) };
}

// Why the list is empty, in the words of the view.
export function emptyTitle(query: FulfilmentQuery): string {
  if (query.q) return `No orders match "${query.q}"`;
  if (query.funding) return `No ${FUNDING_LABELS[query.funding].toLowerCase()} orders in this view`;
  if (isMyQueue(query)) return "Nothing in your queue";
  if (query.claim === "mine") return "You have not claimed any orders in this view";
  if (query.status === "new") return "No orders waiting to be claimed";
  if (query.status === "flagged") return "Nothing over budget right now";
  return "Nothing here yet";
}

// ---- Shop economy (owner) ----

// Fulfilled orders only, as in Pixl: orders with a recorded real cost, set against what the builder paid in Ore.
export type ShopEconomy = { orders: number; redeemedOre: number; redeemedCents: number; spentCents: number; netCents: number };
export function shopEconomy(orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): ShopEconomy {
  const costed = orders.filter((order) => order.status !== "cancelled" && order.actualCostUsd !== undefined);
  const redeemedOre = costed.reduce((sum, order) => sum + oreTotal(order), 0);
  const redeemedCents = costed.reduce((sum, order) => sum + budgetCents(order), 0);
  const spentCents = costed.reduce((sum, order) => sum + (costCents(order) ?? 0), 0);
  return { orders: costed.length, redeemedOre, redeemedCents, spentCents, netCents: redeemedCents - spentCents };
}

// ---- Fulfillers ----

export type FulfillerKind = "team" | "partner";
export const FULFILLER_KIND_LABELS: Record<FulfillerKind, string> = { team: "Team member", partner: "Partner" };
export type Fulfiller = { id: string; handle: string; kind: FulfillerKind; region: string; note: string };

// tamsin and saltmarsh are also on the reviewer roster: a small team packs as well as reviews. examplepack stands in for the
// seeded local test fulfiller. deskcrate is another invented partner.
export const FULFILLERS: readonly Fulfiller[] = [
  { id: "deskcrate", handle: "deskcrate", kind: "partner", region: "United States", note: "A sample partner that buys, packs and posts from the United States." },
  { id: "examplepack", handle: "examplepack", kind: "partner", region: "Canada", note: "A sample partner that buys, packs and posts from Canada. The local test fulfiller account stands in for this person." },
  { id: "saltmarsh", handle: "saltmarsh", kind: "team", region: "United Kingdom and Ireland", note: "Packs UK and Irish orders by hand." },
  { id: "tamsin", handle: "tamsin", kind: "team", region: "Germany and the EU", note: "Packs orders for Germany and the rest of the EU." },
];

export function fulfillerById(id: string): Fulfiller | null {
  return FULFILLERS.find((item) => item.id === id) ?? null;
}

export function fulfillerHandle(id: string | null): string {
  if (!id) return "Unassigned";
  return fulfillerById(id)?.handle ?? id;
}

export const HISTORY_LIMIT = 100;

export function ordersFor(fulfillerId: string, orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): FulfilmentOrder[] {
  return sortOrders(orders.filter((order) => order.assignee === fulfillerId));
}

export type FulfillerStats = {
  claimed: number;
  shipped: number;
  delivered: number;
  /** Claimed or packed: on their desk now. */
  inQueue: number;
  /** Average hours from claim to shipping, over the orders that have both. Zero when there are none. */
  avgClaimToShipHours: number;
  /** Hours since the newest thing they did, or null if they have done nothing. */
  lastActivityHours: number | null;
};

export function fulfillerStats(fulfillerId: string, orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): FulfillerStats {
  const mine = orders.filter((order) => order.assignee === fulfillerId && order.status !== "cancelled");
  const spans = mine.flatMap((order) => (order.claimedHoursAgo !== undefined && order.shippedHoursAgo !== undefined ? [order.claimedHoursAgo - order.shippedHoursAgo] : []));
  const touched = mine.map(lastUpdatedHours);
  return {
    claimed: mine.length,
    shipped: mine.filter((order) => order.status === "shipped" || order.status === "delivered").length,
    delivered: mine.filter((order) => order.status === "delivered").length,
    inQueue: mine.filter((order) => order.status === "claimed" || order.status === "packed").length,
    avgClaimToShipHours: spans.length === 0 ? 0 : Math.round(spans.reduce((sum, value) => sum + value, 0) / spans.length),
    lastActivityHours: touched.length === 0 ? null : Math.min(...touched),
  };
}

// "1d 6h", "5h", "-" for none.
export function formatSpan(hours: number): string {
  if (hours <= 0) return "-";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest === 0 ? `${days}d` : `${days}d ${rest}h`;
}

// ---- Shipping label ----

export type ShippingLabel = { recipient: string; lines: string[]; country: string; footer: string };

// A label never carries a real name or street. Every line is a placeholder, and the country is the only real field.
export function labelFor(order: FulfilmentOrder): ShippingLabel {
  const count = itemTotal(order);
  const details = buyerDetailsFor(order);
  return {
    recipient: details.name,
    lines: details.addressLines,
    country: order.country,
    footer: `Order ${order.number}, ${count} ${count === 1 ? "item" : "items"}`,
  };
}

// ---- Tickets ----

export const TICKET_STATUSES = ["open", "resolved"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = { open: "Open", resolved: "Resolved" };

export type TicketMessage = { from: "builder" | "staff"; who: string; hoursAgo: number; text: string };
export type Ticket = {
  id: string;
  subject: string;
  status: TicketStatus;
  builder: string;
  /** An order the ticket is about, if any. */
  order?: string;
  /** Oldest message first. */
  thread: readonly TicketMessage[];
  /** A helper id and when, for a resolved ticket. */
  resolvedBy?: string;
  resolvedHoursAgo?: number;
};

const said = (from: TicketMessage["from"], who: string, hoursAgo: number, text: string): TicketMessage => ({ from, who, hoursAgo, text });

const HAND_TICKETS: readonly Ticket[] = [
  {
    id: "tk-301",
    subject: "Where is my order LO-1057?",
    status: "open",
    builder: "kestrel42",
    order: "lo-1057",
    thread: [said("builder", "kestrel42", 30, "The keyboard says shipped but it has not come yet. How long should it take to Germany?")],
  },
  {
    id: "tk-302",
    subject: "The cable in my parcel was the wrong one",
    status: "open",
    builder: "brasskettle",
    order: "lo-1069",
    thread: [
      said("builder", "brasskettle", 52, "The sensor kit arrived but one cable is a different type from the picture."),
      said("staff", "saltmarsh", 40, "Thanks for the details. Could you send a photo of the cable and what is printed on it?"),
    ],
  },
  {
    id: "tk-303",
    subject: "An hour was cut from my journal entry",
    status: "open",
    builder: "picopilgrim",
    thread: [
      said("builder", "picopilgrim", 26, "The reviewer cut an hour from my sensor entry. Can someone explain what was wrong with it?"),
      said("staff", "tamsin", 20, "Looking at it now. I will pass it to the reviewer who made the call."),
      said("builder", "picopilgrim", 6, "Thanks. I can add more detail to the journal if that helps."),
    ],
  },
  {
    id: "tk-304",
    subject: "Can I change the country on LO-1064?",
    status: "open",
    builder: "mothvector",
    order: "lo-1064",
    thread: [
      said("builder", "mothvector", 90, "I typed the wrong country when I ordered. It should go somewhere else."),
      said("staff", "tamsin", 80, "We have paused it so it does not go out. Can you confirm the right country in this ticket?"),
    ],
  },
  {
    id: "tk-305",
    subject: "My Hardware level does not show",
    status: "open",
    builder: "solderbee",
    thread: [
      said("builder", "solderbee", 120, "I have two hours approved in Hardware but the strip still shows level zero."),
      said("staff", "saltmarsh", 100, "Level 1 starts at 2 approved hours, so you are right on the line. Could you reload and tell us what you see?"),
    ],
  },
  {
    id: "tk-308",
    subject: "LO-1065 is taking a long time",
    status: "open",
    builder: "lathelark",
    order: "lo-1065",
    thread: [
      said("builder", "lathelark", 150, "My order has not moved for a week."),
      said("staff", "saltmarsh", 140, "The cheapest price we can find is above the budget for this order, so an owner has to decide. We will update this ticket as soon as we know."),
    ],
  },
  {
    id: "tk-313",
    subject: "The tracking number for LO-1066 does not load",
    status: "open",
    builder: "nullwisp",
    order: "lo-1066",
    thread: [said("builder", "nullwisp", 14, "I pasted the tracking number into the carrier's page and it says it cannot find it.")],
  },
  {
    id: "tk-306",
    subject: "A wishlist item is missing from the shop",
    status: "resolved",
    builder: "lathelark",
    resolvedBy: "tamsin",
    resolvedHoursAgo: 380,
    thread: [
      said("builder", "lathelark", 400, "I saved a board to my wishlist and now I cannot find it in the shop."),
      said("staff", "tamsin", 390, "That item is no longer in the proposed list. Wishlists only keep items that are still in the shop."),
      said("builder", "lathelark", 380, "Understood, thanks."),
    ],
  },
  {
    id: "tk-307",
    subject: "My handle is spelled wrong",
    status: "resolved",
    builder: "nullwisp",
    resolvedBy: "saltmarsh",
    resolvedHoursAgo: 590,
    thread: [said("builder", "nullwisp", 600, "There is a letter missing in my handle on the leaderboard."), said("staff", "saltmarsh", 590, "Fixed. It should show correctly from the next page load.")],
  },
  {
    id: "tk-309",
    subject: "Is a Pico W the right first board?",
    status: "resolved",
    builder: "quartzfox",
    resolvedBy: "tamsin",
    resolvedHoursAgo: 790,
    thread: [
      said("builder", "quartzfox", 800, "I want to build a small sensor that sends a reading over Wi-Fi. Would a Pico W do?"),
      said("staff", "tamsin", 790, "Yes, it has Wi-Fi and is a good first board. The Hardware track page has a starter list."),
    ],
  },
  {
    id: "tk-310",
    subject: "Where do I see my order history?",
    status: "resolved",
    builder: "solderbee",
    resolvedBy: "tamsin",
    resolvedHoursAgo: 60,
    thread: [
      said("builder", "solderbee", 70, "I cannot find a list of my orders."),
      said("staff", "tamsin", 60, "It is the Orders page in the dashboard, under the Shop. Orders and wishlist are two tabs there."),
    ],
  },
  {
    id: "tk-311",
    subject: "My discount did not apply to the sensor kit",
    status: "resolved",
    builder: "brasskettle",
    resolvedBy: "examplehelp",
    resolvedHoursAgo: 200,
    thread: [
      said("builder", "brasskettle", 230, "The sensor kit shows full price but I thought I had a Hardware discount."),
      said("staff", "examplehelp", 200, "The kit is related to Hardware and Tools, and the best of those two levels applies. It is already in your price; the struck-through figure is the price before it."),
    ],
  },
  {
    id: "tk-312",
    subject: "Can I send my order to a different address?",
    status: "resolved",
    builder: "tinwren",
    resolvedBy: "saltmarsh",
    resolvedHoursAgo: 20,
    thread: [
      said("builder", "tinwren", 28, "I will be away next week. Can the parcel go to a friend's house?"),
      said("staff", "saltmarsh", 20, "Yes, until it is packed. Tell us the new address in a private message and we will update the order."),
    ],
  },
  {
    id: "tk-314",
    subject: "A question about the Compute track",
    status: "resolved",
    builder: "mothvector",
    resolvedBy: "examplehelp",
    resolvedHoursAgo: 300,
    thread: [
      said("builder", "mothvector", 320, "Do hours on cloud credits count toward Compute or Systems?"),
      said("staff", "examplehelp", 300, "The reviewer assigns hours to the tracks the work is about, so it depends on what you built. The track page lists examples of each."),
    ],
  },
];

// Generated tickets for the list pages. The thread is one question, and a resolved ticket has a staff answer and the helper who closed it.
function bulkTicket(seed: TicketSeed): Ticket {
  const asked = said("builder", seed.builder, seed.hoursAgo, "A sample question from a builder.");
  const base = { id: `tk-${seed.number}`, subject: seed.subject, builder: seed.builder, ...(seed.order ? { order: `lo-${seed.order}` } : {}) };
  if (!seed.resolved) return { ...base, status: "open", thread: [asked] };
  return {
    ...base,
    status: "resolved",
    thread: [asked, said("staff", seed.helper, seed.hoursAgo - 6, "A sample answer from staff.")],
    resolvedBy: seed.helper,
    resolvedHoursAgo: seed.hoursAgo - 6,
  };
}

export const TICKETS: readonly Ticket[] = [...HAND_TICKETS, ...BULK_TICKETS.map(bulkTicket)];

export function ticketById(id: string): Ticket | null {
  return TICKETS.find((ticket) => ticket.id === id) ?? null;
}

// Pixl's tabs are Open, All, Resolved, with Open first.
export const TICKET_FILTERS = ["open", "all", "resolved"] as const;
export type TicketFilter = (typeof TICKET_FILTERS)[number];
export const TICKET_FILTER_LABELS: Record<TicketFilter, string> = { open: "Open", all: "All", resolved: "Resolved" };
export type TicketQuery = { status: TicketFilter; q: string };
export const TICKET_SEARCH_MAX = 80;
export const TICKETS_PAGE_SIZE = 20;

export function parseTicketQuery(raw: { status?: string | string[]; q?: string | string[] }): TicketQuery {
  const status = first(raw.status).trim().toLowerCase();
  return { status: TICKET_FILTERS.find((item) => item === status) ?? "open", q: first(raw.q).trim().slice(0, TICKET_SEARCH_MAX) };
}

export function ticketHref(query: TicketQuery): string {
  const params = new URLSearchParams();
  if (query.status !== "open") params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  const text = params.toString();
  return text ? `/tickets?${text}` : "/tickets";
}

export function lastActivity(ticket: Ticket): number {
  return Math.min(...ticket.thread.map((message) => message.hoursAgo));
}

export function openedHoursAgo(ticket: Ticket): number {
  return Math.max(...ticket.thread.map((message) => message.hoursAgo));
}

// Who spoke last, so the list can say whether the ball is with the builder or with the team.
export function lastSpeaker(ticket: Ticket): TicketMessage["from"] {
  const latest = [...ticket.thread].sort((a, b) => a.hoursAgo - b.hoursAgo)[0];
  return latest?.from ?? "builder";
}

export function matchesTicketSearch(ticket: Ticket, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const orderNumber = ticket.order ? (fulfilmentOrderById(ticket.order)?.number ?? ticket.order) : "";
  const hay = [ticket.subject, ticket.builder, orderNumber, ...ticket.thread.map((message) => message.text)].join(" ").toLowerCase();
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

export function filterTickets(tickets: readonly Ticket[], query: TicketQuery): Ticket[] {
  return tickets.filter((ticket) => (query.status === "all" || ticket.status === query.status) && matchesTicketSearch(ticket, query.q));
}

// Newest first, as the thread was opened. Open tickets are not pulled to the top: the Open tab already does that.
export function sortTickets(tickets: readonly Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => openedHoursAgo(a) - openedHoursAgo(b) || a.id.localeCompare(b.id));
}

export type TicketStats = { total: number; open: number; resolved: number };
export function ticketStats(tickets: readonly Ticket[] = TICKETS): TicketStats {
  return { total: tickets.length, open: tickets.filter((ticket) => ticket.status === "open").length, resolved: tickets.filter((ticket) => ticket.status === "resolved").length };
}

// Counts for the three tabs, inside the search.
export function ticketCounts(tickets: readonly Ticket[], q: string): Record<TicketFilter, number> {
  const scoped = tickets.filter((ticket) => matchesTicketSearch(ticket, q));
  const counts = { open: 0, all: scoped.length, resolved: 0 } as Record<TicketFilter, number>;
  for (const ticket of scoped) counts[ticket.status] += 1;
  return counts;
}

// Tickets created and resolved per day over the last 30 days. Day 0 is today; the points run oldest first.
export type ActivityPoint = { daysAgo: number; created: number; resolved: number };
export const ACTIVITY_DAYS = 30;

export function ticketActivity(tickets: readonly Ticket[] = TICKETS, days = ACTIVITY_DAYS): ActivityPoint[] {
  const points: ActivityPoint[] = Array.from({ length: days }, (_, index) => ({ daysAgo: days - 1 - index, created: 0, resolved: 0 }));
  const bucket = (hoursAgo: number) => points.find((point) => point.daysAgo === Math.floor(hoursAgo / 24));
  for (const ticket of tickets) {
    const opened = bucket(openedHoursAgo(ticket));
    if (opened) opened.created += 1;
    if (ticket.resolvedHoursAgo !== undefined) {
      const done = bucket(ticket.resolvedHoursAgo);
      if (done) done.resolved += 1;
    }
  }
  return points;
}

// ---- Helpers (who can work tickets) ----

export type Helper = { id: string; handle: string; addedDaysAgo: number };
// Staff handles from the roster, plus one invented helper.
export const HELPERS: readonly Helper[] = [
  { id: "tamsin", handle: "tamsin", addedDaysAgo: 120 },
  { id: "saltmarsh", handle: "saltmarsh", addedDaysAgo: 96 },
  { id: "examplehelp", handle: "examplehelp", addedDaysAgo: 21 },
];

export type ResolverRow = { id: string; handle: string; last7d: number; last30d: number; total: number };

// Tickets resolved per helper, most all-time first (then last 30 days, then handle). Helpers with none are left out.
export function resolverLeaderboard(tickets: readonly Ticket[] = TICKETS, helpers: readonly Helper[] = HELPERS): ResolverRow[] {
  const rows = helpers.map((helper) => {
    const done = tickets.filter((ticket) => ticket.resolvedBy === helper.id && ticket.resolvedHoursAgo !== undefined);
    const within = (hours: number) => done.filter((ticket) => (ticket.resolvedHoursAgo ?? Infinity) <= hours).length;
    return { id: helper.id, handle: helper.handle, last7d: within(168), last30d: within(720), total: done.length };
  });
  return rows.filter((row) => row.total > 0).sort((a, b) => b.total - a.total || b.last30d - a.last30d || a.handle.localeCompare(b.handle));
}

// ---- Where it was bought ----

// The supplier an earlier order for one of the same items was bought from, so the next fulfiller can use the same one. Pixl keeps
// this on the item; the sample keeps it on the orders.
export function previousSourceFor(order: FulfilmentOrder, orders: readonly FulfilmentOrder[] = FULFILMENT_ORDERS): string | null {
  const wanted = new Set(order.lines.map((line) => line.itemId));
  const earlier = orders
    .filter((other) => other.id !== order.id && other.source && other.lines.some((line) => wanted.has(line.itemId)))
    .sort((a, b) => lastUpdatedHours(a) - lastUpdatedHours(b))[0];
  return earlier?.source ?? null;
}

// The address of one order in the Orders list, for links from other pages. An order's label is a separate page that only the
// fulfiller who claimed the order, or an owner, can open, so other pages should link here instead.
export function orderHref(id: string): string {
  return fulfilmentHref({ ...DEFAULT_QUERY, status: "all", order: id });
}
