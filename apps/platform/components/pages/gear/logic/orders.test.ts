import { describe, expect, test } from "bun:test";
import { findShopItem, type Levels } from "../data";
import {
  advanceOrder,
  canCancel,
  cancelOrder,
  filterOrders,
  isOpen,
  nextOrderNumber,
  nextStatus,
  placeOrder,
  receiptText,
  sortNewestFirst,
  ticketIsUsed,
  usedTicketIds,
  type Order,
  type PlaceOrderInput,
} from "./orders";
import type { FieldTicket } from "./pricing";

const NOW = "2026-10-20T10:00:00.000Z";
const LATER = "2026-10-21T10:00:00.000Z";
const levels: Levels = { Tools: 1, Systems: 1, Compute: 1, Hardware: 15 };

/** A tiny in-memory Ore ledger that behaves like lib/ore-ledger: append-only, refuses overdraft. */
function fakeLedger(opening: number) {
  const entries: { id: string; amount: number; reason: string }[] = [{ id: "seed", amount: opening, reason: "opening" }];
  const balance = () => entries.reduce((sum, entry) => sum + entry.amount, 0);
  const add = (amount: number, reason: string) => {
    if (balance() + amount < 0) return null;
    const entry = { id: `e${entries.length}`, amount, reason };
    entries.push(entry);
    return { id: entry.id };
  };
  return { entries, balance, spend: (amount: number, reason: string) => add(-amount, reason), refund: (amount: number, reason: string) => add(amount, reason) };
}

function input(overrides: Partial<PlaceOrderInput> = {}): PlaceOrderInput {
  return {
    orderId: "ord_1",
    line: { item: findShopItem("rpi-5")!, quantity: 1 },
    ticket: null,
    levels,
    now: NOW,
    ...overrides,
  };
}

