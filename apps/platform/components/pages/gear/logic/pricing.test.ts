import { describe, expect, test } from "bun:test";
import { DRAFT_RULES, SHOP_ITEMS, findShopItem, type Levels } from "../data";
import {
  bestRelatedDiscount,
  canAfford,
  checkTicket,
  fieldTicketsFor,
  meetsRequirement,
  normalizeLevels,
  priceItem,
  priceOrder,
  progressPercent,
  shortfall,
  trackDiscountPercent,
  type FieldTicket,
  type GeneralTicket,
  type PriceableItem,
} from "./pricing";

const flat = (level: number): Levels => ({ Tools: level, Systems: level, Compute: level, Hardware: level });
const none = flat(0);

function item(partial: Partial<PriceableItem> & { basePrice: number }): PriceableItem {
  return { id: "x", name: "Test item", tracks: ["Hardware"], requisitionEligible: true, ...partial };
}

const hardwareTicket: FieldTicket = { id: "field:Hardware:3", kind: "field", track: "Hardware", level: 3 };

describe("trackDiscountPercent", () => {
  test("matches the proposal's table for levels 1 to 15", () => {
    const table = [0, 1, 2, 3, 4, 6, 7, 9, 10, 12, 13, 15, 17, 18, 20];
    expect(table.map((_, index) => trackDiscountPercent(index + 1))).toEqual(table);
  });

  test("level 0 and level 1 give nothing, level 15 is exactly 20%", () => {
    expect(trackDiscountPercent(0)).toBe(0);
    expect(trackDiscountPercent(1)).toBe(0);
    expect(trackDiscountPercent(15)).toBe(20);
  });

  test("never exceeds 20% and clamps bad input", () => {
    expect(trackDiscountPercent(99)).toBe(20);
    expect(trackDiscountPercent(-4)).toBe(0);
    expect(trackDiscountPercent(Number.NaN)).toBe(0);
  });
});

describe("bestRelatedDiscount", () => {
  test("uses the best related track, never the sum", () => {
    const levels: Levels = { Tools: 1, Systems: 4, Compute: 10, Hardware: 1 };
    const best = bestRelatedDiscount(["Systems", "Compute"], levels);
    expect(best).toEqual({ percent: 12, track: "Compute" });
  });

  test("an item with no related track gets no discount", () => {
    expect(bestRelatedDiscount([], flat(15))).toEqual({ percent: 0, track: null });
  });

  test("progress in an unrelated track does not help", () => {
    expect(bestRelatedDiscount(["Hardware"], { Tools: 15, Systems: 15, Compute: 15, Hardware: 1 }).percent).toBe(0);
  });
});

describe("priceItem", () => {
  test("the proposal's SSD example: Compute 10 and Systems 4 on a 160 Ore SSD gives 141 Ore", () => {
    const ssd = findShopItem("t7-ssd")!;
    const levels: Levels = { Tools: 1, Systems: 4, Compute: 10, Hardware: 1 };
    const price = priceItem(ssd, levels);
    expect(price.permanentPercent).toBe(12);
    expect(price.permanentSaving).toBe(19);
    expect(price.final).toBe(141);
  });

  test("a 1,000 Ore item at level 15 with one Field Requisition costs 600 Ore", () => {
    const price = priceItem(item({ basePrice: 1000 }), flat(15), { id: "field:Hardware:15", kind: "field", track: "Hardware", level: 15 });
    expect(price.permanentSaving).toBe(200);
    expect(price.ticket?.saving).toBe(200);
    expect(price.final).toBe(600);
    expect(price.combinedPercent).toBe(40);
  });

  test("a bigger item scales the same way", () => {
    const price = priceItem(item({ basePrice: 1800 }), flat(15), hardwareTicket);
    expect(price.final).toBe(1080);
  });

  test("no Requisition on an item under 400 Ore", () => {
    const price = priceItem(item({ basePrice: 399 }), flat(0), hardwareTicket);
    expect(price.ticket).toBeNull();
    expect(price.ticketRejected).toContain("400");
    expect(price.final).toBe(399);
  });

  test("a Field Requisition needs a matching track", () => {
    const price = priceItem(item({ basePrice: 800, tracks: ["Systems"] }), none, hardwareTicket);
    expect(price.ticket).toBeNull();
    expect(price.ticketRejected).toContain("Hardware");
  });

  test("an ineligible item rejects every ticket", () => {
    const price = priceItem(item({ basePrice: 800, requisitionEligible: false }), none, hardwareTicket);
    expect(price.ticketRejected).toContain("does not accept");
  });

  test("savings are rounded to the nearest whole Ore", () => {
    const price = priceItem(item({ basePrice: 405 }), flat(8), hardwareTicket);
    expect(price.permanentSaving).toBe(Math.round(405 * 0.09));
    expect(price.ticket?.saving).toBe(81);
    expect(Number.isInteger(price.final)).toBe(true);
  });

  test("the combined saving never passes 40% of the base price", () => {
    for (const base of [400, 401, 777, 1999, 5000]) {
      for (let level = 0; level <= 15; level += 1) {
        const price = priceItem(item({ basePrice: base }), flat(level), hardwareTicket);
        expect(price.totalSaving).toBeLessThanOrEqual(Math.round(base * 0.4));
      }
    }
  });

  test("General Requisition I saves 10% up to 300 Ore on items of 1,000 Ore or more", () => {
    const general: GeneralTicket = { id: "general:I:1", kind: "general", tier: "I" };
    expect(priceItem(item({ basePrice: 2000, tracks: [] }), none, general).ticket?.saving).toBe(200);
    expect(priceItem(item({ basePrice: 5000, tracks: [] }), none, general).ticket?.saving).toBe(300);
    expect(priceItem(item({ basePrice: 999, tracks: [] }), none, general).ticketRejected).toContain("1,000");
  });

  test("General Requisitions apply after the permanent discount and stay inside the 40% ceiling", () => {
    const master: GeneralTicket = { id: "general:Master:1", kind: "general", tier: "Master" };
    const price = priceItem(item({ basePrice: 4000, tracks: ["Compute"] }), flat(15), master);
    expect(price.permanentSaving).toBe(800);
    expect(price.ticket?.saving).toBe(600);
    expect(price.final).toBe(2600);
    expect(price.totalSaving).toBeLessThanOrEqual(1600);
  });

  test("a General Requisition works on any field, including an unrelated one", () => {
    const ii: GeneralTicket = { id: "general:II:1", kind: "general", tier: "II" };
    expect(checkTicket(ii, item({ basePrice: 2500, tracks: ["Tools"] })).ok).toBe(true);
  });

  test("merch has no track discount", () => {
    const sticker = findShopItem("sticker-pack")!;
    expect(priceItem(sticker, flat(15)).final).toBe(sticker.basePrice);
  });
});

