// Pure rules for the shop, orders, wishlist and fulfilment. No database: the *-data.ts files read and write rows and call these.
// Money is whole Ore. A refusal has a code (for a form to switch on) and a plain-words message.
//
// API:
//   nextOrderNumber(existing)                 "LO-1101" style, numeric max plus one, never below the floor
//   checkAdvance(from, to) / checkCancel      placed -> packed -> shipped -> delivered only; cancel only while placed
//   mergeRequestLines(lines)                  checks and merges one order's lines (same item and option add up)
//   priceOrder(...)                           re-prices lines with priceFor and the Field Requisition, one unit at most
//   stockNeeds(lines)                         units per item and option, in a fixed order for the stock updates
//   hasStock(stock, quantity)                 the check the guarded stock update repeats in the database
//   canSave(count, alreadySaved)              wishlist limit
//   canCommit(check) / canRemoveFulfiller(n)  fulfilment rules
//   datesFromEvents(events) / orderRowFromDb  the order rows the Orders pages read
//   shopItemFromRow(row, base)                a ShopItem row merged with its static catalog entry (photo, need, credit)
//   fulfilmentStage(status, claimed)          LOADOUT stage (New, Claimed, Packed, Shipped, Delivered, Cancelled); PIXL_STAGE_KEY maps to Pixl's keys
//   isFlaggedFromEvents(events)               over-budget flag: the newest flag event decides
//   checkStaffCancel / checkFlaggable         which statuses staff can cancel or flag
//   checkGrantRef / checkShipmentEdit         grant reference; shipment edits that never clear a field
//   fulfilmentPayoutOre({ items, grant })     2 Ore per item shipped, 1 Ore per grant (settled at ship in orders-data.ts)

import { formatOre, dayKey } from "./ledger";
import { isOrderStatus, nextStatus, ORDER_STATUSES, type Order, type OrderLine, type OrderStatus } from "./orders";
import { TRACKS, type Track } from "./progress";
import { priceFor, lockFor, type ShopItem, type TrackHours } from "./shop";
import { requisitionOffer, requisitionReasonText, type RequisitionCounts, type UsedRequisition } from "./requisitions";

export type OrderRefusalCode =
  | "empty"
  | "too_many_lines"
  | "bad_quantity"
  | "bad_region"
  | "person_unavailable"
  | "unknown_item"
  | "inactive"
  | "locked"
  | "out_of_stock"
  | "requisition"
  | "insufficient_ore"
  | "bad_total";

export type OrderRefusal = { code: OrderRefusalCode; message: string; itemId?: string };
export type Checked<T> = { ok: true; value: T } | { ok: false; refusal: OrderRefusal };
export type Verdict = { ok: true } | { ok: false; message: string };

const refuse = (code: OrderRefusalCode, message: string, itemId?: string): { ok: false; refusal: OrderRefusal } => ({
  ok: false,
  refusal: itemId ? { code, message, itemId } : { code, message },
});
const pass = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });

// ---- Numbers and statuses ----

// The first number issued is LO-1101. The fixture orders stop at LO-1063, so real numbers do not look like them.
export const ORDER_NUMBER_FLOOR = 1100;
const NUMBER_PATTERN = /^LO-(\d+)$/;

export function nextOrderNumber(existing: readonly string[]): string {
  let top = ORDER_NUMBER_FLOOR;
  for (const number of existing) {
    const match = NUMBER_PATTERN.exec(number);
    if (match) top = Math.max(top, Number(match[1]));
  }
  return `LO-${top + 1}`;
}

// One step forward only. Cancelled is not on the chain: an order that is cancelled cannot move on.
export function checkAdvance(from: string, to: string): Verdict {
  if (from === "cancelled") return { ok: false, message: "A cancelled order cannot move on." };
  if (!isOrderStatus(from) || !isOrderStatus(to)) return { ok: false, message: "That is not a status an order can have." };
  if (from === to) return { ok: false, message: `The order is already ${to}.` };
  if (ORDER_STATUSES.indexOf(to) < ORDER_STATUSES.indexOf(from)) return { ok: false, message: "Orders only move forward." };
  const next = nextStatus(from);
  if (next === to) return { ok: true };
  return { ok: false, message: `Move the order to ${next ?? "delivered"} first, one step at a time.` };
}

