import { DRAFT_RULES } from "../data";

// The personal wishlist (plans/02 section 26 "Shop Wishlist"). It is a list of items the builder is working
// toward. It does not reserve stock, lock the price or guarantee availability. There is no separate suggestion or
// voting system.

export interface WishEntry {
  itemId: string;
  addedAt: string;
  note: string;
}

export function isWished(list: readonly WishEntry[], itemId: string): boolean {
  return list.some((entry) => entry.itemId === itemId);
}

export function addWish(list: readonly WishEntry[], itemId: string, now: string): WishEntry[] {
  if (isWished(list, itemId)) return [...list];
  return [...list, { itemId, addedAt: now, note: "" }];
}

export function removeWish(list: readonly WishEntry[], itemId: string): WishEntry[] {
  return list.filter((entry) => entry.itemId !== itemId);
}

export function toggleWish(list: readonly WishEntry[], itemId: string, now: string): { list: WishEntry[]; saved: boolean } {
  if (isWished(list, itemId)) return { list: removeWish(list, itemId), saved: false };
  return { list: addWish(list, itemId, now), saved: true };
}

/** Moves an entry one place up (-1) or down (1). Moving past either end changes nothing. */
export function moveWish(list: readonly WishEntry[], itemId: string, direction: -1 | 1): WishEntry[] {
  const index = list.findIndex((entry) => entry.itemId === itemId);
  const target = index + direction;
  const out = [...list];
  if (index < 0 || target < 0 || target >= out.length) return out;
  [out[index], out[target]] = [out[target], out[index]];
  return out;
}

export function setWishNote(list: readonly WishEntry[], itemId: string, note: string): WishEntry[] {
  const clean = note.replace(/[\r\n]+/g, " ").slice(0, DRAFT_RULES.maxNote);
  return list.map((entry) => (entry.itemId === itemId ? { ...entry, note: clean } : entry));
}

/**
 * Orders entries by how few Ore are still missing (the closest to affordable first). Entries that are already
 * affordable come first and keep the builder's own order among themselves, as do ties.
 */
export function sortByClosest<T extends WishEntry>(list: readonly T[], missingFor: (entry: T) => number): T[] {
  return list
    .map((entry, index) => ({ entry, index, missing: Math.max(0, missingFor(entry)) }))
    .sort((a, b) => a.missing - b.missing || a.index - b.index)
    .map((row) => row.entry);
}

export interface ShareRow {
  name: string;
  price: number;
  note: string;
}

/** A plain-text list for pasting into a message. It lists items and Ore prices only, never a balance. */
export function wishlistShareText(rows: readonly ShareRow[]): string {
  if (rows.length === 0) return "My LOADOUT wishlist is empty.";
  const lines = ["My LOADOUT wishlist (preview, sample items):"];
  rows.forEach((row, index) => {
    const note = row.note.trim();
    lines.push(`${index + 1}. ${row.name} - ${row.price.toLocaleString("en-GB")} Ore${note ? ` (${note})` : ""}`);
  });
  lines.push("Prices are before any Requisition. Availability is confirmed once ordering opens.");
  return lines.join("\n");
}
