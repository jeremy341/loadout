"use client";

import { useEffect, useRef, useState } from "react";
import { EmptyState, Field, Tag } from "../../ui/ui";
import { CATEGORY_LABELS, SHOP_ITEMS, findShopItem, type ShopCategory, type ShopItem } from "./data";
import { useGearProfile, useWishlist } from "./gear-store";
import { OreAmount, Sprite, accessLabel, formatOre } from "./gear-ui";
import { DEFAULT_QUERY, SORT_LABELS, filterCatalog, rangeError, type CatalogQuery, type SortKey } from "./logic/catalog";
import { canAfford, meetsRequirement, priceItem, shortfall } from "./logic/pricing";
import { ItemDetail } from "./shop-detail";

// The catalog: search, category, price range, sort, "can afford", and a product view per item.

export function CatalogTab({ balance, announce }: { balance: number; announce: (message: string) => void }) {
  const { levels } = useGearProfile();
  const wishlist = useWishlist();
  const [query, setQuery] = useState<CatalogQuery>(DEFAULT_QUERY);
  const [openId, setOpenId] = useState<string | null>(null);
  const returnTo = useRef<string | null>(null);

  const wished = new Set(wishlist.list.map((entry) => entry.itemId));
  const shown = filterCatalog(SHOP_ITEMS, query, { balance, levels, wished });
  const range = rangeError(query);
  const open = openId ? findShopItem(openId) : undefined;

  useEffect(() => {
    if (openId === null && returnTo.current) {
      document.getElementById(`gr-open-${returnTo.current}`)?.focus();
      returnTo.current = null;
    }
  }, [openId]);

  function set<K extends keyof CatalogQuery>(key: K, value: CatalogQuery[K]) {
    setQuery((prev) => ({ ...prev, [key]: value }));
  }

  if (open) {
    return (
      <ItemDetail
        key={open.id}
        item={open}
        balance={balance}
        announce={announce}
        onBack={() => {
          returnTo.current = open.id;
          setOpenId(null);
        }}
      />
    );
  }

  const filtered = JSON.stringify(query) !== JSON.stringify(DEFAULT_QUERY);

  return (
    <div className="gr-stack">
      <form className="gr-stack" role="search" aria-label="Filter the shop" onSubmit={(event) => event.preventDefault()}>
        <div className="toolbar">
          <Field label="Search">
            <input type="search" value={query.text} placeholder="Name, track or category" onChange={(event) => set("text", event.target.value)} />
          </Field>
          <Field label="Category">
            <select value={query.category} onChange={(event) => set("category", event.target.value as ShopCategory | "all")}>
              <option value="all">All categories</option>
              {(Object.keys(CATEGORY_LABELS) as ShopCategory[]).map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort by">
            <select value={query.sort} onChange={(event) => set("sort", event.target.value as SortKey)}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="toolbar">
          <Field label="Lowest price (Ore)" error={range && query.min ? range : null}>
            <input type="number" inputMode="numeric" min={0} step={1} value={query.min} onChange={(event) => set("min", event.target.value)} />
          </Field>
          <Field label="Highest price (Ore)">
            <input type="number" inputMode="numeric" min={0} step={1} value={query.max} onChange={(event) => set("max", event.target.value)} />
          </Field>
          <div className="gr-checks">
            <label className="check">
              <input type="checkbox" checked={query.affordableOnly} onChange={(event) => set("affordableOnly", event.target.checked)} />
              <span>Can afford now</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={query.wishedOnly} onChange={(event) => set("wishedOnly", event.target.checked)} />
              <span>On my wishlist</span>
            </label>
          </div>
          {filtered ? (
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setQuery(DEFAULT_QUERY)}>
              Clear filters
            </button>
          ) : null}
        </div>
        <p className="mut" role="status" aria-live="polite">
          {shown.length} of {SHOP_ITEMS.length} sample items shown. Prices are after your track discount.
        </p>
      </form>

      {shown.length === 0 ? (
        <EmptyState
          title="No items match"
          action={
            <button type="button" className="btn btn-quiet" onClick={() => setQuery(DEFAULT_QUERY)}>
              Clear filters
            </button>
          }
        >
          Try a different search, widen the price range, or turn off Can afford now.
        </EmptyState>
      ) : (
        <ul className="card-grid" aria-label="Sample shop items">
          {shown.map((item) => (
            <li key={item.id} className="gr-listitem">
              <ItemCard
                item={item}
                balance={balance}
                saved={wished.has(item.id)}
                onToggle={() => {
                  const saved = wishlist.toggle(item.id);
                  announce(saved ? `${item.name} added to your wishlist.` : `${item.name} removed from your wishlist.`);
                }}
                onOpen={() => setOpenId(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemCard({ item, balance, saved, onToggle, onOpen }: { item: ShopItem; balance: number; saved: boolean; onToggle: () => void; onOpen: () => void }) {
  const { levels } = useGearProfile();
  const price = priceItem(item, levels);
  const requirement = meetsRequirement(item.requires, levels);
  const missing = shortfall(balance, price.final);

  return (
    <article className="gr-card" aria-label={item.name}>
      <div className="gr-card-head">
        <span className="gr-sprite-box">
          <Sprite name={item.sprite} size={40} />
        </span>
        <div className="gr-tight">
          <h3>{item.name}</h3>
          <div className="gr-tags">
            <Tag>Sample item</Tag>
            <Tag>{CATEGORY_LABELS[item.category]}</Tag>
            {item.access !== "open" ? <Tag tone="warn">{accessLabel(item.access)}</Tag> : null}
          </div>
        </div>
      </div>
      <p className="mut">{item.blurb}</p>
      <div className="gr-card-foot">
        <div className="gr-price">
          <OreAmount amount={price.final} strong />
          {price.permanentSaving > 0 ? (
            <>
              <span className="gr-was">
                <span className="sr-only">Base price </span>
                {price.base.toLocaleString("en-GB")} Ore
              </span>
              <Tag tone="ok">
                {price.permanentPercent}% off{price.permanentTrack ? `, ${price.permanentTrack}` : ""}
              </Tag>
            </>
          ) : null}
        </div>
        <p className="mut">
          {!requirement.ok
            ? `Locked: needs ${item.requires?.tracks.join(" or ")} level ${item.requires?.level}, ${requirement.levelsRemaining} to go.`
            : canAfford(balance, price.final)
              ? "You can afford this."
              : `You need ${formatOre(missing)} more.`}
        </p>
        <div className="gr-row">
          <button id={`gr-open-${item.id}`} type="button" className="btn btn-sm" aria-label={`Details for ${item.name}`} onClick={onOpen}>
            Details
          </button>
          <button type="button" className="gr-heart" aria-pressed={saved} aria-label={`Wishlist: ${item.name}`} onClick={onToggle}>
            <span aria-hidden="true" className="gr-heart-mark">
              {saved ? "♥" : "♡"}
            </span>
            <span>Wishlist</span>
          </button>
        </div>
      </div>
    </article>
  );
}
