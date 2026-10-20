import { CATEGORY_LABELS, type Levels, type ShopCategory, type ShopItem } from "../data";
import { canAfford, meetsRequirement, priceItem } from "./pricing";

// Search, filter and sort for the sample catalog. Prices compared here are the price after the permanent track
// discount, because that is what the participant pays before choosing a Requisition.

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
  name: "Name, A to Z",
};

export interface CatalogQuery {
  text: string;
  category: ShopCategory | "all";
  /** Lowest and highest final price, as typed. Empty means no limit. */
  min: string;
  max: string;
  affordableOnly: boolean;
  wishedOnly: boolean;
  sort: SortKey;
}

export const DEFAULT_QUERY: CatalogQuery = {
  text: "",
  category: "all",
  min: "",
  max: "",
  affordableOnly: false,
  wishedOnly: false,
  sort: "featured",
};

function parseBound(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** An error message for the price range, or null when it is usable. */
export function rangeError(query: Pick<CatalogQuery, "min" | "max">): string | null {
  const min = query.min.trim() ? parseBound(query.min) : 0;
  const max = query.max.trim() ? parseBound(query.max) : 0;
  if (min === null || max === null) return "Enter whole numbers of Ore, 0 or more.";
  if (query.min.trim() && query.max.trim() && (min as number) > (max as number)) return "The lowest price is above the highest price.";
  return null;
}

export function finalPriceOf(item: ShopItem, levels: Levels): number {
  return priceItem(item, levels).final;
}

export function filterCatalog(
  items: readonly ShopItem[],
  query: CatalogQuery,
  context: { balance: number; levels: Levels; wished: ReadonlySet<string> },
): ShopItem[] {
  const text = query.text.trim().toLowerCase();
  const min = parseBound(query.min);
  const max = parseBound(query.max);
  const rangeOk = rangeError(query) === null;

  const matches = items.filter((item) => {
    if (text) {
      const haystack = `${item.name} ${item.blurb} ${item.description} ${CATEGORY_LABELS[item.category]} ${item.tracks.join(" ")}`.toLowerCase();
      if (!text.split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    if (query.category !== "all" && item.category !== query.category) return false;
    const price = finalPriceOf(item, context.levels);
    if (rangeOk && min !== null && price < min) return false;
    if (rangeOk && max !== null && price > max) return false;
    if (query.affordableOnly && !(canAfford(context.balance, price) && meetsRequirement(item.requires, context.levels).ok)) return false;
    if (query.wishedOnly && !context.wished.has(item.id)) return false;
    return true;
  });

  const indexOf = new Map(items.map((item, index) => [item.id, index]));
  const price = (item: ShopItem) => finalPriceOf(item, context.levels);
  const sorted = [...matches];
  if (query.sort === "price-asc") sorted.sort((a, b) => price(a) - price(b) || (indexOf.get(a.id) ?? 0) - (indexOf.get(b.id) ?? 0));
  else if (query.sort === "price-desc") sorted.sort((a, b) => price(b) - price(a) || (indexOf.get(a.id) ?? 0) - (indexOf.get(b.id) ?? 0));
  else if (query.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}
