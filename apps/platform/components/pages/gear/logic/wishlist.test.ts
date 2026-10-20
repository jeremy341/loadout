import { describe, expect, test } from "bun:test";
import { addWish, isWished, moveWish, removeWish, setWishNote, sortByClosest, toggleWish, wishlistShareText, type WishEntry } from "./wishlist";

const NOW = "2026-10-20T10:00:00.000Z";

function list(...ids: string[]): WishEntry[] {
  return ids.map((itemId) => ({ itemId, addedAt: NOW, note: "" }));
}

describe("wishlist", () => {
  test("adds an item once", () => {
    const once = addWish([], "a", NOW);
    expect(addWish(once, "a", NOW)).toHaveLength(1);
    expect(isWished(once, "a")).toBe(true);
  });

  test("toggle adds then removes", () => {
    const added = toggleWish([], "a", NOW);
    expect(added.saved).toBe(true);
    const removed = toggleWish(added.list, "a", NOW);
    expect(removed.saved).toBe(false);
    expect(removed.list).toEqual([]);
  });

  test("remove drops only that item", () => {
    expect(removeWish(list("a", "b", "c"), "b").map((e) => e.itemId)).toEqual(["a", "c"]);
  });

  test("moves an item up and down and stops at the ends", () => {
    const base = list("a", "b", "c");
    expect(moveWish(base, "b", -1).map((e) => e.itemId)).toEqual(["b", "a", "c"]);
    expect(moveWish(base, "b", 1).map((e) => e.itemId)).toEqual(["a", "c", "b"]);
    expect(moveWish(base, "a", -1).map((e) => e.itemId)).toEqual(["a", "b", "c"]);
    expect(moveWish(base, "c", 1).map((e) => e.itemId)).toEqual(["a", "b", "c"]);
    expect(moveWish(base, "zzz", 1).map((e) => e.itemId)).toEqual(["a", "b", "c"]);
  });

  test("notes are single-line and limited in length", () => {
    const next = setWishNote(list("a"), "a", `for the\nbench ${"x".repeat(300)}`);
    expect(next[0].note.includes("\n")).toBe(false);
    expect(next[0].note.length).toBe(140);
  });

  test("sorts the closest to affordable first and keeps your order for ties", () => {
    const missing: Record<string, number> = { a: 300, b: 0, c: 40, d: 0, e: 40 };
    const sorted = sortByClosest(list("a", "b", "c", "d", "e"), (entry) => missing[entry.itemId]);
    expect(sorted.map((e) => e.itemId)).toEqual(["b", "d", "c", "e", "a"]);
  });

  test("sorting does not change the original list", () => {
    const original = list("a", "b");
    sortByClosest(original, (entry) => (entry.itemId === "a" ? 10 : 0));
    expect(original.map((e) => e.itemId)).toEqual(["a", "b"]);
  });
});

describe("wishlistShareText", () => {
  test("lists names and prices, with notes in brackets", () => {
    const text = wishlistShareText([
      { name: "Raspberry Pi 5", price: 200, note: "for the robot" },
      { name: "Domain", price: 24, note: "" },
    ]);
    expect(text).toContain("1. Raspberry Pi 5 - 200 Ore (for the robot)");
    expect(text).toContain("2. Domain - 24 Ore");
    expect(text).not.toContain("balance");
  });

  test("says so when the list is empty", () => {
    expect(wishlistShareText([])).toBe("My LOADOUT wishlist is empty.");
  });
});
