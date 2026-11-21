import { describe, expect, test } from "bun:test";
import {
  canCommit,
  canRemoveFulfiller,
  canSave,
  checkAdvance,
  checkCancel,
  checkRegion,
  datesFromEvents,
  hasStock,
  isTrack,
  mergeRequestLines,
  nextOrderNumber,
  ORDER_MAX_LINES,
  ORDER_MAX_QUANTITY,
  ORDER_NUMBER_FLOOR,
  orderRowFromDb,
  priceOrder,
  shopItemFromRow,
  stockForNewItem,
  stockNeeds,
  usedFromRows,
  WISHLIST_MAX,
  type PricingItem,
} from "./shop-rules";
import { priceFor, type ShopItem, type TrackHours } from "./shop";
import { requisitionsAvailable, type RequisitionCounts } from "./requisitions";

const NONE: TrackHours = { Tools: 0, Systems: 0, Compute: 0, Hardware: 0 };
const NO_REQ: RequisitionCounts = { Tools: 0, Systems: 0, Compute: 0, Hardware: 0 };
const ONE_TOOLS: RequisitionCounts = { Tools: 1, Systems: 0, Compute: 0, Hardware: 0 };

function item(id: string, over: Partial<ShopItem> = {}): ShopItem {
  return { id, name: `Item ${id}`, kind: "Parts", blurb: "", tracks: ["Tools"], baseOre: 1000, photo: "/x.png", width: 1, height: 1, ...over };
}

function line(id: string, over: Partial<PricingItem> = {}): PricingItem {
  return { item: item(id), option: "", quantity: 1, stock: 25, active: true, ...over };
}

describe("nextOrderNumber", () => {
  test("starts above the floor when there are no orders", () => {
    expect(nextOrderNumber([])).toBe("LO-1101");
    expect(ORDER_NUMBER_FLOOR).toBe(1100);
  });

  test("stays above the fixture numbers", () => {
    expect(nextOrderNumber(["LO-1042", "LO-1057", "LO-1063"])).toBe("LO-1101");
  });

  test("adds one to the numeric maximum", () => {
    expect(nextOrderNumber(["LO-1500"])).toBe("LO-1501");
  });

  test("compares numbers, not strings", () => {
    expect(nextOrderNumber(["LO-999", "LO-1200"])).toBe("LO-1201");
    expect(nextOrderNumber(["LO-9999", "LO-10000"])).toBe("LO-10001");
  });

  test("ignores anything that is not an order number", () => {
    expect(nextOrderNumber(["lo-2000", "X-3000", "LO-", "LO-12a"])).toBe("LO-1101");
  });
});

describe("checkAdvance", () => {
  test("moves one step forward along placed, packed, shipped, delivered", () => {
    expect(checkAdvance("placed", "packed")).toEqual({ ok: true });
    expect(checkAdvance("packed", "shipped")).toEqual({ ok: true });
    expect(checkAdvance("shipped", "delivered")).toEqual({ ok: true });
  });

  test("refuses to skip a step", () => {
    const verdict = checkAdvance("placed", "shipped");
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.message).toContain("packed");
    expect(checkAdvance("placed", "delivered").ok).toBe(false);
  });

  test("never moves backwards", () => {
    const verdict = checkAdvance("packed", "placed");
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.message).toContain("forward");
    expect(checkAdvance("delivered", "placed").ok).toBe(false);
    expect(checkAdvance("shipped", "packed").ok).toBe(false);
  });

  test("refuses the same status again", () => {
    const verdict = checkAdvance("packed", "packed");
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.message).toContain("already");
  });

  test("a delivered order cannot move on", () => {
    expect(checkAdvance("delivered", "delivered").ok).toBe(false);
  });

  test("a cancelled order cannot move on", () => {
    expect(checkAdvance("cancelled", "packed").ok).toBe(false);
  });

  test("unknown statuses are refused", () => {
    expect(checkAdvance("placed", "lost").ok).toBe(false);
    expect(checkAdvance("lost", "placed").ok).toBe(false);
    expect(checkAdvance("placed", "cancelled").ok).toBe(false);
  });
});

