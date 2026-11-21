import { lockFor, priceFor, shopItemById, type ShopItem, type ShopPrice, type TrackHours } from "./shop";

// A builder's order history and wishlist for the Shop. Pixl's dashboard has no builder orders page, so this is designed from
// plans/02 (a personal wishlist that does not reserve stock or lock a price; delivery may vary by region). Nothing can be
// ordered yet: the orders below are fixture rows with fictional numbers that point at real catalog ids, and the wishlist is
// a list of catalog ids. Prices come from the shop's own `priceFor`, so a row can never disagree with the shop.

export const ORDER_STATUSES = ["placed", "packed", "shipped", "delivered"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

// What happens after each status, in plain words. Delivery times vary by region (plans/02), so none is promised.
const NEXT: Record<OrderStatus, string> = {
  placed: "The team packs your order next.",
  packed: "Your order goes to the carrier next.",
  shipped: "It is on its way. Delivery time depends on your region.",
  delivered: "Nothing more to do. Your order has arrived.",
};

export type OrderLine = { itemId: string; quantity: number };
// `dates` holds the day each status was reached (YYYY-MM-DD), for the statuses reached so far and no others.
export type Order = { id: string; number: string; status: OrderStatus; dates: Partial<Record<OrderStatus, string>>; lines: readonly OrderLine[] };

// Fictional order numbers. The ids are the numbers in lower case, for the address.
export const ORDERS: readonly Order[] = [
  { id: "lo-1042", number: "LO-1042", status: "delivered", dates: { placed: "2026-10-02", packed: "2026-10-04", shipped: "2026-10-06", delivered: "2026-10-12" }, lines: [{ itemId: "pico-w", quantity: 1 }, { itemId: "breadboard-kit", quantity: 1 }] },
  { id: "lo-1057", number: "LO-1057", status: "shipped", dates: { placed: "2026-10-28", packed: "2026-10-30", shipped: "2026-11-03" }, lines: [{ itemId: "mechanical-keyboard", quantity: 1 }] },
  { id: "lo-1063", number: "LO-1063", status: "packed", dates: { placed: "2026-11-09", packed: "2026-11-12" }, lines: [{ itemId: "multimeter", quantity: 1 }, { itemId: "pico-w", quantity: 2 }] },
];

// Catalog ids on the sample builder's wishlist, in the order they were saved.
export const WISHLIST_IDS: readonly string[] = ["oscilloscope", "framework-12", "raspberry-pi-5", "flipper-zero", "gpu-cloud-credits"];

export const ORDERS_CLOSED_SENTENCE = "Ordering and wishlists open with the Shop release. Nothing here is saved.";

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

// The sentence about what comes after this status.
export function nextStepText(status: OrderStatus): string {
  return NEXT[status];
}

// The status that follows, or null once delivered.
export function nextStatus(status: OrderStatus): OrderStatus | null {
  return ORDER_STATUSES[ORDER_STATUSES.indexOf(status) + 1] ?? null;
}

// Zero-based place on the status strip, for a stepper.
export function statusIndex(status: OrderStatus): number {
  return ORDER_STATUSES.indexOf(status);
}

export function orderById(id: string): Order | null {
  return ORDERS.find((order) => order.id === id) ?? null;
}

// An order is open until it is delivered.
export function isOpen(order: Order): boolean {
  return order.status !== "delivered";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2 Oct 2026" from a YYYY-MM-DD day, or null when the text is not one. Read as plain parts, so no time zone can move it.
export function formatOrderDay(day: string | undefined): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? "");
  if (!match) return null;
  const month = Number(match[2]);
  const date = Number(match[3]);
  if (month < 1 || month > 12) return null;
  // Day 0 of the next month is the last day of this one, so leap years need no special case.
  const last = new Date(0);
  last.setUTCFullYear(Number(match[1]), month, 0);
  if (date < 1 || date > last.getUTCDate()) return null;
  return `${date} ${MONTHS[month - 1]} ${match[1]}`;
}

// The day an order reached a status, written out, or null if it has not got there.
export function statusDay(order: Order, status: OrderStatus): string | null {
  return formatOrderDay(order.dates[status]);
}

export type ResolvedLine = { item: ShopItem; quantity: number; unit: number; total: number };

// The lines of an order with their catalog item and price. A line whose item is no longer in the catalog is left out
// rather than guessed at.
export function orderLines(order: Order, approved: TrackHours): ResolvedLine[] {
  const resolved: ResolvedLine[] = [];
  for (const line of order.lines) {
    const item = shopItemById(line.itemId);
    if (!item) continue;
    const quantity = Math.max(1, Math.trunc(line.quantity));
    const unit = priceFor(item, approved).final;
    resolved.push({ item, quantity, unit, total: unit * quantity });
  }
  return resolved;
}

export function orderTotal(order: Order, approved: TrackHours): number {
  return orderLines(order, approved).reduce((sum, line) => sum + line.total, 0);
}

// How many things are in the order, counting quantities.
export function itemCount(order: Order, approved: TrackHours): number {
  return orderLines(order, approved).reduce((sum, line) => sum + line.quantity, 0);
}

// "Pico W, Breadboard and component starter kit" or "Pico W x2": the items in an order on one line.
export function orderSummary(order: Order, approved: TrackHours): string {
  return orderLines(order, approved)
    .map((line) => (line.quantity > 1 ? `${line.item.name} x${line.quantity}` : line.item.name))
    .join(", ");
}

export type WishlistEntry = { item: ShopItem; price: ShopPrice; lock: ReturnType<typeof lockFor> };

// The wishlist as catalog items with today's price and any level lock. An id that is not in the catalog is dropped, and a
// repeated id shows once.
export function wishlistEntries(ids: readonly string[], approved: TrackHours): WishlistEntry[] {
  const entries: WishlistEntry[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const item = shopItemById(id);
    if (item) entries.push({ item, price: priceFor(item, approved), lock: lockFor(item, approved) });
  }
  return entries;
}

export const ORDERS_TABS = ["orders", "wishlist"] as const;
export type OrdersTab = (typeof ORDERS_TABS)[number];
export const ORDERS_TAB_LABELS: Record<OrdersTab, string> = { orders: "Orders", wishlist: "Wishlist" };

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

// The tab named in the address. Anything unknown shows the orders.
export function parseOrdersTab(raw: { tab?: string | string[] }): OrdersTab {
  const text = first(raw.tab).trim().toLowerCase();
  return ORDERS_TABS.find((tab) => tab === text) ?? "orders";
}

// The address for a tab. The default tab has no query.
export function ordersHref(tab: OrdersTab): string {
  return tab === "orders" ? "/dashboard/orders" : `/dashboard/orders?tab=${tab}`;
}
