// LOADOUT has no regional shop prices: an Ore price is the same everywhere (plans/02 section 26). Availability and delivery can
// vary by region, but that is not a price and is not edited here. The row shape keeps one fixed value so the sample data and the
// copied types still line up; no page shows or edits it.
export const SHOP_REGIONS = ["ALL"] as const;
export type ShopRegion = (typeof SHOP_REGIONS)[number];
export const SHOP_REGION_LABELS: Record<ShopRegion, string> = { ALL: "Everywhere" };
