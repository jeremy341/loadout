import type { Metadata } from "next";
import Link from "next/link";
import "@/app/_components/platform/expeditions.css";
import { PageHead } from "@/app/_components/platform/PageHead";
import { OrderRow } from "@/app/_components/platform/expeditions/OrderRow";
import { WishlistRow } from "@/app/_components/platform/expeditions/WishlistRow";
import "@/app/_components/platform/orders-live.css";
import { ORDERS_CLOSED_SENTENCE, ORDERS_TAB_LABELS, ORDERS_TABS, ordersHref, parseOrdersTab, wishlistEntries } from "@/lib/platform/orders";
import { requireViewer } from "@/lib/platform/session";
import { sampleApprovedHours } from "@/lib/platform/shop";
import { ordersForViewer, savedForViewer, shopOrderingOn } from "@/lib/platform/shop-ordering";
import { removeSavedAction } from "./actions";

export const metadata: Metadata = { title: "Orders - LOADOUT" };

// The builder's orders and wishlist for the Shop. Pixl's dashboard has no builder orders page, so this is designed from
// plans/02: a history with a status, and a personal wishlist that reserves nothing. Real rows are read for the signed-in
// person (what they paid is never re-priced). With no real rows, local development keeps showing the fixture rows so the
// screens are not empty; production shows the empty state. Removing a wishlist item needs the shop-ordering flag. The tab is
// in the address (?tab=wishlist).
export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireViewer();
  const tab = parseOrdersTab(await searchParams);
  const approved = sampleApprovedHours();
  const [orders, saved, ordering] = await Promise.all([ordersForViewer(viewer.id), savedForViewer(viewer.id), shopOrderingOn()]);
  const wishlist = wishlistEntries(saved, approved);
  const counts = { orders: orders.length, wishlist: wishlist.length };

  return (
    <>
      <PageHead title="Orders">What you have ordered from the Shop, and the items you are saving for later.</PageHead>

      <nav className="pf-explore-filters" aria-label="Orders and wishlist">
        {ORDERS_TABS.map((item) => (
          <Link key={item} href={ordersHref(item)} aria-current={item === tab ? "page" : undefined}>
            <span>{ORDERS_TAB_LABELS[item]}</span>{" "}
            <span className="ex-count-pill ex-num">{counts[item]}</span>
          </Link>
        ))}
      </nav>

      {tab === "orders" ? (
        orders.length === 0 ? (
          <p className="pf-empty-line">
            No orders yet. <Link href="/dashboard/shop">Browse the Shop</Link>
          </p>
        ) : (
          <section aria-labelledby="orders-heading">
            <h2 id="orders-heading" className="pf-sr">
              Your orders
            </h2>
            <ul className="ex-list">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} approved={approved} />
              ))}
            </ul>
          </section>
        )
      ) : (
        <section aria-labelledby="wishlist-heading">
          <h2 id="wishlist-heading" className="pf-sr">
            Your wishlist
          </h2>
          <div className="ex-tools">
            {ordering ? (
              <p className="ex-closed" id="wishlist-note">
                Save items from their Shop page. A wishlist does not reserve stock or lock a price.
              </p>
            ) : (
              <>
                <button type="button" className="pf-btn" disabled aria-describedby="wishlist-note">
                  Add an item
                </button>
                <p className="ex-closed" id="wishlist-note">
                  {ORDERS_CLOSED_SENTENCE} A wishlist does not reserve stock or lock a price.
                </p>
              </>
            )}
          </div>
          {wishlist.length === 0 ? (
            <p className="pf-empty-line">
              Nothing saved yet. <Link href="/dashboard/shop">Browse the Shop</Link>
            </p>
          ) : (
            <ul className="ex-list">
              {wishlist.map((entry) => (
                <WishlistRow key={entry.item.id} entry={entry} noteId="wishlist-note" remove={ordering ? removeSavedAction : undefined} />
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