export function checkCancel(status: string): Verdict {
  if (status === "placed") return { ok: true };
  return { ok: false, message: `Only a placed order can be cancelled. This one is ${status}.` };
}

// ---- Shipping ----

export const ORDER_TRACKING_MAX = 120;
export const ORDER_CARRIER_MAX = 60;
export const ORDER_SUPPLIER_MAX = 80;

export type Shipment = { trackingNumber: string; carrier: string | null; supplier: string | null };
export type ShipmentCheck = { ok: true; value: Shipment } | { ok: false; message: string };

// A blank optional field is stored as null, never as an empty string, so "not recorded" has one representation.
function optionalText(value: unknown, max: number, label: string): { ok: true; value: string | null } | { ok: false; message: string } {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > max) return { ok: false, message: `${label} is at most ${max} characters.` };
  return { ok: true, value: text || null };
}

// What a ship records. The tracking number is required: it is the only thing that lets the buyer follow the parcel, so an order
// cannot reach shipped without one. The carrier and the supplier are optional.
export function checkShipment(input: { trackingNumber: unknown; carrier?: unknown; supplier?: unknown }): ShipmentCheck {
  const tracking = optionalText(input.trackingNumber, ORDER_TRACKING_MAX, "A tracking number");
  if (!tracking.ok) return tracking;
  if (!tracking.value) return { ok: false, message: "Enter the tracking number before shipping." };

  const carrier = optionalText(input.carrier, ORDER_CARRIER_MAX, "A carrier");
  if (!carrier.ok) return carrier;

  const supplier = optionalText(input.supplier, ORDER_SUPPLIER_MAX, "A supplier");
  if (!supplier.ok) return supplier;

  return { ok: true, value: { trackingNumber: tracking.value, carrier: carrier.value, supplier: supplier.value } };
}

// ---- Order requests ----

export const ORDER_MAX_LINES = 20;
export const ORDER_MAX_QUANTITY = 10;
export const ORDER_REGION_MAX = 80;

export type OrderRequestLine = { itemId: string; option?: string; quantity: number };
export type MergedLine = { itemId: string; option: string; quantity: number };

// Checks each line and merges repeats of the same item and option. A builder can ask for at most ORDER_MAX_QUANTITY of one.
export function mergeRequestLines(lines: readonly OrderRequestLine[]): Checked<MergedLine[]> {
  if (lines.length === 0) return refuse("empty", "Add something to the order first.");
  const merged = new Map<string, MergedLine>();
  for (const line of lines) {
    if (typeof line.itemId !== "string" || line.itemId.trim() === "") return refuse("unknown_item", "That item is not in the shop.");
    const option = line.option ?? "";
    const quantity = (merged.get(`${line.itemId}\u0000${option}`)?.quantity ?? 0) + line.quantity;
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || quantity > ORDER_MAX_QUANTITY) {
      return refuse("bad_quantity", `Quantities are whole numbers from 1 to ${ORDER_MAX_QUANTITY}.`, line.itemId);
    }
    merged.set(`${line.itemId}\u0000${option}`, { itemId: line.itemId, option, quantity });
  }
  if (merged.size > ORDER_MAX_LINES) return refuse("too_many_lines", `An order holds at most ${ORDER_MAX_LINES} different items.`);
  return pass([...merged.values()]);
}

// An empty region is fine (no delivery region chosen yet). Stored trimmed.
export function checkRegion(raw: string | null | undefined): Checked<string | null> {
  const text = (raw ?? "").trim();
  if (text === "") return pass(null);
  if (text.length > ORDER_REGION_MAX) return refuse("bad_region", `Keep the region under ${ORDER_REGION_MAX} characters.`);
  return pass(text);
}

// ---- Stock ----