describe("checkCancel", () => {
  test("only a placed order can be cancelled", () => {
    expect(checkCancel("placed")).toEqual({ ok: true });
    for (const status of ["packed", "shipped", "delivered", "cancelled"]) {
      const verdict = checkCancel(status);
      expect(verdict.ok).toBe(false);
      if (!verdict.ok) expect(verdict.message).toContain(status);
    }
  });
});

describe("mergeRequestLines", () => {
  test("refuses an empty order", () => {
    const result = mergeRequestLines([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.code).toBe("empty");
  });

  test("adds up repeats of the same item and option", () => {
    const result = mergeRequestLines([
      { itemId: "a", quantity: 1 },
      { itemId: "a", quantity: 2 },
    ]);
    expect(result).toEqual({ ok: true, value: [{ itemId: "a", option: "", quantity: 3 }] });
  });

  test("keeps different options apart", () => {
    const result = mergeRequestLines([
      { itemId: "a", option: "red", quantity: 1 },
      { itemId: "a", option: "blue", quantity: 1 },
    ]);
    expect(result.ok && result.value.length).toBe(2);
  });

  test("an unspecified option is the empty option", () => {
    const result = mergeRequestLines([{ itemId: "a", quantity: 4 }]);
    expect(result.ok && result.value[0].option).toBe("");
  });

  test("quantities must be whole numbers from 1 up to the maximum", () => {
    for (const quantity of [0, -1, 1.5, Number.NaN]) {
      const result = mergeRequestLines([{ itemId: "a", quantity }]);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.refusal.code).toBe("bad_quantity");
    }
    expect(mergeRequestLines([{ itemId: "a", quantity: ORDER_MAX_QUANTITY }]).ok).toBe(true);
    expect(mergeRequestLines([{ itemId: "a", quantity: ORDER_MAX_QUANTITY + 1 }]).ok).toBe(false);
  });

  test("a repeat cannot take one item past the maximum", () => {
    const result = mergeRequestLines([
      { itemId: "a", quantity: 6 },
      { itemId: "a", quantity: 5 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.refusal.code).toBe("bad_quantity");
      expect(result.refusal.itemId).toBe("a");
    }
  });

  test("an item id must be given", () => {
    const result = mergeRequestLines([{ itemId: "  ", quantity: 1 }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.code).toBe("unknown_item");
  });

  test("an order holds at most the maximum number of different items", () => {
    const many = Array.from({ length: ORDER_MAX_LINES + 1 }, (_, index) => ({ itemId: `i${index}`, quantity: 1 }));
    const result = mergeRequestLines(many);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.code).toBe("too_many_lines");
    expect(mergeRequestLines(many.slice(0, ORDER_MAX_LINES)).ok).toBe(true);
  });
});

describe("checkRegion", () => {
  test("no region is fine and is stored as null", () => {
    expect(checkRegion(undefined)).toEqual({ ok: true, value: null });
    expect(checkRegion("   ")).toEqual({ ok: true, value: null });
  });

  test("a region is trimmed", () => {
    expect(checkRegion("  Germany ")).toEqual({ ok: true, value: "Germany" });
  });

  test("a region that is too long is refused", () => {
    expect(checkRegion("x".repeat(81)).ok).toBe(false);
    expect(checkRegion("x".repeat(80)).ok).toBe(true);
  });
});

describe("stock", () => {
  test("a missing stock row is not stock", () => {
    expect(hasStock(null, 1)).toBe(false);
  });

  test("zero stock cannot cover a unit", () => {
    expect(hasStock(0, 1)).toBe(false);
  });

  test("stock must cover the whole quantity", () => {
    expect(hasStock(5, 5)).toBe(true);
    expect(hasStock(5, 6)).toBe(false);
  });

  test("quantities must be positive whole numbers", () => {
    expect(hasStock(5, 0)).toBe(false);
    expect(hasStock(5, 1.5)).toBe(false);
  });

  test("limited items start at 5 and the rest at 25", () => {
    expect(stockForNewItem(true)).toBe(5);
    expect(stockForNewItem(false)).toBe(25);
  });

  test("needs are summed per item and option, in a fixed order", () => {
    const needs = stockNeeds([
      { itemId: "b", option: "", quantity: 1 },
      { itemId: "a", option: "red", quantity: 2 },
      { itemId: "a", option: "", quantity: 1 },
      { itemId: "a", option: "red", quantity: 3 },
    ]);
    expect(needs).toEqual([
      { itemId: "a", option: "", quantity: 1 },
      { itemId: "a", option: "red", quantity: 5 },
      { itemId: "b", option: "", quantity: 1 },
    ]);
  });
});

describe("priceOrder", () => {
  const ok = (result: ReturnType<typeof priceOrder>) => {
    if (!result.ok) throw new Error(`expected ok, got ${result.refusal.code}: ${result.refusal.message}`);
    return result.value;
  };
  const refusalCode = (result: ReturnType<typeof priceOrder>) => (result.ok ? null : result.refusal.code);

  test("prices each line at its level price and totals them", () => {
    const priced = ok(priceOrder({ items: [line("a", { quantity: 2 }), line("b")], approved: NONE, available: NO_REQ, requisitionTrack: null, confirmedOre: 5000 }));
    expect(priced.totalOre).toBe(3000);
    expect(priced.requisitionTrack).toBeNull();
    expect(priced.lines.map((l) => [l.itemId, l.quantity, l.unitOre, l.requisition])).toEqual([
      ["a", 2, 1000, false],
      ["b", 1, 1000, false],
    ]);
  });

  test("uses the level discount from the approved hours, not a price from the client", () => {
    const hours: TrackHours = { ...NONE, Tools: 275 };
    const expected = priceFor(item("a"), hours);
    expect(expected.percent).toBeGreaterThan(0);
    const priced = ok(priceOrder({ items: [line("a")], approved: hours, available: NO_REQ, requisitionTrack: null, confirmedOre: 5000 }));
    expect(priced.lines[0].unitOre).toBe(expected.final);
  });

  test("refuses an inactive item", () => {
    expect(refusalCode(priceOrder({ items: [line("a", { active: false })], approved: NONE, available: NO_REQ, requisitionTrack: null, confirmedOre: 5000 }))).toBe("inactive");
  });

  test("refuses an item locked by level", () => {
    const locked = line("a", { item: item("a", { need: { track: "Tools", level: 5 } }) });
    const result = priceOrder({ items: [locked], approved: NONE, available: NO_REQ, requisitionTrack: null, confirmedOre: 5000 });
    expect(refusalCode(result)).toBe("locked");
    if (!result.ok) expect(result.refusal.message).toContain("level 5");
  });

  test("an item unlocked by level is sold", () => {
    const unlocked = line("a", { item: item("a", { need: { track: "Tools", level: 5 } }) });
    const hours: TrackHours = { ...NONE, Tools: 23 };
    expect(ok(priceOrder({ items: [unlocked], approved: hours, available: NO_REQ, requisitionTrack: null, confirmedOre: 5000 })).totalOre).toBeGreaterThan(0);
  });

  test("refuses when stock is missing or too low for the quantity", () => {
    expect(refusalCode(priceOrder({ items: [line("a", { stock: null })], approved: NONE, available: NO_REQ, requisitionTrack: null, confirmedOre: 5000 }))).toBe("out_of_stock");
    expect(refusalCode(priceOrder({ items: [line("a", { stock: 1, quantity: 2 })], approved: NONE, available: NO_REQ, requisitionTrack: null, confirmedOre: 5000 }))).toBe("out_of_stock");
  });

  test("refuses when the confirmed Ore cannot cover the total", () => {
    expect(refusalCode(priceOrder({ items: [line("a")], approved: NONE, available: NO_REQ, requisitionTrack: null, confirmedOre: 999 }))).toBe("insufficient_ore");
    expect(refusalCode(priceOrder({ items: [line("a")], approved: NONE, available: NO_REQ, requisitionTrack: null, confirmedOre: 1000 }))).toBeNull();
  });

  test("refuses an order that would cost nothing", () => {
    expect(refusalCode(priceOrder({ items: [line("a", { item: item("a", { baseOre: 0 }) })], approved: NONE, available: NO_REQ, requisitionTrack: null, confirmedOre: 5000 }))).toBe("bad_total");
  });

  test("a requisition covers one unit: that unit pays the requisition price and the rest the level price", () => {
    const priced = ok(priceOrder({ items: [line("a", { quantity: 3 })], approved: NONE, available: ONE_TOOLS, requisitionTrack: "Tools", confirmedOre: 5000 }));
    expect(priced.requisitionTrack).toBe("Tools");
    expect(priced.lines.map((l) => [l.quantity, l.unitOre, l.requisition])).toEqual([
      [1, 900, true],
      [2, 1000, false],
    ]);
    expect(priced.totalOre).toBe(900 + 2000);
  });

  test("a requisition on a single unit leaves one line", () => {
    const priced = ok(priceOrder({ items: [line("a")], approved: NONE, available: ONE_TOOLS, requisitionTrack: "Tools", confirmedOre: 5000 }));
    expect(priced.lines).toHaveLength(1);
    expect(priced.totalOre).toBe(900);
  });

  test("a requisition goes to the first eligible line only", () => {
    const items = [line("a", { item: item("a", { tracks: ["Tools"] }) }), line("b", { item: item("b", { tracks: ["Tools"] }) })];
    const priced = ok(priceOrder({ items, approved: NONE, available: ONE_TOOLS, requisitionTrack: "Tools", confirmedOre: 5000 }));
    expect(priced.lines.filter((l) => l.requisition).map((l) => l.itemId)).toEqual(["a"]);
    expect(priced.lines.find((l) => l.itemId === "b")?.unitOre).toBe(1000);
  });

  test("a requisition skips lines in other tracks", () => {
    const items = [line("a", { item: item("a", { tracks: ["Systems"] }) }), line("b", { item: item("b", { tracks: ["Tools"] }) })];
    const priced = ok(priceOrder({ items, approved: NONE, available: ONE_TOOLS, requisitionTrack: "Tools", confirmedOre: 5000 }));
    expect(priced.lines.filter((l) => l.requisition).map((l) => l.itemId)).toEqual(["b"]);
  });

  test("a requisition with no item in its track is refused", () => {
    const items = [line("a", { item: item("a", { tracks: ["Systems"] }) })];
    const result = priceOrder({ items, approved: NONE, available: ONE_TOOLS, requisitionTrack: "Tools", confirmedOre: 5000 });
    expect(refusalCode(result)).toBe("requisition");
    if (!result.ok) expect(result.refusal.message).toBe("No item in this order is in Tools.");
  });

  test("a requisition is refused when none is left for the track", () => {
    const result = priceOrder({ items: [line("a")], approved: NONE, available: NO_REQ, requisitionTrack: "Tools", confirmedOre: 5000 });
    expect(refusalCode(result)).toBe("requisition");
    if (!result.ok) expect(result.refusal.message).toBe("You have no Field Requisition for this track yet.");
  });

  test("a requisition is refused on an item under the minimum price", () => {
    const result = priceOrder({ items: [line("a", { item: item("a", { baseOre: 300 }) })], approved: NONE, available: ONE_TOOLS, requisitionTrack: "Tools", confirmedOre: 5000 });
    expect(refusalCode(result)).toBe("requisition");
    if (!result.ok) expect(result.refusal.message).toContain("400");
  });

  test("a requisition is refused on a General item", () => {
    const result = priceOrder({ items: [line("a", { item: item("a", { tracks: [] }) })], approved: NONE, available: ONE_TOOLS, requisitionTrack: "Tools", confirmedOre: 5000 });
    expect(refusalCode(result)).toBe("requisition");
  });

  test("the requisition discount is capped with the level discount", () => {
    const hours: TrackHours = { ...NONE, Tools: 275 };
    const itemOne = item("a", { baseOre: 1000 });
    const level = priceFor(itemOne, hours);
    const priced = ok(priceOrder({ items: [line("a", { item: itemOne })], approved: hours, available: ONE_TOOLS, requisitionTrack: "Tools", confirmedOre: 5000 }));
    expect(priced.lines[0].unitOre).toBe(Math.round(1000 * (1 - Math.min(40, level.percent + 10) / 100)));
  });
});

describe("requisitions used by an order", () => {
  test("unknown tracks in the database are dropped", () => {
    expect(usedFromRows([{ track: "Tools" }, { track: "Gardening" }])).toEqual([{ track: "Tools" }]);
  });

  test("used requisitions come off the earned count, never below zero", () => {
    const earned: RequisitionCounts = { Tools: 1, Systems: 0, Compute: 0, Hardware: 0 };
    expect(requisitionsAvailable(earned, usedFromRows([{ track: "Tools" }, { track: "Tools" }]))).toEqual(NO_REQ);
  });

  test("isTrack accepts only the four tracks", () => {
    expect(isTrack("Compute")).toBe(true);
    expect(isTrack("General")).toBe(false);
  });
});

describe("canSave", () => {
  test("a wishlist up to the limit can grow", () => {
    expect(canSave(0, false)).toEqual({ ok: true });
    expect(canSave(WISHLIST_MAX - 1, false)).toEqual({ ok: true });
  });

  test("a full wishlist refuses a new item", () => {
    expect(canSave(WISHLIST_MAX, false).ok).toBe(false);
  });

  test("an item already saved is never refused", () => {
    expect(canSave(WISHLIST_MAX, true)).toEqual({ ok: true });
  });
});

describe("canCommit", () => {
  const base = { fulfillerId: "f1", isFulfiller: true, fulfillerBanned: false, orderPersonId: "b1", orderStatus: "placed", openCommitments: 0 };

  test("a fulfiller can take an open order", () => {
    expect(canCommit(base)).toEqual({ ok: true });
    expect(canCommit({ ...base, orderStatus: "packed" })).toEqual({ ok: true });
    expect(canCommit({ ...base, orderStatus: "shipped" })).toEqual({ ok: true });
  });

  test("only a fulfiller can take an order", () => {
    expect(canCommit({ ...base, isFulfiller: false }).ok).toBe(false);
  });

  test("a banned fulfiller cannot take an order", () => {
    expect(canCommit({ ...base, fulfillerBanned: true }).ok).toBe(false);
  });

  test("a fulfiller cannot commit their own order", () => {
    const result = canCommit({ ...base, fulfillerId: "b1", isFulfiller: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("own order");
  });

  test("delivered and cancelled orders cannot be taken", () => {
    expect(canCommit({ ...base, orderStatus: "delivered" }).ok).toBe(false);
    expect(canCommit({ ...base, orderStatus: "cancelled" }).ok).toBe(false);
  });

  test("an order with an open commitment cannot be taken again", () => {
    expect(canCommit({ ...base, openCommitments: 1 }).ok).toBe(false);
  });
});

describe("canRemoveFulfiller", () => {
  test("a fulfiller with no commitments can be removed", () => {
    expect(canRemoveFulfiller(0)).toEqual({ ok: true });
  });

  test("a fulfiller with any commitment is kept", () => {
    expect(canRemoveFulfiller(1).ok).toBe(false);
  });
});

describe("datesFromEvents", () => {
  test("records the first day each status was reached, in UTC", () => {
    const dates = datesFromEvents([
      { status: "placed", at: new Date("2026-10-02T23:30:00Z") },
      { status: "packed", at: new Date("2026-10-04T08:00:00Z") },
    ]);
    expect(dates).toEqual({ placed: "2026-10-02", packed: "2026-10-04" });
  });

  test("keeps the earliest event for a status", () => {
    const dates = datesFromEvents([
      { status: "packed", at: new Date("2026-10-05T00:00:00Z") },
      { status: "packed", at: new Date("2026-10-03T00:00:00Z") },
    ]);
    expect(dates.packed).toBe("2026-10-03");
  });

  test("ignores events that are not order statuses", () => {
    expect(datesFromEvents([{ status: "cancelled", at: new Date("2026-10-02T00:00:00Z") }])).toEqual({});
  });
});

describe("orderRowFromDb", () => {
  const base = {
    number: "LO-1101",
    status: "packed",
    totalOre: 1900,
    region: "Germany",
    createdAt: new Date("2026-11-01T10:00:00Z"),
    lines: [
      { itemId: "a", option: "", quantity: 1, unitOre: 900 },
      { itemId: "a", option: "", quantity: 1, unitOre: 1000 },
      { itemId: "b", option: "red", quantity: 2, unitOre: 500 },
    ],
    events: [
      { status: "placed", at: new Date("2026-11-01T10:00:00Z") },
      { status: "packed", at: new Date("2026-11-02T10:00:00Z") },
    ],
  };

  test("maps the number to a lower-case id and merges lines per item", () => {
    const row = orderRowFromDb(base);
    expect(row.id).toBe("lo-1101");
    expect(row.lines).toEqual([
      { itemId: "a", quantity: 2 },
      { itemId: "b", quantity: 2 },
    ]);
  });

  test("keeps the paid lines and the stored total, not a re-price", () => {
    const row = orderRowFromDb(base);
    expect(row.totalOre).toBe(1900);
    expect(row.paid).toEqual(base.lines);
    expect(row.region).toBe("Germany");
    expect(row.cancelled).toBe(false);
  });

  test("a cancelled order reads as placed and is flagged", () => {
    const row = orderRowFromDb({ ...base, status: "cancelled", events: [base.events[0]] });
    expect(row.status).toBe("placed");
    expect(row.cancelled).toBe(true);
    expect(row.dates).toEqual({ placed: "2026-11-01" });
  });

  test("an unknown stored status reads as placed", () => {
    expect(orderRowFromDb({ ...base, status: "lost" }).status).toBe("placed");
  });
});

describe("shopItemFromRow", () => {
  const row = { id: "oscilloscope", name: "Scope", kind: "Test gear", baseOre: 2000, tracks: ["Hardware", "Gardening"], blurb: "New words", limited: true };

  test("keeps the static photo, lock and credit, and takes the staff fields from the row", () => {
    const base = item("oscilloscope", { photo: "/scope.png", need: { track: "Hardware", level: 8 }, credit: { by: "A", licence: "CC", url: "u" } });
    const merged = shopItemFromRow(row, base);
    expect(merged.photo).toBe("/scope.png");
    expect(merged.need).toEqual({ track: "Hardware", level: 8 });
    expect(merged.credit?.by).toBe("A");
    expect(merged.name).toBe("Scope");
    expect(merged.baseOre).toBe(2000);
    expect(merged.blurb).toBe("New words");
    expect(merged.limited).toBe(true);
  });

  test("drops tracks that are not known", () => {
    expect(shopItemFromRow(row, null).tracks).toEqual(["Hardware"]);
  });

  test("a row with no static entry gets a sprite", () => {
    const fallback = shopItemFromRow({ ...row, id: "new-thing" }, null);
    expect(fallback.icon).toBe(true);
    expect(fallback.need).toBeUndefined();
    expect(fallback.photo.startsWith("/loadout/sprites/")).toBe(true);
  });
});
