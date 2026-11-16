import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShopCard } from "@/app/_components/platform/ShopCard";
import { ShopCategoryTiles } from "@/app/_components/platform/ShopCategoryTiles";
import { ShopRail } from "@/app/_components/platform/ShopRails";
import { ShopSearch } from "@/app/_components/platform/ShopSearch";
import { discountForHours, formatDiscount, oreBalance, TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";
import {
  filterShopItems,
  ORE_PER_HOUR,
  parseShopPage,
  parseShopQuery,
  recentlyAdded,
  sampleApprovedHours,
  SHOP_ITEMS,
  SHOP_SORT_LABELS,
  SHOP_SORTS,
  SHOP_TAGS,
  shopHref,
  visibleItems,
  withinReach,
} from "@/lib/platform/shop";
import { trackSlug } from "@/lib/platform/tracks";
import "@/app/_components/platform/shop.css";

export const metadata: Metadata = { title: "Shop - LOADOUT" };

const NOTE_ID = "shop-wish-note";

// The shop as a parts counter, after the Stardance shop hub (layout only): a top bar with the search and your Ore, a ruled
// discount row, the category tiles, short strips (recently added, within reach) and then the long list, 24 at a time. A search,
// a tag or the affordable filter drops the tiles and strips so only the list shows. Each item names the tracks it relates to,
// so Tools shows every Tools item including ones shared with other tracks, and General is open to everyone at the full price.
// Everything is a proposed item at a draft price and nothing can be ordered yet, which the page says. State lives in the address.
export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireViewer();
  const raw = await searchParams;
  const query = parseShopQuery(raw);
  const page = parseShopPage(raw);
  const approved = sampleApprovedHours();
  const ore = oreBalance();
  const items = filterShopItems(SHOP_ITEMS, query, approved, ore);
  const { shown, total, next } = visibleItems(items, page);
  const filtered = query.q !== "" || query.tag !== null || query.afford;
  const hub = !filtered && page === 1;
  const reach = hub ? withinReach(SHOP_ITEMS, approved, ore).slice(0, 8) : [];
  const fresh = hub ? recentlyAdded() : [];
  const heading = query.tag ?? (query.q ? "Search results" : "All items");

  return (
    <>
      <h1 className="pf-sr">Shop</h1>

      <div className="pf-shop-top">
        <ShopSearch query={query} />
        <div className="pf-shop-ore" aria-label="Your Ore">
          <Image className="pf-ore-icon" src="/loadout/sprites/ore.png" alt="" width={32} height={32} unoptimized />
          <span className="pf-shop-ore-value">{ore.toLocaleString("en-GB")}</span>
          <span className="pf-shop-ore-unit">Ore</span>
          <span className="pf-shop-ore-note">{ORE_PER_HOUR} Ore per approved hour</span>
        </div>
      </div>

      <ul className="pf-shop-discounts" aria-label="Your level discount by track">
        {TRACKS.map((track) => (
          <li key={track} data-track={trackSlug(track)}>
            <Link href={`/dashboard/tracks/${trackSlug(track)}`}>
              <span className="pf-shop-swatch" aria-hidden="true" />
              <span className="pf-shop-discount-name">{track}</span>
              <span className="pf-shop-discount-value">{formatDiscount(discountForHours(approved[track]))} off</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="pf-shop-closed-line">
        Ordering opens in a later release. These are proposed items at draft prices. <Link href="/dashboard/orders">Your orders and wishlist</Link>
        <span id={NOTE_ID} className="pf-sr">
          {" "}
          Wishlists open with the Shop release. Nothing is saved yet.
        </span>
      </p>

      {hub ? <ShopCategoryTiles /> : null}

      {fresh.length > 0 ? (
        <ShopRail title="Recently added">
          {fresh.map((item) => (
            <li key={item.id}>
              <ShopCard item={item} approved={approved} noteId={NOTE_ID} />
            </li>
          ))}
        </ShopRail>
      ) : null}

      {reach.length > 0 ? (
        <ShopRail title="Within reach" seeAllHref={shopHref({ ...query, afford: true })}>
          {reach.map((item) => (
            <li key={item.id}>
              <ShopCard item={item} approved={approved} noteId={NOTE_ID} />
            </li>
          ))}
        </ShopRail>
      ) : null}

      <section className="pf-shop-all" id="all-items" aria-labelledby="all-heading">
        <div className="pf-shop-all-head">
          <h2 id="all-heading">{heading}</h2>
          <nav className="pf-shop-sort" aria-label="Sort and filter">
            {SHOP_SORTS.map((sort) => (
              <Link key={sort} href={shopHref({ ...query, sort })} aria-current={sort === query.sort ? "true" : undefined} scroll={false}>
                {SHOP_SORT_LABELS[sort]}
              </Link>
            ))}
            <Link href={shopHref({ ...query, afford: !query.afford })} aria-current={query.afford ? "true" : undefined} scroll={false}>
              Affordable only
            </Link>
          </nav>
        </div>

        {filtered ? (
          <nav className="pf-explore-filters pf-shop-chips" aria-label="Filter by tag">
            {[null, ...SHOP_TAGS].map((tag) => (
              <Link key={tag ?? "all"} href={shopHref({ ...query, tag })} aria-current={tag === query.tag ? "page" : undefined}>
                {tag ?? "All items"}
              </Link>
            ))}
          </nav>
        ) : null}

        <p className="pf-shop-count" role="status">
          {filtered ? `${items.length} ${items.length === 1 ? "item matches" : "items match"}.` : `${items.length} ${items.length === 1 ? "item" : "items"}.`}
        </p>

        {items.length === 0 ? (
          query.afford && query.q === "" && query.tag === null ? (
            <p className="pf-empty-line">
              Nothing you can afford yet. Every approved hour earns {ORE_PER_HOUR} Ore. <Link href={shopHref({ ...query, afford: false })}>Show everything</Link>
            </p>
          ) : filtered ? (
            <p className="pf-empty-line">
              No items match. <Link href="/dashboard/shop">Clear the filters</Link>
            </p>
          ) : (
            <p className="pf-empty-line">The catalog is empty.</p>
          )
        ) : (
          <>
            <ul className="pf-shop-grid">
              {shown.map((item) => (
                <li key={item.id}>
                  <ShopCard item={item} approved={approved} noteId={NOTE_ID} />
                </li>
              ))}
            </ul>
            <div className="pf-shop-more">
              <span>
                Showing {shown.length} of {total}
              </span>
              {next ? (
                <Link className="pf-btn" href={shopHref(query, next)} scroll={false}>
                  Show more
                </Link>
              ) : null}
            </div>
          </>
        )}
      </section>
    </>
  );
}
