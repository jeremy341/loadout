import type { TrackName } from "../../../../lib/sample/builders";
import { DRAFT_RULES, type Levels } from "../data";
import { meetsRequirement, priceOrder, type PriceBreakdown, type PriceableItem, type Ticket } from "./pricing";

// Preview orders. The functions here are pure: the caller passes the ledger in as `spend` / `refund` callbacks, so
// the same code runs against the real Ore ledger in the browser and a fake one in tests.
//
// Atomic: every check runs before Ore moves, Ore moves once, and the order is created from the entry the ledger
// returned. If the ledger refuses (overdraft), no order exists.
// Idempotent: an order id that already exists returns that order and spends nothing, so a double click or a retry
// can never charge twice. A refund is paid once per order.

export const ORDER_FLOW = ["placed", "processing", "shipped", "delivered"] as const;
export type FlowStatus = (typeof ORDER_FLOW)[number];
export type OrderStatus = FlowStatus | "cancelled";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export interface OrderLine {
  itemId: string;
  name: string;
  quantity: number;
  /** Base Ore per unit. */
  unitBase: number;
  /** Ore per unit after the permanent track discount. */
  unitFinal: number;
  permanentPercent: number;
  permanentTrack: TrackName | null;
  /** Permanent saving across the whole line. */
  permanentSaving: number;
  /** A Custom Order line came from an approved quote, not the catalog. */
  custom: boolean;
}

export interface OrderTicket {
  id: string;
  label: string;
  saving: number;
}

export interface StatusStamp {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: string;
  /** Human number, "LO-0001". Preview only. */
  number: string;
  createdAt: string;
  status: OrderStatus;
  history: StatusStamp[];
  lines: OrderLine[];
  oreSpent: number;
  saved: number;
  ticket: OrderTicket | null;
  spendEntryId: string;
  refundEntryId: string | null;
  /** Set when the order came from an approved Custom Order request. */
  customRequestId: string | null;
}

export interface LedgerResult {
  id: string;
}

export interface OrderLineInput {
  item: PriceableItem;
  quantity: number;
  custom?: boolean;
  customRequestId?: string | null;
}

export interface PlaceOrderInput {
  /** Created once when the confirm step opens. Resubmitting it never spends twice. */
  orderId: string;
  line: OrderLineInput;
  ticket: Ticket | null;
  levels: Levels;
  now: string;
}

export interface OrderDeps {
  orders: readonly Order[];
  balance: number;
  /** Spends Ore through the ledger. Returns the new entry, or null when the ledger refuses. */
  spend: (amount: number, reason: string) => LedgerResult | null;
}

export type PlaceFailure =
  | "invalid-quantity"
  | "locked"
  | "ticket-invalid"
  | "ticket-used"
  | "insufficient"
  | "ledger-refused"
  | "unavailable";

export type PlaceResult =
  | { ok: true; order: Order; orders: Order[]; duplicate: boolean }
  | { ok: false; code: PlaceFailure; message: string; shortBy?: number };

/** A Requisition is spent while any order that is not cancelled holds it. */
export function ticketIsUsed(orders: readonly Order[], ticketId: string): boolean {
  return orders.some((order) => order.status !== "cancelled" && order.ticket?.id === ticketId);
}

export function usedTicketIds(orders: readonly Order[]): Set<string> {
  const used = new Set<string>();
  for (const order of orders) if (order.status !== "cancelled" && order.ticket) used.add(order.ticket.id);
  return used;
}

export function nextOrderNumber(orders: readonly Order[]): string {
  let highest = 0;
  for (const order of orders) {
    const parsed = Number.parseInt(order.number.replace(/\D/g, ""), 10);
    if (Number.isFinite(parsed) && parsed > highest) highest = parsed;
  }
  return `LO-${String(highest + 1).padStart(4, "0")}`;
}

export function placeOrder(deps: OrderDeps, input: PlaceOrderInput): PlaceResult {
  const existing = deps.orders.find((order) => order.id === input.orderId);
  if (existing) return { ok: true, order: existing, orders: [...deps.orders], duplicate: true };

  const { item } = input.line;
  const quantity = input.line.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > DRAFT_RULES.maxQuantity) {
    return { ok: false, code: "invalid-quantity", message: `Choose a quantity from 1 to ${DRAFT_RULES.maxQuantity}.` };
  }

  const requirement = meetsRequirement(item.requires, input.levels);
  if (!requirement.ok) {
    return {
      ok: false,
      code: "locked",
      message: `This item needs a higher level. You are ${requirement.levelsRemaining} ${requirement.levelsRemaining === 1 ? "level" : "levels"} short. A Requisition cannot unlock it.`,
    };
  }

  // A Custom Order accepts a Requisition only when its approved quote marks it eligible; the caller sets that on
  // `item.requisitionEligible`, and checkTicket enforces it.
  const ticket = input.ticket;
  if (ticket && ticketIsUsed(deps.orders, ticket.id)) {
    return { ok: false, code: "ticket-used", message: "That Requisition is already used on another order." };
  }

  const price = priceOrder(item, quantity, input.levels, ticket);
  if (ticket && price.breakdown.ticketRejected) {
    return { ok: false, code: "ticket-invalid", message: price.breakdown.ticketRejected };
  }
  if (price.total > deps.balance) {
    const shortBy = price.total - deps.balance;
    return { ok: false, code: "insufficient", message: `You need ${shortBy.toLocaleString("en-GB")} more Ore.`, shortBy };
  }

  const number = nextOrderNumber(deps.orders);
  const entry = deps.spend(price.total, `Order ${number}: ${quantity > 1 ? `${quantity} x ` : ""}${item.name}`);
  if (!entry) {
    return { ok: false, code: "ledger-refused", message: "The Ore ledger refused the spend, so no order was created." };
  }

  const line: OrderLine = {
    itemId: item.id,
    name: item.name,
    quantity,
    unitBase: price.breakdown.base,
    unitFinal: price.unitFinal,
    permanentPercent: price.breakdown.permanentPercent,
    permanentTrack: price.breakdown.permanentTrack,
    permanentSaving: price.permanentSavingTotal,
    custom: Boolean(input.line.custom),
  };
  const order: Order = {
    id: input.orderId,
    number,
    createdAt: input.now,
    status: "placed",
    history: [{ status: "placed", at: input.now }],
    lines: [line],
    oreSpent: price.total,
    saved: price.saved,
    ticket: price.breakdown.ticket,
    spendEntryId: entry.id,
    refundEntryId: null,
    customRequestId: input.line.customRequestId ?? null,
  };
  return { ok: true, order, orders: [...deps.orders, order], duplicate: false };
}