export const STOCK_DEFAULT = 25;
export const STOCK_LIMITED = 5;

export function stockForNewItem(limited: boolean): number {
  return limited ? STOCK_LIMITED : STOCK_DEFAULT;
}

// No stock row (null) means the item is not on sale in that option.
export function hasStock(stock: number | null, quantity: number): boolean {
  return stock !== null && Number.isInteger(quantity) && quantity > 0 && stock >= quantity;
}

export type StockNeed = { itemId: string; option: string; quantity: number };

// Units per item and option, summed, in a fixed order so every order locks the stock rows in the same sequence.
export function stockNeeds(lines: readonly StockNeed[]): StockNeed[] {
  const totals = new Map<string, StockNeed>();
  for (const line of lines) {
    const key = `${line.itemId}\u0000${line.option}`;
    const seen = totals.get(key);
    totals.set(key, { itemId: line.itemId, option: line.option, quantity: (seen?.quantity ?? 0) + line.quantity });
  }
  return [...totals.values()].sort((a, b) => (a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : a.option < b.option ? -1 : a.option > b.option ? 1 : 0));
}

// ---- Pricing ----

export type PricingItem = { item: ShopItem; option: string; quantity: number; stock: number | null; active: boolean };
export type PricedLine = { itemId: string; option: string; quantity: number; unitOre: number; requisition: boolean };
export type PricedOrder = { lines: PricedLine[]; totalOre: number; requisitionTrack: Track | null };

// Counts for one track only, so an offer cannot pick a different track from the one the builder chose.
function onlyTrack(available: RequisitionCounts, track: Track): RequisitionCounts {
  return Object.fromEntries(TRACKS.map((entry) => [entry, entry === track ? available[entry] : 0])) as RequisitionCounts;
}

// Prices every line from the approved hours. A Field Requisition covers one unit of one line: the first line that is in the
// chosen track and eligible, which is split so that unit pays the requisition price and the rest pay the level price.
export function priceOrder(input: {
  items: readonly PricingItem[];
  approved: TrackHours;
  available: RequisitionCounts;
  requisitionTrack: Track | null;
  confirmedOre: number;
}): Checked<PricedOrder> {
  const priced: PricedLine[] = [];
  const track = input.requisitionTrack;
  let usedOn: { index: number; priceWith: number } | null = null;
  let firstReason: string | null = null;

  for (const [index, line] of input.items.entries()) {
    if (!line.active) return refuse("inactive", `${line.item.name} is not on sale.`, line.item.id);
    const lock = lockFor(line.item, input.approved);
    if (lock) return refuse("locked", `${line.item.name} unlocks at level ${lock.level} in ${lock.track}.`, line.item.id);
    if (!hasStock(line.stock, line.quantity)) return refuse("out_of_stock", `${line.item.name} is out of stock.`, line.item.id);

    const price = priceFor(line.item, input.approved);
    if (track && !usedOn && line.item.tracks.includes(track)) {
      const offer = requisitionOffer(line.item, price, onlyTrack(input.available, track));
      if (offer.eligible) usedOn = { index, priceWith: offer.priceWith };
      else firstReason ??= requisitionReasonText(offer.reason);
    }
    priced.push({ itemId: line.item.id, option: line.option, quantity: line.quantity, unitOre: price.final, requisition: false });
  }

  if (track) {
    if (!usedOn) {
      const message = firstReason ?? `No item in this order is in ${track}.`;
      return refuse("requisition", message);
    }
    // Split the chosen line so only one unit gets the requisition price.
    const original = priced[usedOn.index];
    const rest: PricedLine[] = original.quantity > 1 ? [{ ...original, quantity: original.quantity - 1 }] : [];
    priced.splice(usedOn.index, 1, { ...original, quantity: 1, unitOre: usedOn.priceWith, requisition: true }, ...rest);
  }

  const totalOre = priced.reduce((sum, line) => sum + line.unitOre * line.quantity, 0);
  if (totalOre <= 0) return refuse("bad_total", "This order has no price to pay.");
  if (totalOre > input.confirmedOre) {
    return refuse("insufficient_ore", `This order costs ${formatOre(totalOre)} and you have ${formatOre(input.confirmedOre)}.`);
  }
  return pass({ lines: priced, totalOre, requisitionTrack: usedOn ? track : null });
}

