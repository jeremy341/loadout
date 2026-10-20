import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { NOTIFICATIONS_KEY, SEED_NOTIFICATIONS, type PreviewNotification } from "../../../lib/notifications";
import { ORE_LEDGER_KEY, SEED_ORE_LEDGER, oreBalance, type OreEntry } from "../../../lib/ore-ledger";
import { getPreview, resetPreviewData } from "../../../lib/preview-store";
import { findShopItem } from "./data";
import {
  GEAR_KEYS,
  NO_CUSTOM,
  NO_EARNED,
  NO_ORDERS,
  NO_REFERRALS,
  acceptQuoteNow,
  addReferralNow,
  addSampleOreNow,
  advanceOrderNow,
  advanceReferralNow,
  approveQuoteNow,
  cancelOrderNow,
  claimCollectibleNow,
  createCustomRequestNow,
  placeOrderNow,
  readGearStats,
  startReviewNow,
  syncCollectibles,
  togglePinNow,
} from "./gear-store";
import type { CustomRequest } from "./logic/custom-orders";
import type { EarnedMap } from "./logic/collectibles";
import type { Order } from "./logic/orders";
import type { Referral } from "./logic/referrals";

// These run the imperative store functions against the real shared Ore ledger and notification inbox, with an
// in-memory localStorage standing in for the browser's.

const memory = new Map<string, string>();
const fakeStorage = {
  get length() {
    return memory.size;
  },
  key: (index: number) => Array.from(memory.keys())[index] ?? null,
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
};
Object.assign(globalThis, {
  window: { localStorage: fakeStorage, addEventListener: () => undefined, removeEventListener: () => undefined },
});

const ledger = () => getPreview<OreEntry[]>(ORE_LEDGER_KEY, SEED_ORE_LEDGER);
const balance = () => oreBalance(ledger());
const orders = () => getPreview<Order[]>(GEAR_KEYS.orders, NO_ORDERS);
const inbox = () => getPreview<PreviewNotification[]>(NOTIFICATIONS_KEY, SEED_NOTIFICATIONS);
const earned = () => getPreview<EarnedMap>(GEAR_KEYS.collectibles, NO_EARNED);

const pi = findShopItem("rpi-5")!;

afterAll(() => {
  Reflect.deleteProperty(globalThis, "window");
});

beforeEach(() => {
  memory.clear();
  resetPreviewData();
});

describe("placing an order through the real ledger", () => {
  test("the sample opening balance is not enough for the Pi, so nothing is spent", () => {
    expect(balance()).toBe(120);
    // Default preview levels give Hardware 3, a 2% discount on the 200 Ore Pi: 196 Ore.
    const result = placeOrderNow({ orderId: "ord_a", line: { item: pi, quantity: 1 }, ticket: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.shortBy).toBe(76);
    expect(balance()).toBe(120);
  });

  test("with enough Ore the order and the ledger entry appear together", () => {
    addSampleOreNow(250);
    expect(balance()).toBe(370);
    const result = placeOrderNow({ orderId: "ord_a", line: { item: pi, quantity: 1 }, ticket: null });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.oreSpent).toBe(196);
    expect(balance()).toBe(174);
    const entry = ledger().find((e) => e.id === result.order.spendEntryId);
    expect(entry?.amount).toBe(-196);
    expect(entry?.source).toBe("shop");
    expect(orders()).toHaveLength(1);
    const note = inbox().find((n) => n.title.includes("placed"));
    expect(note?.kind).toBe("order");
    expect(inbox().filter((n) => n.title.includes("placed"))).toHaveLength(1);
  });

  test("resubmitting the same order id does not spend again or notify again", () => {
    addSampleOreNow(250);
    placeOrderNow({ orderId: "ord_a", line: { item: pi, quantity: 1 }, ticket: null });
    const before = { balance: balance(), entries: ledger().length, orders: orders().length, notes: inbox().length };
    const again = placeOrderNow({ orderId: "ord_a", line: { item: pi, quantity: 1 }, ticket: null });
    expect(again.ok && again.duplicate).toBe(true);
    expect({ balance: balance(), entries: ledger().length, orders: orders().length, notes: inbox().length }).toEqual(before);
  });

  test("an order that costs more than the balance changes nothing", () => {
    const entriesBefore = ledger().length;
    const result = placeOrderNow({ orderId: "ord_b", line: { item: findShopItem("framework-16")!, quantity: 1 }, ticket: null });
    expect(result.ok).toBe(false);
    expect(ledger()).toHaveLength(entriesBefore);
    expect(orders()).toHaveLength(0);
    expect(balance()).toBe(120);
  });

  test("the balance never goes below zero across repeated orders", () => {
    addSampleOreNow(250);
    for (let i = 0; i < 6; i += 1) placeOrderNow({ orderId: `ord_${i}`, line: { item: pi, quantity: 1 }, ticket: null });
    expect(balance()).toBeGreaterThanOrEqual(0);
    expect(orders().length).toBe(1);
  });
});

