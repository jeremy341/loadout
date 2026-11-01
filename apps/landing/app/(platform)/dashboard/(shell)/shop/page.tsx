import type { Metadata } from "next";
import Link from "next/link";
import { ShopCard } from "@/app/_components/platform/ShopCard";
import { discountForHours, formatDiscount, oreBalance, TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";
import {
  filterShopItems,
  ORE_PER_HOUR,
  parseShopQuery,
  sampleApprovedHours,
  SHOP_ITEMS,
  SHOP_QUERY_MAX,
  SHOP_SORT_LABELS,
  SHOP_SORTS,
  SHOP_TAGS,
  shopHref,
} from "@/lib/platform/shop";
import { trackSlug } from "@/lib/platform/tracks";

export const metadata: Metadata = { title: "Shop - LOADOUT" };

// The shop, after Pixl's and Flavortown's: your Ore and discounts on top, a search box, tag chips (the four tracks and
// General), a sort, and a plain grid of items. Each item names the tracks it relates to, so Tools shows every Tools item,
// including ones shared with other tracks, and General shows the items open to everyone at the full price. Everything is a
// proposed item at a draft price and nothing can be ordered yet, which the page says. The state lives in the address.
export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireViewer();
  const query = parseShopQuery(await searchParams);
  const approved = sampleApprovedHours();
  const ore = oreBalance();
  const items = filterShopItems(SHOP_ITEMS, query, approved, ore);
  const filtered = query.q !== "" || query.tag !== null || query.afford;

  return (
    <>
      <h1 className="pf-sr">Shop</h1>

      <p className="pf-event-line">
        <span className="pf-event-dot" aria-hidden="true" />
        Ordering opens in a later release. These are proposed items at draft prices.
      </p>

      <section className="pf-box pf-shop-bar" aria-label="Your Ore and discounts">
        <div className="pf-shop-ore">
          <span className="pf-shop-ore-value">{ore.toLocaleString("en-GB")}</span>
          <span className="pf-shop-ore-unit">Ore</span>
          <span className="pf-tile-note">{ORE_PER_HOUR} Ore per approved hour</span>
        </div>
        <ul className="pf-shop-discounts">
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
      </section>

      <form className="pf-explore-search" method="get" action="/dashboard/shop" role="search">
        <label className="pf-sr" htmlFor="shop-q">
          Find an item
        </label>
        <input id="shop-q" className="pf-explore-input" type="search" name="q" defaultValue={query.q} maxLength={SHOP_QUERY_MAX} placeholder="Find an item" autoComplete="off" />
        {query.tag ? <input type="hidden" name="tag" value={query.tag.toLowerCase()} /> : null}
        {query.sort !== "featured" ? <input type="hidden" name="sort" value={query.sort} /> : null}
        {query.afford ? <input type="hidden" name="afford" value="1" /> : null}
        <button type="submit" className="pf-btn pri">
          Search
        </button>
      </form>

      <nav className="pf-explore-filters" aria-label="Filter by tag">
        {[null, ...SHOP_TAGS].map((tag) => (
          <Link key={tag ?? "all"} href={shopHref({ ...query, tag })} aria-current={tag === query.tag ? "page" : undefined}>
            {tag ?? "All items"}
          </Link>
        ))}
      </nav>

      <div className="pf-shop-meta">
        <p className="pf-shop-count" role="status">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
        <nav className="pf-shop-sort" aria-label="Sort and filter">
          {SHOP_SORTS.map((sort) => (
            <Link key={sort} href={shopHref({ ...query, sort })} aria-current={sort === query.sort ? "true" : undefined}>
              {SHOP_SORT_LABELS[sort]}
            </Link>
          ))}
          <Link href={shopHref({ ...query, afford: !query.afford })} aria-current={query.afford ? "true" : undefined}>
            Affordable only
          </Link>
        </nav>
      </div>

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
        <ul className="pf-project-grid pf-shop-grid">
          {items.map((item) => (
            <li key={item.id}>
              <ShopCard item={item} approved={approved} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
