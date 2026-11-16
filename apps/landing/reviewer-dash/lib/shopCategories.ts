import { SHOP_ITEMS } from "@/lib/platform/shop";

// LOADOUT groups its shop by the item kinds in lib/platform/shop.ts (Boards, Bench and lab, Cloud, ...), not by Pixl's seven
// categories. The id is the kind in lower case with dashes; "other" is for an item an owner adds that fits none of them.
const slug = (kind: string): string => kind.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const KINDS: string[] = [...new Set(SHOP_ITEMS.map((item) => item.kind))].sort((a, b) => a.localeCompare(b));

export const SHOP_CATEGORIES: readonly string[] = [...KINDS.map(slug), "other"];
export type ShopCategory = string;
export const SHOP_CATEGORY_LABELS: Record<string, string> = {
  ...Object.fromEntries(KINDS.map((kind) => [slug(kind), kind])),
  other: "Other",
};
export const shopCategoryOf = (kind: string): ShopCategory => (SHOP_CATEGORIES.includes(slug(kind)) ? slug(kind) : "other");