export function canCancel(order: Order): boolean {
  return (order.status === "placed" || order.status === "processing") && order.refundEntryId === null;
}

export type CancelFailure = "not-found" | "not-cancellable" | "already-cancelled" | "ledger-refused";

export type CancelResult =
  | { ok: true; order: Order; orders: Order[] }
  | { ok: false; code: CancelFailure; message: string };

/**
 * Cancels an order that has not shipped and refunds the whole spend once. The preview also restores any
 * Requisition on it, because a Requisition is only counted as spent while its order is not cancelled. Real buyer
 * cancellation terms are not settled (plans/02 section 26.8).
 */
export function cancelOrder(
  orders: readonly Order[],
  orderId: string,
  now: string,
  refund: (amount: number, reason: string) => LedgerResult | null,
): CancelResult {
  const order = orders.find((candidate) => candidate.id === orderId);
  if (!order) return { ok: false, code: "not-found", message: "That order no longer exists." };
  if (order.status === "cancelled" || order.refundEntryId !== null) {
    return { ok: false, code: "already-cancelled", message: "This order was already cancelled and refunded." };
  }
  if (!canCancel(order)) {
    return { ok: false, code: "not-cancellable", message: "An order can be cancelled only while it is Placed or Processing." };
  }
  const entry = refund(order.oreSpent, `Refund for cancelled order ${order.number}`);
  if (!entry) return { ok: false, code: "ledger-refused", message: "The Ore ledger could not record the refund, so the order is unchanged." };
  const updated: Order = {
    ...order,
    status: "cancelled",
    history: [...order.history, { status: "cancelled", at: now }],
    refundEntryId: entry.id,
  };
  return { ok: true, order: updated, orders: orders.map((candidate) => (candidate.id === orderId ? updated : candidate)) };
}

export function nextStatus(status: OrderStatus): FlowStatus | null {
  if (status === "cancelled") return null;
  const index = ORDER_FLOW.indexOf(status);
  return index >= 0 && index < ORDER_FLOW.length - 1 ? ORDER_FLOW[index + 1] : null;
}

export function advanceOrder(orders: readonly Order[], orderId: string, now: string): { orders: Order[]; order: Order | null } {
  const order = orders.find((candidate) => candidate.id === orderId);
  const next = order ? nextStatus(order.status) : null;
  if (!order || !next) return { orders: [...orders], order: null };
  const updated: Order = { ...order, status: next, history: [...order.history, { status: next, at: now }] };
  return { orders: orders.map((candidate) => (candidate.id === orderId ? updated : candidate)), order: updated };
}

/** True while an order is neither delivered nor cancelled. */
export function isOpen(order: Order): boolean {
  return order.status !== "delivered" && order.status !== "cancelled";
}

export function filterOrders(orders: readonly Order[], status: OrderStatus | "all" | "open"): Order[] {
  if (status === "all") return [...orders];
  if (status === "open") return orders.filter(isOpen);
  return orders.filter((order) => order.status === status);
}

/** Newest first, ties broken by order number. */
export function sortNewestFirst(orders: readonly Order[]): Order[] {
  return [...orders].sort((a, b) => (a.createdAt === b.createdAt ? b.number.localeCompare(a.number) : b.createdAt.localeCompare(a.createdAt)));
}

export function receiptText(order: Order): string {
  const lines = [
    `LOADOUT preview receipt ${order.number}`,
    "Sample data. This is not a real order and nothing was sent to LOADOUT.",
    `Placed: ${order.createdAt}`,
    `Status: ${STATUS_LABELS[order.status]}`,
    "",
  ];
  for (const line of order.lines) {
    lines.push(`${line.quantity} x ${line.name}: ${line.unitBase.toLocaleString("en-GB")} Ore each before discounts`);
    if (line.permanentPercent > 0) {
      lines.push(`  Track discount ${line.permanentPercent}%${line.permanentTrack ? ` (${line.permanentTrack})` : ""}: -${line.permanentSaving.toLocaleString("en-GB")} Ore`);
    }
  }
  if (order.ticket) lines.push(`${order.ticket.label}: -${order.ticket.saving.toLocaleString("en-GB")} Ore`);
  lines.push("", `Ore spent: ${order.oreSpent.toLocaleString("en-GB")}`, `Ore saved: ${order.saved.toLocaleString("en-GB")}`, `Ledger entry: ${order.spendEntryId}`);
  if (order.refundEntryId) lines.push(`Refund ledger entry: ${order.refundEntryId}`);
  lines.push("", "Availability, delivery, tax and shipping are confirmed once ordering opens.");
  return lines.join("\n");
}

export type { PriceBreakdown };
