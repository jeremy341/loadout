import type { ComponentType } from "react";
import { CollectiblesPage } from "./collectibles-page";
import { OrdersPage } from "./orders-page";
import { OreCalculatorPage } from "./ore-calculator-page";
import { ReferralsPage } from "./referrals-page";
import { ShopPage } from "./shop-page";
import { WishlistPage } from "./wishlist-page";

// Slug -> page component for the Gear group. Each is a client component that renders its own <PageHeader>.
// Hub reads this group's numbers through useGearSummary in ./summary.
export const gearPages: Record<string, ComponentType> = {
  shop: ShopPage,
  wishlist: WishlistPage,
  orders: OrdersPage,
  collectibles: CollectiblesPage,
  referrals: ReferralsPage,
  "ore-calculator": OreCalculatorPage,
};
