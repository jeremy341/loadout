import type { Metadata } from "next";
import Link from "next/link";
import "@/app/_components/platform/expeditions.css";
import { PageHead } from "@/app/_components/platform/PageHead";
import { OrderRow } from "@/app/_components/platform/expeditions/OrderRow";
import { WishlistRow } from "@/app/_components/platform/expeditions/WishlistRow";
import { ORDERS, ORDERS_CLOSED_SENTENCE, ORDERS_TAB_LABELS, ORDERS_TABS, ordersHref, parseOrdersTab, WISHLIST_IDS, wishlistEntries } from "@/lib/platform/orders";
import { requireViewer } from "@/lib/platform/session";
import { sampleApprovedHours } from "@/lib/platform/shop";

export const metadata: Metadata = { title: "Orders - LOADOUT" };

// The builder's orders and wishlist for the Shop. Pixl's dashboard has no builder orders page, so this is designed from
// plans/02: a history with a status, and a personal wishlist that reserves nothing. Both are sample rows over real catalog
// items, priced by the shop's own rules at the same sample hours, and neither can change anything yet. The tab is in the
// address (?tab=wishlist).
export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireViewer();
  const tab = parseOrdersTab(await searchParams);
  const approved = sampleApprovedHours();
  const wishlist = wishlistEntries(WISHLIST_IDS, approved);
  const counts = { orders: ORDERS.length, wishlist: wishlist.length };

  return (
    <>
      <PageHead title="Orders">What you have ordered from the Shop, and the items you are saving for later.</PageHead>

      <p className="pf-event-line">
        <span className="pf-event-dot" aria-hidden="true" />
        Ordering opens with the Shop release. These are sample orders and a sample wishlist over the proposed catalog.
      </p>

      <nav className="pf-explore-filters" aria-label="Orders and wishlist">
        {ORDERS_TABS.map((item) => (
          <Link key={item} href={ordersHref(item)} aria-current={item === tab ? "page" : undefined}>
            <span>{ORDERS_TAB_LABELS[item]}</span>{" "}
            <span className="ex-count-pill ex-num">{counts[item]}</span>
          </Link>
        ))}
      </nav>

      {tab === "orders" ? (
        ORDERS.length === 0 ? (
          <p className="pf-empty-line">
            No orders yet. <Link href="/dashboard/shop">Browse the Shop</Link>
          </p>
        ) : (
          <section aria-labelledby="orders-heading">
            <h2 id="orders-heading" className="pf-sr">
              Your orders
            </h2>
            <ul className="ex-list">
              {ORDERS.map((order) => (
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
            <button type="button" className="pf-btn" disabled aria-describedby="wishlist-note">
              Add an item
            </button>
            <p className="ex-closed" id="wishlist-note">
              {ORDERS_CLOSED_SENTENCE} A wishlist does not reserve stock or lock a price.
            </p>
          </div>
          {wishlist.length === 0 ? (
            <p className="pf-empty-line">
              Nothing saved yet. <Link href="/dashboard/shop">Browse the Shop</Link>
            </p>
          ) : (
            <ul className="ex-list">
              {wishlist.map((entry) => (
                <WishlistRow key={entry.item.id} entry={entry} noteId="wishlist-note" />
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
