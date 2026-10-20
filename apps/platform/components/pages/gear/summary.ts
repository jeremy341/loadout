"use client";

import { SEED_ORE_LEDGER, ORE_LEDGER_KEY, type OreEntry } from "../../../lib/ore-ledger";
import { usePreviewState } from "../../../lib/preview-store";
import { COLLECTIBLES, findShopItem } from "./data";
import { GEAR_KEYS, NO_EARNED, NO_ORDERS, NO_REFERRALS, NO_WISHES, useGearProfile } from "./gear-store";
import type { EarnedMap } from "./logic/collectibles";
import { ledgerTotals, recentEntries } from "./logic/ledger";
import { isOpen, type Order } from "./logic/orders";
import { canAfford, priceItem } from "./logic/pricing";
import { qualifiedCount, type Referral } from "./logic/referrals";
import type { WishEntry } from "./logic/wishlist";

// What the Hub (Overview, Profile) reads from the Gear tabs. Every figure is derived from the same stored state
// the pages use, so it can never disagree with them. All of it is sample data saved in this browser.

export interface GearSummary {
  oreBalance: number;
  oreEarned: number;
  oreSpent: number;
  wishlistCount: number;
  wishlistAffordable: number;
  ordersTotal: number;
  ordersOpen: number;
  collectiblesOwned: number;
  collectiblesTotal: number;
  referralsTotal: number;
  referralsQualified: number;
  recentLedger: { amount: number; reason: string; at: string }[];
}

export function useGearSummary(): GearSummary {
  const [ledger] = usePreviewState<OreEntry[]>(ORE_LEDGER_KEY, SEED_ORE_LEDGER);
  const [wishlist] = usePreviewState<WishEntry[]>(GEAR_KEYS.wishlist, NO_WISHES);
  const [orders] = usePreviewState<Order[]>(GEAR_KEYS.orders, NO_ORDERS);
  const [referrals] = usePreviewState<Referral[]>(GEAR_KEYS.referrals, NO_REFERRALS);
  const [earned] = usePreviewState<EarnedMap>(GEAR_KEYS.collectibles, NO_EARNED);
  const { levels } = useGearProfile();

  const totals = ledgerTotals(ledger);
  const wishlistAffordable = wishlist.filter((entry) => {
    const item = findShopItem(entry.itemId);
    return item ? canAfford(totals.balance, priceItem(item, levels).final) : false;
  }).length;

  return {
    oreBalance: totals.balance,
    oreEarned: totals.earned,
    oreSpent: totals.spent,
    wishlistCount: wishlist.length,
    wishlistAffordable,
    ordersTotal: orders.length,
    ordersOpen: orders.filter(isOpen).length,
    collectiblesOwned: COLLECTIBLES.filter((c) => earned[c.id]).length,
    collectiblesTotal: COLLECTIBLES.length,
    referralsTotal: referrals.length,
    referralsQualified: qualifiedCount(referrals),
    recentLedger: recentEntries(ledger, 5).map(({ amount, reason, at }) => ({ amount, reason, at })),
  };
}
