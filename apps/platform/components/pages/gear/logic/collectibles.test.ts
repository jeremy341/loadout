import { describe, expect, test } from "bun:test";
import { COLLECTIBLES, MAX_PINS, findCollectible, type GearStats } from "../data";
import { EMPTY_STATS, applyEarned, claimManual, cleanPins, isSatisfied, newlyEarned, progressFor, togglePin } from "./collectibles";

const NOW = "2026-10-20T10:00:00.000Z";
const stats = (overrides: Partial<GearStats> = {}): GearStats => ({ ...EMPTY_STATS, ...overrides });

describe("catalog", () => {
  test("ids are unique and every checkable condition names a real stat", () => {
    expect(new Set(COLLECTIBLES.map((c) => c.id)).size).toBe(COLLECTIBLES.length);
    for (const collectible of COLLECTIBLES) {
      if (collectible.condition.type === "stat") expect(collectible.condition.stat in EMPTY_STATS).toBe(true);
    }
  });

  test("has checkable and manual collectibles across the four rarities", () => {
    expect(COLLECTIBLES.some((c) => c.condition.type === "manual")).toBe(true);
    expect(new Set(COLLECTIBLES.map((c) => c.rarity))).toEqual(new Set(["common", "uncommon", "rare", "epic"]));
  });
});

describe("earning", () => {
  test("nothing is earned from an empty history", () => {
    expect(newlyEarned(COLLECTIBLES, stats(), {})).toEqual([]);
  });

  test("a placed order earns First Redemption", () => {
    expect(newlyEarned(COLLECTIBLES, stats({ ordersPlaced: 1 }), {}).map((c) => c.id)).toEqual(["first-order"]);
  });

  test("already earned collectibles are not offered again", () => {
    const earned = applyEarned({}, ["first-order"], NOW);
    expect(newlyEarned(COLLECTIBLES, stats({ ordersPlaced: 5 }), earned)).toEqual([]);
  });

  test("manual collectibles are never earned from stats", () => {
    const everything = stats({ ordersPlaced: 99, ordersDelivered: 99, wishlistCount: 99, oreSpent: 9999, requisitionsUsed: 9, customRequests: 9, scenariosSaved: 9, referralsInvited: 9, referralsQualified: 9, maxLevel: 15 });
    const ids = newlyEarned(COLLECTIBLES, everything, {}).map((c) => c.id);
    expect(ids).not.toContain("first-ship");
    expect(ids).not.toContain("great-signal");
    expect(ids).toContain("mastery");
  });

  test("an earned collectible is kept even if the numbers fall later", () => {
    const earned = applyEarned({}, ["ore-spender"], NOW);
    expect(earned["ore-spender"]).toBe(NOW);
    expect(newlyEarned(COLLECTIBLES, stats({ oreSpent: 0 }), earned)).toEqual([]);
    expect(applyEarned(earned, ["ore-spender"], "2030-01-01T00:00:00.000Z")["ore-spender"]).toBe(NOW);
  });

  test("isSatisfied and progress", () => {
    const spender = findCollectible("ore-spender")!;
    expect(isSatisfied(spender, stats({ oreSpent: 199 }))).toBe(false);
    expect(isSatisfied(spender, stats({ oreSpent: 200 }))).toBe(true);
    expect(progressFor(spender, stats({ oreSpent: 80 }))).toEqual({ have: 80, need: 200, label: "Spend 200 Ore" });
    expect(progressFor(spender, stats({ oreSpent: 900 }))?.have).toBe(200);
    expect(progressFor(findCollectible("first-ship")!, stats())).toBeNull();
  });
});

describe("manual claim", () => {
  test("claims a manual collectible once", () => {
    const manual = findCollectible("first-ship")!;
    const first = claimManual(manual, {}, NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.earned["first-ship"]).toBe(NOW);
    expect(claimManual(manual, first.earned, NOW).ok).toBe(false);
  });

  test("a checkable collectible cannot be claimed by hand", () => {
    expect(claimManual(findCollectible("first-order")!, {}, NOW).ok).toBe(false);
  });
});

describe("pins", () => {
  const earned = applyEarned({}, ["first-order", "wish-maker", "estimator", "recruiter"], NOW);

  test("pins and unpins an owned collectible", () => {
    const pinned = togglePin([], "first-order", earned);
    expect(pinned).toEqual({ ok: true, pins: ["first-order"], pinned: true });
    expect(togglePin(["first-order"], "first-order", earned)).toEqual({ ok: true, pins: [], pinned: false });
  });

  test("cannot pin something you do not own", () => {
    expect(togglePin([], "mastery", earned).ok).toBe(false);
  });

  test("allows at most three pins", () => {
    let pins: string[] = [];
    for (const id of ["first-order", "wish-maker", "estimator"]) {
      const result = togglePin(pins, id, earned);
      if (result.ok) pins = result.pins;
    }
    expect(pins).toHaveLength(MAX_PINS);
    const fourth = togglePin(pins, "recruiter", earned);
    expect(fourth.ok).toBe(false);
    expect(togglePin(pins, "estimator", earned).ok).toBe(true);
  });

  test("cleanPins drops unknown and unowned pins", () => {
    expect(cleanPins(["first-order", "nope", "mastery"], earned, COLLECTIBLES)).toEqual(["first-order"]);
  });
});
