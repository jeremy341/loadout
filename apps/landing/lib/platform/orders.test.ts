import { describe, expect, test } from "bun:test";
import {
  isOpen,
  isOrderStatus,
  itemCount,
  nextStatus,
  nextStepText,
  orderById,
  orderLines,
  orderSummary,
  ORDER_STATUSES,
  orderStatusLabel,
  orderTotal,
  ORDERS,
  ordersHref,
  parseOrdersTab,
  statusIndex,
  WISHLIST_IDS,
  wishlistEntries,
  type Order,
} from "./orders";
import { shopItemById, type TrackHours } from "./shop";

// The sample hours the shop uses: Tools LV.6, Systems LV.3, Compute LV.0, Hardware LV.1.
const approved: TrackHours = { Tools: 58, Systems: 14, Compute: 0, Hardware: 2 };
const order = (id: string) => orderById(id) as Order;

describe("fixtures", () => {
  test("three orders with unique ids and numbers, and five wishlist items", () => {
    expect(ORDERS).toHaveLength(3);
    expect(new Set(ORDERS.map((entry) => entry.id)).size).toBe(3);
    expect(new Set(ORDERS.map((entry) => entry.number)).size).toBe(3);
    expect(WISHLIST_IDS).toHaveLength(5);
  });

  test("every order line and wishlist id is a real catalog item", () => {
    for (const entry of ORDERS) for (const line of entry.lines) expect(shopItemById(line.itemId)).not.toBeNull();
    for (const id of WISHLIST_IDS) expect(shopItemById(id)).not.toBeNull();
  });

  test("an order id is its number in lower case", () => {
    for (const entry of ORDERS) expect(entry.id).toBe(entry.number.toLowerCase());
  });
});

describe("status", () => {
  test("the strip runs Placed, Packed, Shipped, Delivered", () => {
    expect(ORDER_STATUSES.map(orderStatusLabel)).toEqual(["Placed", "Packed", "Shipped", "Delivered"]);
  });

  test("recognises a status", () => {
    expect(isOrderStatus("shipped")).toBe(true);
    expect(isOrderStatus("lost")).toBe(false);
  });

  test("each status leads to the next, and delivered ends the strip", () => {
    expect(nextStatus("placed")).toBe("packed");
    expect(nextStatus("shipped")).toBe("delivered");
    expect(nextStatus("delivered")).toBeNull();
    expect(statusIndex("placed")).toBe(0);
    expect(statusIndex("delivered")).toBe(3);
  });

  test("each status has a next-step sentence, and none promises a delivery time", () => {
    for (const status of ORDER_STATUSES) {
      expect(nextStepText(status).length).toBeGreaterThan(0);
      expect(nextStepText(status)).not.toMatch(/\d/);
    }
  });

  test("an order is open until it is delivered", () => {
    expect(isOpen(order("lo-1042"))).toBe(false);
    expect(isOpen(order("lo-1057"))).toBe(true);
  });

  test("an unknown order is null", () => {
    expect(orderById("lo-0000")).toBeNull();
  });
});

describe("order lines and totals", () => {
  test("prices come from the shop with the sample discounts", () => {
    // The mechanical keyboard is 85 Ore with a 4.8% Tools discount: 81 Ore.
    const [line] = orderLines(order("lo-1057"), approved);
    expect(line.item.id).toBe("mechanical-keyboard");
    expect(line.unit).toBe(81);
    expect(line.total).toBe(81);
  });

  test("the total adds every line times its quantity", () => {
    const lines = orderLines(order("lo-1063"), approved);
    expect(orderTotal(order("lo-1063"), approved)).toBe(lines.reduce((sum, line) => sum + line.unit * line.quantity, 0));
    expect(itemCount(order("lo-1063"), approved)).toBe(3);
  });

  test("the summary names each item and its quantity when more than one", () => {
    expect(orderSummary(order("lo-1042"), approved)).toBe("Raspberry Pi Pico W, Breadboard and component starter kit");
    expect(orderSummary(order("lo-1063"), approved)).toBe("Multimeter, Raspberry Pi Pico W x2");
  });

  test("a line for an item that is gone is left out", () => {
    const broken: Order = { id: "x", number: "X", status: "placed", lines: [{ itemId: "gone", quantity: 1 }, { itemId: "pico-w", quantity: 1 }] };
    expect(orderLines(broken, approved).map((line) => line.item.id)).toEqual(["pico-w"]);
  });

  test("a quantity below one counts as one", () => {
    const odd: Order = { id: "x", number: "X", status: "placed", lines: [{ itemId: "pico-w", quantity: 0 }] };
    expect(itemCount(odd, approved)).toBe(1);
  });
});

describe("wishlist", () => {
  test("resolves each id to the item, its price and any lock", () => {
    const entries = wishlistEntries(WISHLIST_IDS, approved);
    expect(entries.map((entry) => entry.item.id)).toEqual([...WISHLIST_IDS]);
    const scope = entries.find((entry) => entry.item.id === "oscilloscope");
    expect(scope?.lock?.track).toBe("Hardware");
    expect(scope?.lock?.level).toBe(8);
    expect(entries.find((entry) => entry.item.id === "raspberry-pi-5")?.lock).toBeNull();
  });

  test("the price is the shop's price for the same hours", () => {
    const entry = wishlistEntries(["framework-12"], approved)[0];
    // Framework 12 relates to Tools, Systems and Compute; Tools gives the best discount, 4.8% off 1,260 Ore.
    expect(entry.price.base).toBe(1260);
    expect(entry.price.track).toBe("Tools");
    expect(entry.price.final).toBe(Math.round(1260 * (1 - 4.8 / 100)));
  });

  test("unknown and repeated ids are dropped", () => {
    expect(wishlistEntries(["nope", "pico-w", "pico-w"], approved).map((entry) => entry.item.id)).toEqual(["pico-w"]);
  });
});

describe("tab", () => {
  test("defaults to the orders and ignores anything unknown", () => {
    expect(parseOrdersTab({})).toBe("orders");
    expect(parseOrdersTab({ tab: "cart" })).toBe("orders");
  });

  test("reads the wishlist tab in any case, using the first value", () => {
    expect(parseOrdersTab({ tab: "Wishlist" })).toBe("wishlist");
    expect(parseOrdersTab({ tab: ["wishlist", "orders"] })).toBe("wishlist");
  });

  test("the default tab has no query", () => {
    expect(ordersHref("orders")).toBe("/dashboard/orders");
    expect(ordersHref("wishlist")).toBe("/dashboard/orders?tab=wishlist");
  });
});