describe("placeOrder", () => {
  test("creates the order and the ledger entry together", () => {
    const ledger = fakeLedger(500);
    const result = placeOrder({ orders: [], balance: ledger.balance(), spend: ledger.spend }, input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Raspberry Pi 5: 200 Ore, Hardware level 15 gives 20%: 160 Ore.
    expect(result.order.oreSpent).toBe(160);
    expect(result.order.saved).toBe(40);
    expect(result.order.status).toBe("placed");
    expect(result.order.number).toBe("LO-0001");
    expect(result.order.spendEntryId).toBe("e1");
    expect(ledger.balance()).toBe(340);
    expect(ledger.entries).toHaveLength(2);
    expect(result.orders).toHaveLength(1);
  });

  test("is idempotent per order id: a second submit spends nothing", () => {
    const ledger = fakeLedger(500);
    const first = placeOrder({ orders: [], balance: ledger.balance(), spend: ledger.spend }, input());
    if (!first.ok) throw new Error("first order failed");
    const second = placeOrder({ orders: first.orders, balance: ledger.balance(), spend: ledger.spend }, input());
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.duplicate).toBe(true);
      expect(second.order.id).toBe(first.order.id);
    }
    expect(ledger.balance()).toBe(340);
    expect(ledger.entries).toHaveLength(2);
  });

  test("refuses when the balance is too low and reports how much more is needed", () => {
    const ledger = fakeLedger(100);
    const result = placeOrder({ orders: [], balance: ledger.balance(), spend: ledger.spend }, input());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("insufficient");
    expect(result.shortBy).toBe(60);
    expect(ledger.balance()).toBe(100);
    expect(ledger.entries).toHaveLength(1);
  });

  test("an exact balance is enough", () => {
    const ledger = fakeLedger(160);
    const result = placeOrder({ orders: [], balance: ledger.balance(), spend: ledger.spend }, input());
    expect(result.ok).toBe(true);
    expect(ledger.balance()).toBe(0);
  });

  test("if the ledger refuses the spend, no order is created", () => {
    const result = placeOrder({ orders: [], balance: 9999, spend: () => null }, input());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("ledger-refused");
  });

  test("a locked item cannot be ordered, even with a Requisition", () => {
    const ledger = fakeLedger(99999);
    const gpu = findShopItem("gpu-grant")!;
    const ticket: FieldTicket = { id: "field:Compute:3", kind: "field", track: "Compute", level: 3 };
    const result = placeOrder(
      { orders: [], balance: ledger.balance(), spend: ledger.spend },
      input({ line: { item: gpu, quantity: 1 }, ticket, levels: { Tools: 1, Systems: 1, Compute: 3, Hardware: 1 } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("locked");
    expect(ledger.entries).toHaveLength(1);
  });

  test("rejects a bad quantity", () => {
    const ledger = fakeLedger(5000);
    for (const quantity of [0, -1, 1.5, 6]) {
      const result = placeOrder({ orders: [], balance: ledger.balance(), spend: ledger.spend }, input({ line: { item: findShopItem("rpi-5")!, quantity } }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe("invalid-quantity");
    }
    expect(ledger.entries).toHaveLength(1);
  });

  test("a Requisition lowers the price once and is then spent", () => {
    const ledger = fakeLedger(5000);
    const printer = findShopItem("enclosed-printer")!;
    const ticket: FieldTicket = { id: "field:Hardware:15", kind: "field", track: "Hardware", level: 15 };
    const first = placeOrder({ orders: [], balance: ledger.balance(), spend: ledger.spend }, input({ line: { item: printer, quantity: 1 }, ticket }));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.order.oreSpent).toBe(600);
    expect(first.order.ticket?.saving).toBe(200);
    expect(ticketIsUsed(first.orders, ticket.id)).toBe(true);

    const again = placeOrder({ orders: first.orders, balance: ledger.balance(), spend: ledger.spend }, input({ orderId: "ord_2", line: { item: printer, quantity: 1 }, ticket }));
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.code).toBe("ticket-used");
    expect(ledger.balance()).toBe(4400);
  });

  test("an unusable Requisition blocks the order instead of being ignored", () => {
    const ledger = fakeLedger(5000);
    const ticket: FieldTicket = { id: "field:Hardware:3", kind: "field", track: "Hardware", level: 3 };
    const result = placeOrder({ orders: [], balance: ledger.balance(), spend: ledger.spend }, input({ ticket }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("ticket-invalid");
    expect(ledger.entries).toHaveLength(1);
  });

  test("order numbers count up", () => {
    const ledger = fakeLedger(5000);
    const a = placeOrder({ orders: [], balance: ledger.balance(), spend: ledger.spend }, input());
    if (!a.ok) throw new Error("a");
    const b = placeOrder({ orders: a.orders, balance: ledger.balance(), spend: ledger.spend }, input({ orderId: "ord_2" }));
    if (!b.ok) throw new Error("b");
    expect(b.order.number).toBe("LO-0002");
    expect(nextOrderNumber(b.orders)).toBe("LO-0003");
  });
});

function placed(ledger: ReturnType<typeof fakeLedger>, overrides: Partial<PlaceOrderInput> = {}, orders: Order[] = []) {
  const result = placeOrder({ orders, balance: ledger.balance(), spend: ledger.spend }, input(overrides));
  if (!result.ok) throw new Error(result.message);
  return result;
}

describe("cancelOrder", () => {
  test("refunds the full spend once and marks the order cancelled", () => {
    const ledger = fakeLedger(500);
    const { orders, order } = placed(ledger);
    const result = cancelOrder(orders, order.id, LATER, ledger.refund);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.status).toBe("cancelled");
    expect(result.order.refundEntryId).toBe("e2");
    expect(ledger.balance()).toBe(500);
    expect(result.order.history.map((h) => h.status)).toEqual(["placed", "cancelled"]);
  });

  test("a second cancel never refunds again", () => {
    const ledger = fakeLedger(500);
    const { orders, order } = placed(ledger);
    const first = cancelOrder(orders, order.id, LATER, ledger.refund);
    if (!first.ok) throw new Error("first");
    const second = cancelOrder(first.orders, order.id, LATER, ledger.refund);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe("already-cancelled");
    expect(ledger.balance()).toBe(500);
    expect(ledger.entries).toHaveLength(3);
  });

  test("works while Processing but not once Shipped or Delivered", () => {
    const ledger = fakeLedger(500);
    const { orders } = placed(ledger);
    const processing = advanceOrder(orders, "ord_1", LATER);
    expect(canCancel(processing.order!)).toBe(true);
    const shipped = advanceOrder(processing.orders, "ord_1", LATER);
    expect(canCancel(shipped.order!)).toBe(false);
    const result = cancelOrder(shipped.orders, "ord_1", LATER, ledger.refund);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not-cancellable");
    expect(ledger.balance()).toBe(340);
  });

  test("an unknown order id is refused without touching the ledger", () => {
    const ledger = fakeLedger(500);
    const result = cancelOrder([], "nope", LATER, ledger.refund);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not-found");
    expect(ledger.entries).toHaveLength(1);
  });

  test("if the ledger cannot record the refund the order stays as it was", () => {
    const ledger = fakeLedger(500);
    const { orders, order } = placed(ledger);
    const result = cancelOrder(orders, order.id, LATER, () => null);
    expect(result.ok).toBe(false);
    expect(orders[0].status).toBe("placed");
  });

  test("cancelling restores a Requisition for later orders", () => {
    const ledger = fakeLedger(5000);
    const printer = findShopItem("enclosed-printer")!;
    const ticket: FieldTicket = { id: "field:Hardware:15", kind: "field", track: "Hardware", level: 15 };
    const first = placed(ledger, { line: { item: printer, quantity: 1 }, ticket });
    expect(usedTicketIds(first.orders).has(ticket.id)).toBe(true);
    const cancelled = cancelOrder(first.orders, first.order.id, LATER, ledger.refund);
    if (!cancelled.ok) throw new Error("cancel");
    expect(usedTicketIds(cancelled.orders).has(ticket.id)).toBe(false);
    const reuse = placed(ledger, { orderId: "ord_2", line: { item: printer, quantity: 1 }, ticket }, cancelled.orders);
    expect(reuse.order.ticket?.id).toBe(ticket.id);
  });
});

describe("status flow", () => {
  test("goes Placed, Processing, Shipped, Delivered and stops", () => {
    expect(nextStatus("placed")).toBe("processing");
    expect(nextStatus("processing")).toBe("shipped");
    expect(nextStatus("shipped")).toBe("delivered");
    expect(nextStatus("delivered")).toBeNull();
    expect(nextStatus("cancelled")).toBeNull();
  });

  test("advancing stamps history and leaves cancelled orders alone", () => {
    const ledger = fakeLedger(500);
    const { orders } = placed(ledger);
    const step = advanceOrder(orders, "ord_1", LATER);
    expect(step.order?.status).toBe("processing");
    expect(step.order?.history).toHaveLength(2);
    const cancelled = cancelOrder(step.orders, "ord_1", LATER, ledger.refund);
    if (!cancelled.ok) throw new Error("cancel");
    const after = advanceOrder(cancelled.orders, "ord_1", LATER);
    expect(after.order).toBeNull();
    expect(after.orders[0].status).toBe("cancelled");
  });
});

describe("listing helpers", () => {
  test("filters by status and open", () => {
    const ledger = fakeLedger(5000);
    const a = placed(ledger);
    const b = placed(ledger, { orderId: "ord_2" }, a.orders);
    let orders = advanceOrder(b.orders, "ord_2", LATER).orders;
    orders = advanceOrder(orders, "ord_2", LATER).orders;
    orders = advanceOrder(orders, "ord_2", LATER).orders;
    expect(filterOrders(orders, "delivered").map((o) => o.id)).toEqual(["ord_2"]);
    expect(filterOrders(orders, "open").map((o) => o.id)).toEqual(["ord_1"]);
    expect(filterOrders(orders, "all")).toHaveLength(2);
    expect(isOpen(orders[1])).toBe(false);
  });

  test("sorts newest first", () => {
    const ledger = fakeLedger(5000);
    const a = placed(ledger, { now: NOW });
    const b = placed(ledger, { orderId: "ord_2", now: LATER }, a.orders);
    expect(sortNewestFirst(b.orders).map((o) => o.id)).toEqual(["ord_2", "ord_1"]);
  });

  test("the receipt names the order, discounts and ledger entry", () => {
    const ledger = fakeLedger(500);
    const { order } = placed(ledger);
    const text = receiptText(order);
    expect(text).toContain("LO-0001");
    expect(text).toContain("Raspberry Pi 5");
    expect(text).toContain("Ore spent: 160");
    expect(text).toContain(order.spendEntryId);
    expect(text).toContain("not a real order");
  });
});
