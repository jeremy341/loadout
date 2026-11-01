import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  filterShopItems,
  hoursOfWork,
  lockFor,
  parseShopQuery,
  priceFor,
  requisitionPreview,
  SHOP_ITEMS,
  SHOP_TAGS,
  shopHref,
  shopItemById,
  type ShopItem,
  type ShopQuery,
  type TrackHours,
} from "./shop";

// The sample hours the Overview shows: Tools LV.6, Systems LV.3, Compute LV.0, Hardware LV.1.
const approved: TrackHours = { Tools: 58, Systems: 14, Compute: 0, Hardware: 2 };
const all: ShopQuery = { q: "", tag: null, sort: "featured", afford: false };
const item = (id: string) => shopItemById(id) as ShopItem;

describe("catalog", () => {
  test("it holds the 72 proposed items", () => {
    expect(SHOP_ITEMS).toHaveLength(72);
  });

  test("every item has a unique id, a positive price and a photo", () => {
    expect(new Set(SHOP_ITEMS.map((entry) => entry.id)).size).toBe(SHOP_ITEMS.length);
    for (const entry of SHOP_ITEMS) {
      expect(entry.baseOre).toBeGreaterThan(0);
      expect(entry.photo.startsWith("/loadout/")).toBe(true);
    }
  });

  test("the working prices match the Docs table", () => {
    expect(item("esp32-starter-kit").baseOre).toBe(30);
    expect(item("raspberry-pi-5").baseOre).toBe(500);
    expect(item("framework-16").baseOre).toBe(2985);
    expect(item("irl-ticket").baseOre).toBe(700);
  });

  test("an unknown id is not an item", () => {
    expect(shopItemById("nope")).toBeNull();
  });
});

describe("price", () => {
  test("a single-track item uses that track's level discount", () => {
    const price = priceFor(item("domain"), approved);
    expect(price.track).toBe("Tools");
    expect(price.percent).toBe(3.1);
    expect(price.final).toBe(24);
  });

  test("a multi-track item uses the best related track, never a sum", () => {
    const price = priceFor(item("raspberry-pi-5"), approved);
    expect(price.track).toBe("Systems");
    expect(price.percent).toBe(0.7);
    expect(price.final).toBe(497);
    expect(priceFor(item("framework-16"), approved).track).toBe("Tools");
  });

  test("a General item has no discount at any level", () => {
    const maxed: TrackHours = { Tools: 275, Systems: 275, Compute: 275, Hardware: 275 };
    for (const id of ["irl-ticket", "flight-grant"]) {
      const price = priceFor(item(id), maxed);
      expect(price.track).toBeNull();
      expect(price.percent).toBe(0);
      expect(price.final).toBe(price.base);
    }
  });

  test("LV.15 in a track takes 15% off its items", () => {
    const maxed: TrackHours = { Tools: 0, Systems: 0, Compute: 0, Hardware: 275 };
    expect(priceFor(item("enclosed-printer"), maxed).final).toBe(888);
  });

  test("hours of work is the price at 10 Ore an hour", () => {
    expect(hoursOfWork(497)).toBe(49.7);
    expect(hoursOfWork(25)).toBe(2.5);
  });
});

describe("requisition preview", () => {
  test("it adds 10% of the base price on a matching item of 400 Ore or more", () => {
    const entry = item("enclosed-printer");
    const preview = requisitionPreview(entry, priceFor(entry, approved));
    expect(preview.eligible).toBe(true);
    expect(preview.percent).toBe(10.1);
    expect(preview.final).toBe(939);
  });

  test("the two discounts together stop at 25%", () => {
    const entry = item("enclosed-printer");
    const maxed: TrackHours = { Tools: 0, Systems: 0, Compute: 0, Hardware: 275 };
    const preview = requisitionPreview(entry, priceFor(entry, maxed));
    expect(preview.percent).toBe(25);
    expect(preview.final).toBe(784);
  });

  test("a cheap item or a General item is not eligible", () => {
    expect(requisitionPreview(item("esp32-starter-kit"), priceFor(item("esp32-starter-kit"), approved)).eligible).toBe(false);
    expect(requisitionPreview(item("irl-ticket"), priceFor(item("irl-ticket"), approved)).eligible).toBe(false);
  });
});