// Spent requisitions for the availability check: the RequisitionUse rows the database returns, with unknown tracks dropped.
export function usedFromRows(rows: readonly { track: string }[]): UsedRequisition[] {
  return rows.filter((row) => (TRACKS as readonly string[]).includes(row.track)).map((row) => ({ track: row.track as Track }));
}

// ---- Wishlist ----

export const WISHLIST_MAX = 100;

export function canSave(savedCount: number, alreadySaved: boolean): Verdict {
  if (alreadySaved) return { ok: true };
  if (savedCount >= WISHLIST_MAX) return { ok: false, message: `A wishlist holds ${WISHLIST_MAX} items. Take one off to add another.` };
  return { ok: true };
}

// ---- Fulfilment ----

export type CommitCheck = {
  fulfillerId: string;
  isFulfiller: boolean;
  fulfillerBanned: boolean;
  orderPersonId: string;
  orderStatus: string;
  openCommitments: number;
};

// A fulfiller takes an order that is not yet delivered or cancelled, never their own, and only one fulfiller at a time.
export function canCommit(check: CommitCheck): Verdict {
  if (!check.isFulfiller) return { ok: false, message: "Only a fulfiller can take an order." };
  if (check.fulfillerBanned) return { ok: false, message: "This account cannot take orders." };
  if (check.fulfillerId === check.orderPersonId) return { ok: false, message: "You cannot fulfil your own order." };
  if (check.orderStatus === "delivered" || check.orderStatus === "cancelled") {
    return { ok: false, message: `This order is ${check.orderStatus}, so nobody can take it.` };
  }
  if (check.openCommitments > 0) return { ok: false, message: "Someone is already fulfilling this order." };
  return { ok: true };
}

// Removing a fulfiller would cascade-delete their commitments, so it is refused while any exist.
export function canRemoveFulfiller(commitments: number): Verdict {
  if (commitments > 0) {
    return { ok: false, message: "This fulfiller has worked on orders. Their history is kept, so they cannot be removed yet." };
  }
  return { ok: true };
}

// ---- Order rows for the pages ----

export type OrderEventRow = { status: string; at: Date };

// The day each status was first reached (UTC day, as the ledger groups days), for the statuses reached so far.
export function datesFromEvents(events: readonly OrderEventRow[]): Partial<Record<OrderStatus, string>> {
  const earliest: Partial<Record<OrderStatus, Date>> = {};
  for (const event of events) {
    if (!isOrderStatus(event.status)) continue;
    const seen = earliest[event.status];
    if (!seen || event.at.getTime() < seen.getTime()) earliest[event.status] = event.at;
  }
  const dates: Partial<Record<OrderStatus, string>> = {};
  for (const status of ORDER_STATUSES) {
    const at = earliest[status];
    if (at) dates[status] = dayKey(at);
  }
  return dates;
}

export type OrderDbLine = { itemId: string; option: string; quantity: number; unitOre: number };
export type OrderDbRow = {
  number: string;
  status: string;
  totalOre: number;
  region: string | null;
  createdAt: Date;
  lines: readonly OrderDbLine[];
  events: readonly OrderEventRow[];
  // Fulfilment, written when the order ships. Optional so older callers and tests can build a row without them.
  trackingNumber?: string | null;
  carrier?: string | null;
};

// What the buyer may read about a shipped order: the tracking number and, when staff recorded one, the carrier.
export type OrderTracking = { number: string; carrier: string | null };

// The Order type from orders.ts, plus what a row adds: the total paid, the region, whether it was cancelled, the lines as paid
// (option and unit price), and the tracking once it ships. A cancelled order keeps status "placed" so the tracker still reads,
// and sets cancelled.
export type OrderRow = Order & {
  totalOre: number;
  region: string | null;
  placedAt: Date;
  cancelled: boolean;
  paid: readonly OrderDbLine[];
  tracking: OrderTracking | null;
};

