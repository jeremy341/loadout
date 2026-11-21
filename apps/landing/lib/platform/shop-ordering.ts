// The switch for real ordering, and what the Orders pages read for the signed-in person. Server only (uses the database).
//   shopOrderingOn()          the FeatureFlag row "shop-ordering"; no row, or a failed read, is off
//   ordersForViewer(id)       the person's real orders; none and NODE_ENV=development shows the fixture orders so local screens are not empty
//   orderForViewer(id, slug)  one order by its lower-case number, with the same development fallback
//   savedForViewer(id)        the person's saved catalog ids, with the same fallback for the wishlist
// Production never shows fixtures. Ordering stays closed until the owner switches the flag on.
import { db } from "./db";
import { ORDERS, orderById, WISHLIST_IDS } from "./orders";
import { listOrdersFor, orderForPerson } from "./orders-data";
import type { ViewOrder } from "./orders-view";
import { listSaved } from "./wishlist-data";

export const SHOP_ORDERING_FLAG = "shop-ordering";

const showFixtures = () => process.env.NODE_ENV === "development";

export async function shopOrderingOn(): Promise<boolean> {
  try {
    const row = await db().featureFlag.findUnique({ where: { name: SHOP_ORDERING_FLAG } });
    return row?.enabled ?? false;
  } catch {
    return false;
  }
}

export async function ordersForViewer(personId: string): Promise<ViewOrder[]> {
  const rows = await listOrdersFor(personId);
  if (rows.length > 0) return rows;
  return showFixtures() ? [...ORDERS] : [];
}

export async function orderForViewer(personId: string, slug: string): Promise<ViewOrder | null> {
  const row = await orderForPerson(personId, slug);
  if (row) return row;
  if (!showFixtures()) return null;
  // Fixtures only stand in while the person has no real orders at all.
  if ((await listOrdersFor(personId)).length > 0) return null;
  return orderById(slug.trim().toLowerCase());
}

export async function savedForViewer(personId: string): Promise<string[]> {
  const ids = await listSaved(personId);
  if (ids.length > 0) return ids;
  return showFixtures() ? [...WISHLIST_IDS] : [];
}