describe("level lock", () => {
  const gated: ShopItem = { ...item("enclosed-printer"), need: { track: "Hardware", level: 8 } };

  test("an item with no level needed is never locked", () => {
    expect(lockFor(item("domain"), approved)).toBeNull();
  });

  test("a level still missing gives the hours to go", () => {
    expect(lockFor(gated, approved)).toEqual({ track: "Hardware", level: 8, hoursToGo: 88 });
  });

  test("the level reached unlocks it", () => {
    expect(lockFor(gated, { ...approved, Hardware: 90 })).toBeNull();
  });
});

describe("query", () => {
  test("an empty address shows everything in the featured order", () => {
    expect(parseShopQuery({})).toEqual(all);
  });

  test("tag, sort and affordable are read from the address, and unknown values are ignored", () => {
    expect(parseShopQuery({ tag: "HARDWARE", sort: "low", afford: "1" })).toEqual({ q: "", tag: "Hardware", sort: "low", afford: true });
    expect(parseShopQuery({ tag: "general" }).tag).toBe("General");
    expect(parseShopQuery({ tag: "art", sort: "cheapest", afford: "yes" })).toEqual(all);
  });

  test("the search text is trimmed and capped, and repeats use the first value", () => {
    expect(parseShopQuery({ q: "  pi  " }).q).toBe("pi");
    expect(parseShopQuery({ q: "x".repeat(500) }).q).toHaveLength(80);
    expect(parseShopQuery({ tag: ["systems", "tools"] }).tag).toBe("Systems");
  });

  test("the default view has no query, and a view keeps what is set", () => {
    expect(shopHref(all)).toBe("/dashboard/shop");
    expect(shopHref({ q: "pi", tag: "Hardware", sort: "high", afford: true })).toBe("/dashboard/shop?q=pi&tag=hardware&sort=high&afford=1");
  });
});

describe("filter and sort", () => {
  const ids = (query: ShopQuery, ore = 0) => filterShopItems(SHOP_ITEMS, query, approved, ore).map((entry) => entry.id);

  test("a track tag shows every item that relates to it, including multi-track items", () => {
    expect(ids({ ...all, tag: "Systems" })).toEqual(["security-key", "vps-year", "hosting-grant", "cloud-db-credits", "network-switch", "nas", "mac-mini", "samsung-t7-ssd", "raspberry-pi-5", "pi-zero-2-w", "pc-upgrade-grant", "framework-12", "framework-16", "laptop-grant", "lora-node", "macbook-air"]);
    expect(ids({ ...all, tag: "Compute" })).toEqual(["api-credits", "mac-mini", "samsung-t7-ssd", "gpu-cloud-credits", "cpu-cloud-credits", "pc-upgrade-grant", "fpga-starter-board", "jetson-nano", "rx-9060", "framework-12", "framework-16", "laptop-grant", "macbook-air"]);
  });

  test("General shows only the items with no track", () => {
    expect(ids({ ...all, tag: "General" })).toEqual(["irl-ticket", "flight-grant", "conference-grant", "book-grant", "screwdriver-set", "cable-kit", "retro-handheld", "ipad", "meta-quest-3", "airpods", "kindle", "blahaj"]);
  });

  test("the tags cover every item", () => {
    const seen = new Set(SHOP_TAGS.flatMap((tag) => ids({ ...all, tag })));
    expect(seen.size).toBe(SHOP_ITEMS.length);
  });

  test("search matches the name, kind and description, ignoring case", () => {
    expect(ids({ ...all, q: "PI" })).toContain("raspberry-pi-5");
    expect(ids({ ...all, q: "fabrication" })).toEqual(["pcb-grant", "filament", "ender-3-v3", "bambu-a1-mini", "enclosed-printer"]);
    expect(ids({ ...all, q: "zzz" })).toEqual([]);
  });

  test("affordable keeps only what the balance covers", () => {
    expect(ids({ ...all, afford: true }, 0)).toEqual([]);
    expect(ids({ ...all, afford: true }, 30)).toEqual(["flight-grant", "domain", "api-credits", "hosting-grant", "pico-w", "esp32-starter-kit", "debug-probe", "pcb-grant"]);
  });

  test("price sorts use the price after the discount", () => {
    const low = ids({ ...all, sort: "low" });
    expect(low[0]).toBe("pico-w");
    expect(low.at(-1)).toBe("framework-16");
    expect(ids({ ...all, sort: "high" })[0]).toBe("framework-16");
  });
});