describe("priceOrder", () => {
  test("the permanent discount applies to each unit, one Requisition to one unit", () => {
    const sample = item({ basePrice: 500 });
    const order = priceOrder(sample, 3, flat(15), hardwareTicket);
    // 500 - 100 = 400 per unit, 3 units = 1,200, one ticket saves 100 more.
    expect(order.unitFinal).toBe(400);
    expect(order.total).toBe(1100);
    expect(order.saved).toBe(400);
  });

  test("quantity is never below 1", () => {
    expect(priceOrder(item({ basePrice: 100 }), 0, none, null).quantity).toBe(1);
  });
});

describe("requirements and tickets", () => {
  test("a level requirement uses the best of its tracks and reports levels remaining", () => {
    const fpga = findShopItem("fpga-board")!;
    expect(meetsRequirement(fpga.requires, { Tools: 1, Systems: 1, Compute: 3, Hardware: 4 })).toEqual({ ok: false, levelsRemaining: 1 });
    expect(meetsRequirement(fpga.requires, { Tools: 1, Systems: 1, Compute: 5, Hardware: 1 }).ok).toBe(true);
    expect(meetsRequirement(undefined, none).ok).toBe(true);
  });

  test("Field Requisitions arrive at levels 3, 6, 9, 12 and 15 in each track", () => {
    expect(fieldTicketsFor({ Tools: 2, Systems: 3, Compute: 0, Hardware: 15 }).map((t) => t.id)).toEqual([
      "field:Systems:3",
      "field:Hardware:3",
      "field:Hardware:6",
      "field:Hardware:9",
      "field:Hardware:12",
      "field:Hardware:15",
    ]);
  });

  test("normalizeLevels fills defaults and clamps", () => {
    expect(normalizeLevels(undefined)).toEqual(DRAFT_RULES.defaultLevels);
    expect(normalizeLevels({ Tools: 99, Hardware: -3, Systems: "x" })).toEqual({ ...DRAFT_RULES.defaultLevels, Tools: 15, Hardware: 0 });
  });
});

describe("affordability", () => {
  test("canAfford, shortfall and progress", () => {
    expect(canAfford(100, 100)).toBe(true);
    expect(canAfford(99, 100)).toBe(false);
    expect(shortfall(40, 100)).toBe(60);
    expect(shortfall(400, 100)).toBe(0);
    expect(progressPercent(50, 200)).toBe(25);
    expect(progressPercent(500, 200)).toBe(100);
    expect(progressPercent(-5, 200)).toBe(0);
  });
});

describe("sample catalog", () => {
  test("has about sixteen sample items with unique ids and whole-Ore prices", () => {
    expect(SHOP_ITEMS.length).toBeGreaterThanOrEqual(16);
    expect(new Set(SHOP_ITEMS.map((i) => i.id)).size).toBe(SHOP_ITEMS.length);
    for (const entry of SHOP_ITEMS) expect(Number.isInteger(entry.basePrice) && entry.basePrice > 0).toBe(true);
  });

  test("the plan's working-example prices are kept", () => {
    const expected: Record<string, number> = {
      "esp32-kit": 50,
      "solder-kit": 60,
      "rpi-5": 200,
      "t7-ssd": 160,
      domain: 24,
      "a1-mini": 500,
      "enclosed-printer": 1000,
      "framework-16": 5000,
    };
    for (const [id, price] of Object.entries(expected)) {
      expect(findShopItem(id)?.basePrice).toBe(price);
      expect(findShopItem(id)?.priceSource).toBe("plan");
    }
  });

  test("the enclosed printer and Framework 16 carry no level requirement", () => {
    expect(findShopItem("enclosed-printer")?.requires).toBeUndefined();
    expect(findShopItem("framework-16")?.requires).toBeUndefined();
  });
});
