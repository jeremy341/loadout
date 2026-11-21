"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { SHOP_QUERY_MAX, shopHref, type ShopQuery } from "@/lib/platform/shop";
import "./shop.css";

// The shop search. A plain form that works with no script (Enter or the Search button loads `?q=`). With script, typing updates
// the address after a 300 ms pause and the page below answers; the field is not a combobox because the results are the page
// itself, and the count line under the grid announces them.
export function ShopSearch({ query }: Readonly<{ query: ShopQuery }>) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function onInput(value: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const q = value.trim().slice(0, SHOP_QUERY_MAX);
      if (q === query.q) return;
      start(() => router.replace(shopHref({ ...query, q }), { scroll: false }));
    }, 300);
  }

  return (
    <form className="pf-shop-search" method="get" action="/dashboard/shop" role="search" aria-busy={pending}>
      <label className="pf-shop-label" htmlFor="shop-q">
        Search the shop
      </label>
      <div className="pf-shop-search-row">
        <input
          id="shop-q"
          className="pf-explore-input pf-shop-input"
          type="search"
          name="q"
          defaultValue={query.q}
          maxLength={SHOP_QUERY_MAX}
          placeholder="Find an item"
          autoComplete="off"
          onChange={(event) => onInput(event.currentTarget.value)}
        />
        {query.tag ? <input type="hidden" name="tag" value={query.tag.toLowerCase()} /> : null}
        {query.sort !== "featured" ? <input type="hidden" name="sort" value={query.sort} /> : null}
        {query.afford ? <input type="hidden" name="afford" value="1" /> : null}
        <button type="submit" className="pf-btn pri">
          Search
        </button>
      </div>
    </form>
  );
}