describe("the proposed catalog", () => {
  test("General items have no track and everything else names at least one", () => {
    const general = SHOP_ITEMS.filter((entry) => entry.tracks.length === 0).map((entry) => entry.id);
    expect(general).toEqual(["irl-ticket", "flight-grant", "conference-grant", "book-grant", "screwdriver-set", "cable-kit", "retro-handheld", "ipad", "meta-quest-3", "airpods", "kindle", "blahaj"]);
  });

  test("the graphics card and the oscilloscope are the gated items, each locked until LV.8 in its track", () => {
    const gated = SHOP_ITEMS.filter((entry) => entry.need);
    expect(gated.map((entry) => entry.id)).toEqual(["rx-9060", "oscilloscope"]);
    expect(lockFor(gated[0], approved)).toEqual({ track: "Compute", level: 8, hoursToGo: 90 });
    expect(lockFor(gated[1], approved)).toEqual({ track: "Hardware", level: 8, hoursToGo: 88 });
  });

  test("items at 400 Ore or more with a track can use a Requisition, the rest cannot", () => {
    const eligible = SHOP_ITEMS.filter((entry) => requisitionPreview(entry, priceFor(entry, approved)).eligible).map((entry) => entry.id);
    expect(eligible).toContain("flipper-zero");
    expect(eligible).not.toContain("irl-ticket");
    for (const entry of SHOP_ITEMS.filter((candidate) => candidate.baseOre < 400)) {
      expect(eligible).not.toContain(entry.id);
    }
  });
});

describe("catalog photos", () => {
  test("every photo file exists in the public folder", () => {
    for (const entry of SHOP_ITEMS) {
      expect(existsSync(join(process.cwd(), "public", entry.photo))).toBe(true);
    }
  });

  test("exactly the photos taken from Wikimedia Commons carry a credit, and each credit is complete", () => {
    const credited = SHOP_ITEMS.filter((entry) => entry.credit).map((entry) => entry.id);
    expect(new Set(credited)).toEqual(
      new Set([
        "pico-w", "fpga-starter-board", "logic-analyzer", "security-key", "pi-zero-2-w", "breadboard-kit", "rtl-sdr", "oscilloscope", "filament",
        "robotics-kit", "multimeter", "usb-microscope", "pinecil", "usb-c-dock", "jetson-nano", "calipers", "hot-air-station", "fume-extractor",
        "sensor-kit", "network-switch", "nas", "cable-kit",
      ]),
    );
    for (const entry of SHOP_ITEMS) {
      if (!entry.credit) continue;
      expect(entry.credit.url.startsWith("https://commons.wikimedia.org/wiki/File:")).toBe(true);
      expect(entry.credit.by.length).toBeGreaterThan(0);
      expect(entry.credit.licence.length).toBeGreaterThan(0);
    }
  });

  test("a General item is never a gated one", () => {
    for (const entry of SHOP_ITEMS.filter((candidate) => candidate.tracks.length === 0)) {
      expect(entry.need).toBeUndefined();
    }
  });
});
