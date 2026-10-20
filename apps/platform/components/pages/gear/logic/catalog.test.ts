import { describe, expect, test } from "bun:test";
import { SHOP_ITEMS, type Levels } from "../data";
import { DEFAULT_QUERY, filterCatalog, rangeError, type CatalogQuery } from "./catalog";

const levels: Levels = { Tools: 1, Systems: 1, Compute: 1, Hardware: 1 };
const wished = new Set<string>();

function run(overrides: Partial<CatalogQuery> = {}, balance = 1000, lv: Levels = levels, saved: Set<string> = wished) {
  return filterCatalog(SHOP_ITEMS, { ...DEFAULT_QUERY, ...overrides }, { balance, levels: lv, wished: saved }).map((item) => item.id);
}

describe("filterCatalog", () => {
  test("no filters returns everything in catalog order", () => {
    expect(run()).toEqual(SHOP_ITEMS.map((item) => item.id));
  });

  test("searches names and descriptions, all words must match", () => {
    expect(run({ text: "raspberry" })).toEqual(["rpi-5"]);
    expect(run({ text: "  SSD " })).toContain("t7-ssd");
    expect(run({ text: "printer enclosed" })).toEqual(["enclosed-printer"]);
    expect(run({ text: "zzzz" })).toEqual([]);
  });

  test("filters by category", () => {
    expect(run({ category: "merch" })).toEqual(["sticker-pack", "hoodie"]);
  });

  test("filters by price range on the final price", () => {
    const ids = run({ min: "100", max: "200" });
    expect(ids).toEqual(expect.arrayContaining(["rpi-5", "t7-ssd", "logic-analyzer", "hoodie"]));
    expect(ids).not.toContain("domain");
    expect(ids).not.toContain("a1-mini");
  });

  test("the range uses the discounted price", () => {
    const high: Levels = { ...levels, Hardware: 15 };
    expect(run({ min: "150", max: "170" }, 1000, high)).toContain("rpi-5");
    expect(run({ min: "150", max: "170" }, 1000, levels)).not.toContain("rpi-5");
  });

  test("an invalid range is ignored instead of hiding everything", () => {
    expect(rangeError({ min: "abc", max: "" })).not.toBeNull();
    expect(rangeError({ min: "500", max: "100" })).not.toBeNull();
    expect(rangeError({ min: "", max: "" })).toBeNull();
    expect(run({ min: "abc" })).toHaveLength(SHOP_ITEMS.length);
  });

  test("can-afford keeps only items you can pay for and unlock", () => {
    const ids = run({ affordableOnly: true }, 100);
    expect(ids).toEqual(expect.arrayContaining(["esp32-kit", "solder-kit", "domain", "vps-credit", "sticker-pack"]));
    expect(ids).not.toContain("rpi-5");
  });

  test("a locked item is not affordable even with enough Ore", () => {
    expect(run({ affordableOnly: true }, 100000)).not.toContain("gpu-grant");
    expect(run({ affordableOnly: true }, 100000, { ...levels, Compute: 9 })).toContain("gpu-grant");
  });

  test("saved only", () => {
    expect(run({ wishedOnly: true }, 1000, levels, new Set(["domain", "hoodie"]))).toEqual(["domain", "hoodie"]);
  });

  test("sorts by price and name", () => {
    const asc = run({ sort: "price-asc" });
    expect(asc[0]).toBe("sticker-pack");
    expect(asc[asc.length - 1]).toBe("gpu-grant");
    const desc = run({ sort: "price-desc" });
    expect(desc[0]).toBe("gpu-grant");
    const names = run({ sort: "name" }).map((id) => SHOP_ITEMS.find((item) => item.id === id)!.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