export function orderRowFromDb(row: OrderDbRow): OrderRow {
  const cancelled = row.status === "cancelled";
  const status: OrderStatus = isOrderStatus(row.status) ? row.status : "placed";
  const quantities = new Map<string, number>();
  for (const line of row.lines) quantities.set(line.itemId, (quantities.get(line.itemId) ?? 0) + line.quantity);
  const lines: OrderLine[] = [...quantities].map(([itemId, quantity]) => ({ itemId, quantity }));
  const trackingNumber = row.trackingNumber?.trim();
  return {
    id: row.number.toLowerCase(),
    number: row.number,
    status,
    dates: datesFromEvents(row.events),
    lines,
    totalOre: row.totalOre,
    region: row.region,
    placedAt: row.createdAt,
    cancelled,
    paid: row.lines,
    tracking: trackingNumber ? { number: trackingNumber, carrier: row.carrier?.trim() || null } : null,
  };
}

// ---- Staff stages, flags, grants, payouts, edits ----
// Pixl's stored order keys map onto LOADOUT's stage names here, so every reviewer page reads one mapping. "claimed" is not a database
// status: it is a placed order with an open fulfiller claim (FulfillmentCommitment). Flags and the grant reference reuse existing
// columns and rows (see orders-data.ts); none of them needs a new column for the staging build.

export const OWN_ORDER_MESSAGE = "Nobody fulfils their own shop order, owners included.";
export const CHANGED_MESSAGE = "The order changed while you were looking. Reload and try again.";