describe("cancelling and status", () => {
  function place() {
    addSampleOreNow(250);
    const result = placeOrderNow({ orderId: "ord_a", line: { item: pi, quantity: 1 }, ticket: null });
    if (!result.ok) throw new Error(result.message);
    return result.order;
  }

  test("a cancel refunds once through the ledger and a second cancel is refused", () => {
    const order = place();
    const cancelled = cancelOrderNow(order.id);
    expect(cancelled.ok).toBe(true);
    expect(balance()).toBe(370);
    expect(ledger().filter((e) => e.amount > 0 && e.source === "shop")).toHaveLength(1);
    const again = cancelOrderNow(order.id);
    expect(again.ok).toBe(false);
    expect(balance()).toBe(370);
    expect(orders()[0].status).toBe("cancelled");
    expect(inbox().some((n) => n.title.includes("cancelled"))).toBe(true);
  });

  test("simulated statuses advance one step and notify on shipped", () => {
    const order = place();
    expect(advanceOrderNow(order.id)?.status).toBe("processing");
    expect(inbox().some((n) => n.title.includes("shipped"))).toBe(false);
    expect(advanceOrderNow(order.id)?.status).toBe("shipped");
    expect(inbox().some((n) => n.title.includes("shipped (simulated)"))).toBe(true);
    expect(cancelOrderNow(order.id).ok).toBe(false);
    expect(advanceOrderNow(order.id)?.status).toBe("delivered");
    expect(advanceOrderNow(order.id)).toBeNull();
    expect(readGearStats().ordersDelivered).toBe(1);
  });
});

describe("collectibles", () => {
  test("placing an order earns First Redemption exactly once, with one notification", () => {
    addSampleOreNow(250);
    placeOrderNow({ orderId: "ord_a", line: { item: pi, quantity: 1 }, ticket: null });
    expect(Object.keys(earned())).toContain("first-order");
    const count = () => inbox().filter((n) => n.title.includes("First Redemption")).length;
    expect(count()).toBe(1);
    expect(syncCollectibles()).toEqual([]);
    expect(count()).toBe(1);
  });

  test("manual claim and pinning", () => {
    expect(claimCollectibleNow("first-ship").ok).toBe(true);
    expect(claimCollectibleNow("first-ship").ok).toBe(false);
    expect(claimCollectibleNow("first-order").ok).toBe(false);
    expect(togglePinNow("first-ship").ok).toBe(true);
    expect(togglePinNow("mastery").ok).toBe(false);
  });
});

describe("referrals", () => {
  test("self-referral is refused and stages notify only when qualified", () => {
    expect(addReferralNow("you").ok).toBe(false);
    const added = addReferralNow("Robot Club");
    expect(added.ok).toBe(true);
    const id = (getPreview<Referral[]>(GEAR_KEYS.referrals, NO_REFERRALS))[0].id;
    const before = inbox().length;
    for (let i = 0; i < 3; i += 1) advanceReferralNow(id);
    expect(inbox()).toHaveLength(before);
    expect(advanceReferralNow(id).qualifiedNow).toBe(true);
    expect(inbox().filter((n) => n.title.includes("Referral qualified"))).toHaveLength(1);
    expect(inbox().filter((n) => n.title.includes("Recruiter")).length).toBe(1);
    expect(advanceReferralNow(id).referral).toBeNull();
    expect(readGearStats().referralsQualified).toBe(1);
  });
});

describe("custom orders", () => {
  const valid = {
    item: "Framework Laptop 13",
    url: "https://example.test/laptop",
    why: "Local builds, FPGA tooling and a travel development machine.",
    estimate: "1049",
    currency: "EUR",
    tracks: ["Tools"],
  };

  test("request, simulated review, quote, then an order that spends Ore through the ledger", () => {
    const made = createCustomRequestNow(valid);
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    const id = made.request.id;
    expect(approveQuoteNow(id, "300", false).ok).toBe(false);
    startReviewNow(id);
    expect(approveQuoteNow(id, "300", false).ok).toBe(true);
    addSampleOreNow(250);
    const placed = acceptQuoteNow(id, "ord_c", null);
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    // Tools level 6 is a 6% draft discount on the 300 Ore quote: 282 Ore.
    expect(placed.order.oreSpent).toBe(282);
    expect(placed.order.customRequestId).toBe(id);
    expect(balance()).toBe(88);
    const request = getPreview<CustomRequest[]>(GEAR_KEYS.custom, NO_CUSTOM)[0];
    expect(request.status).toBe("ordered");
    expect(request.orderId).toBe("ord_c");
    expect(acceptQuoteNow(id, "ord_d", null).ok).toBe(false);
    expect(balance()).toBe(88);
  });

  test("an invalid request is not stored", () => {
    expect(createCustomRequestNow({ ...valid, url: "nope" }).ok).toBe(false);
    expect(getPreview(GEAR_KEYS.custom, NO_CUSTOM)).toHaveLength(0);
  });
});
