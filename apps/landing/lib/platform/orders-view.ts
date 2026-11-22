// What the Orders pages show for one order, whether it is a fixture row (priced by the catalog now) or a real row (what was paid).
// Pure, so it can be tested. A real row's lines and total come from what was stored at checkout: history is never re-priced.
import { orderLines, orderTotal, type Order, type ResolvedLine } from "./orders";
import { shopItemById, type TrackHours } from "./shop";
import type { OrderDbLine, OrderTracking } from "./shop-rules";

export type ViewOrder = Order & {
  totalOre?: number;
  cancelled?: boolean;
  paid?: readonly OrderDbLine[];
  // Present on real rows once the order has shipped; absent on fixtures. A grant stores its reference here with carrier "Grant".
  tracking?: OrderTracking | null;
};

// Lines of an order. Real rows group the paid lines by item, so a split requisition line shows as one row at what was paid.
export function viewLines(order: ViewOrder, approved: TrackHours): ResolvedLine[] {
  if (!order.paid) return orderLines(order, approved);
  const grouped = new Map<string, { quantity: number; total: number }>();
  for (const line of order.paid) {
    const entry = grouped.get(line.itemId) ?? { quantity: 0, total: 0 };
    entry.quantity += line.quantity;
    entry.total += line.quantity * line.unitOre;
    grouped.set(line.itemId, entry);
  }
  const resolved: ResolvedLine[] = [];
  for (const [itemId, entry] of grouped) {
    const item = shopItemById(itemId);
    if (!item) continue;
    resolved.push({ item, quantity: entry.quantity, unit: Math.round(entry.total / entry.quantity), total: entry.total });
  }
  return resolved;
}

export function viewTotal(order: ViewOrder, approved: TrackHours): number {
  return order.totalOre ?? orderTotal(order, approved);
}

export function viewCount(order: ViewOrder, approved: TrackHours): number {
  return viewLines(order, approved).reduce((sum, line) => sum + line.quantity, 0);
}

export function viewSummary(order: ViewOrder, approved: TrackHours): string {
  return viewLines(order, approved)
    .map((line) => (line.quantity > 1 ? `${line.item.name} x${line.quantity}` : line.item.name))
    .join(", ");
}