export const FULFILMENT_STAGE_LABELS = {
  new: "New",
  claimed: "Claimed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;
export type FulfilmentStage = keyof typeof FULFILMENT_STAGE_LABELS;

// Pixl's stored key for each LOADOUT stage. Packed is Pixl's "credited", Delivered is Pixl's "done", New is "pending".
export const PIXL_STAGE_KEY: Record<FulfilmentStage, string> = {
  new: "pending",
  claimed: "claimed",
  packed: "credited",
  shipped: "shipped",
  delivered: "done",
  cancelled: "cancelled",
};

// The LOADOUT stage of an order. Null for a status the database should never hold.
export function fulfilmentStage(status: string, claimed: boolean): FulfilmentStage | null {
  switch (status) {
    case "placed":
      return claimed ? "claimed" : "new";
    case "packed":
      return "packed";
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return null;
  }
}

// A flag is an order status event with one of these statuses. The newest flag event decides whether the order is flagged.
export const FLAG_STATUS = "flagged";
export const FLAG_CLEARED_STATUS = "flag_cleared";

export function isFlaggedFromEvents(events: readonly { status: string; at: Date }[]): boolean {
  let latest: { status: string; at: Date } | null = null;
  for (const event of events) {
    if (event.status !== FLAG_STATUS && event.status !== FLAG_CLEARED_STATUS) continue;
    if (!latest || event.at.getTime() >= latest.at.getTime()) latest = event;
  }
  return latest?.status === FLAG_STATUS;
}

// Staff may cancel (and refund) an order until it ships. A buyer may cancel only a placed order (checkCancel).
export function checkStaffCancel(status: string): Verdict {
  if (status === "placed" || status === "packed") return { ok: true };
  return { ok: false, message: `Only a placed or packed order can be cancelled by staff. This one is ${status}.` };
}

// A fulfiller may flag an order only while it can still be packed or sent.
export function checkFlaggable(status: string): Verdict {
  if (status === "placed" || status === "packed") return { ok: true };
  return { ok: false, message: `Only a placed or packed order can be flagged. This one is ${status}.` };
}

// A grant has no parcel. Its reference goes in the tracking field, with the carrier set to GRANT_CARRIER, so the buyer reads it the
// same way as a tracking number.
export const GRANT_CARRIER = "Grant";

export function checkGrantRef(raw: unknown): { ok: true; value: string } | { ok: false; message: string } {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (text === "") return { ok: false, message: "Enter the grant reference before sending the grant." };
  if (text.length > ORDER_TRACKING_MAX) return { ok: false, message: `The grant reference is at most ${ORDER_TRACKING_MAX} characters.` };
  return { ok: true, value: text };
}

// Fulfiller payouts, settled when the order ships: 2 Ore per item, and 1 Ore per grant (owner, 22 Nov 2026).
export const FULFILMENT_PAYOUT_ORE_PER_ITEM = 2;
export const FULFILMENT_PAYOUT_ORE_PER_GRANT = 1;

export function itemCountOf(lines: readonly { quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + Math.max(0, Math.trunc(line.quantity)), 0);
}

export function fulfilmentPayoutOre(input: { items: number; grant: boolean }): number {
  if (input.grant) return FULFILMENT_PAYOUT_ORE_PER_GRANT;
  return Math.max(0, Math.trunc(input.items)) * FULFILMENT_PAYOUT_ORE_PER_ITEM;
}

// Edits to the shipment after it left: a blank field is left alone, never cleared, so a tracking number cannot be wiped by a later edit.
export type ShipmentEdit = { trackingNumber?: string; carrier?: string; supplier?: string };
export type ShipmentEditCheck = { ok: true; value: ShipmentEdit } | { ok: false; message: string };

export function checkShipmentEdit(input: { trackingNumber?: unknown; carrier?: unknown; supplier?: unknown }): ShipmentEditCheck {
  const value: ShipmentEdit = {};
  if (input.trackingNumber !== undefined) {
    const tracking = optionalText(input.trackingNumber, ORDER_TRACKING_MAX, "A tracking number");
    if (!tracking.ok) return tracking;
    if (tracking.value) value.trackingNumber = tracking.value;
  }
  if (input.carrier !== undefined) {
    const carrier = optionalText(input.carrier, ORDER_CARRIER_MAX, "A carrier");
    if (!carrier.ok) return carrier;
    if (carrier.value) value.carrier = carrier.value;
  }
  if (input.supplier !== undefined) {
    const supplier = optionalText(input.supplier, ORDER_SUPPLIER_MAX, "A supplier");
    if (!supplier.ok) return supplier;
    if (supplier.value) value.supplier = supplier.value;
  }
  return { ok: true, value };
}

// The real cost of an order in whole cents. It is recorded in the audit row, since orders have no cost column yet.
export const ORDER_COST_CENTS_MAX = 10_000_000;

export function checkCostCents(raw: unknown): { ok: true; value: number } | { ok: false; message: string } {
  if (typeof raw !== "number" || !Number.isSafeInteger(raw) || raw < 0 || raw > ORDER_COST_CENTS_MAX) {
    return { ok: false, message: "Enter the real cost in dollars, as a plain amount." };
  }
  return { ok: true, value: raw };
}

// ---- Catalog rows ----

export function isTrack(value: string): value is Track {
  return (TRACKS as readonly string[]).includes(value);
}

export type ShopItemRow = { id: string; name: string; kind: string; baseOre: number; tracks: readonly string[]; blurb: string; limited: boolean };

// A stand-in photo for a row that has no static catalog entry (a sprite from the homepage set).
export const SPRITE_FALLBACK = "/loadout/sprites/ore.png";

// The database holds the fields staff change (name, price, tracks, blurb, limited). The photo, the level lock and the credit stay in
// the static catalog, matched by id.
export function shopItemFromRow(row: ShopItemRow, base: ShopItem | null): ShopItem {
  const tracks = row.tracks.filter(isTrack);
  if (base) {
    return { ...base, name: row.name, kind: row.kind, baseOre: row.baseOre, blurb: row.blurb, tracks, limited: row.limited };
  }
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    blurb: row.blurb,
    tracks,
    baseOre: row.baseOre,
    limited: row.limited,
    photo: SPRITE_FALLBACK,
    width: 32,
    height: 32,
    icon: true,
  };
}
