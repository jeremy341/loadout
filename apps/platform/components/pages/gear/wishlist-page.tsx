"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useOre } from "../../../lib/ore-ledger";
import { uid } from "../../../lib/preview-store";
import { EmptyState, Field, Meter, PageHeader, PreviewNote, Stat, Status, Tag } from "../../ui/ui";
import { AVAILABILITY_NOTE, CATEGORY_LABELS, findShopItem, type ShopItem } from "./data";
import { navLead } from "./gear-nav";
import { placeOrderNow, useGearProfile, useWishlist } from "./gear-store";
import { OreAmount, Sprite, formatOre, useAnnounce } from "./gear-ui";
import type { Order } from "./logic/orders";
import { canAfford, meetsRequirement, priceItem, priceOrder, progressPercent, shortfall } from "./logic/pricing";
import { sortByClosest, wishlistShareText, type WishEntry } from "./logic/wishlist";

// Plans/02 section 26 "Shop Wishlist": a personal list of what you are working toward. It does not reserve stock,
// lock a price or promise availability, and there is no suggestion or voting system.

type SortMode = "mine" | "closest";

export function WishlistPage() {
  const ore = useOre();
  const { levels } = useGearProfile();
  const wishlist = useWishlist();
  const [sort, setSort] = useState<SortMode>("mine");
  const [message, announce] = useAnnounce();
  const [shareOpen, setShareOpen] = useState(false);
  const topRef = useRef<HTMLHeadingElement>(null);
  const shareId = useId();

  const rows = wishlist.list.map((entry) => ({ entry, item: findShopItem(entry.itemId) }));
  const ordered: WishEntry[] =
    sort === "closest"
      ? sortByClosest(wishlist.list, (entry) => {
          const item = findShopItem(entry.itemId);
          if (!item) return Number.MAX_SAFE_INTEGER;
          const locked = !meetsRequirement(item.requires, levels).ok;
          return shortfall(ore.balance, priceItem(item, levels).final) + (locked ? 1_000_000 : 0);
        })
      : wishlist.list;

  const known = rows.filter((row): row is { entry: WishEntry; item: ShopItem } => row.item !== undefined);
  const affordable = known.filter(({ item }) => canAfford(ore.balance, priceItem(item, levels).final) && meetsRequirement(item.requires, levels).ok).length;
  const totalCost = known.reduce((sum, { item }) => sum + priceItem(item, levels).final, 0);

  const shareText = wishlistShareText(
    ordered.flatMap((entry) => {
      const item = findShopItem(entry.itemId);
      return item ? [{ name: item.name, price: priceItem(item, levels).final, note: entry.note }] : [];
    }),
  );

  async function copyList() {
    try {
      await navigator.clipboard.writeText(shareText);
      announce("Wishlist copied as plain text.");
    } catch {
      setShareOpen(true);
      announce("Could not copy automatically. The list text is shown so you can copy it by hand.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Gear" title="Wishlist" lead={navLead("wishlist")} />
      <PreviewNote>
        Your list and notes are saved in this browser. A wishlist does not reserve stock, lock a price or promise availability, and sample prices are not final.
      </PreviewNote>

      <div className="gr-stack">
        <div className="gr-bar">
          <Stat label="Your Ore" value={ore.balance.toLocaleString("en-GB")} hint="Balance in the Ore ledger" />
          <Stat label="Saved items" value={wishlist.list.length} hint={`${affordable} you can order now`} />
          <Stat label="Total of the list" value={`${totalCost.toLocaleString("en-GB")} Ore`} hint="After your track discount" />
        </div>
        <Status message={message} />

        <h2 ref={topRef} tabIndex={-1} className="gr-h2 gr-focus-target">
          Saved items
        </h2>
        {wishlist.list.length === 0 ? (
          <EmptyState
            title="Your wishlist is empty"
            action={
              <Link href="/shop" className="btn">
                Browse the Shop
              </Link>
            }
          >
            Save items from the Shop with the Wishlist button and they appear here with how close you are to each one.
          </EmptyState>
        ) : (
          <>
            <div className="toolbar">
              <Field label="Order the list">
                <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                  <option value="mine">My order</option>
                  <option value="closest">Closest to affordable first</option>
                </select>
              </Field>
              <div className="gr-row">
                <button type="button" className="btn btn-quiet btn-sm" onClick={copyList}>
                  Copy list as text
                </button>
                <button type="button" className="btn btn-quiet btn-sm" aria-expanded={shareOpen} aria-controls={shareId} onClick={() => setShareOpen((open) => !open)}>
                  {shareOpen ? "Hide text" : "Show text"}
                </button>
              </div>
            </div>
            {shareOpen ? (
              <div id={shareId}>
                <label className="fld">
                  <span className="fld-label">List text</span>
                  <textarea readOnly value={shareText} rows={Math.min(12, shareText.split("\n").length + 1)} onFocus={(event) => event.currentTarget.select()} />
                </label>
              </div>
            ) : null}
            {sort === "closest" ? <p className="mut">Showing the item closest to affordable first. Switch back to My order to move items up and down.</p> : null}
            <ol className="gr-stack" aria-label="Saved items">
              {ordered.map((entry, index) => (
                <li key={entry.itemId}>
                  <WishRow
                    entry={entry}
                    index={index}
                    count={ordered.length}
                    reorderable={sort === "mine"}
                    balance={ore.balance}
                    announce={announce}
                    onRemoved={() => topRef.current?.focus()}
                  />
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </>
  );
}

/** Moving a row re-creates its DOM position, so put focus back on a button that still works. */
function refocus(id: string) {
  window.setTimeout(() => document.getElementById(id)?.focus(), 0);
}

function WishRow({
  entry,
  index,
  count,
  reorderable,
  balance,
  announce,
  onRemoved,
}: {
  entry: WishEntry;
  index: number;
  count: number;
  reorderable: boolean;
  balance: number;
  announce: (message: string) => void;
  onRemoved: () => void;
}) {
  const { levels } = useGearProfile();
  const wishlist = useWishlist();
  const base = useId();
  const item = findShopItem(entry.itemId);
  const [removing, setRemoving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLParagraphElement>(null);
  const orderRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pendingId) confirmRef.current?.focus();
  }, [pendingId]);

  if (!item) {
    return (
      <div className="gr-order">
        <p>This item is no longer in the sample catalog.</p>
        <div className="gr-row">
          <button type="button" className="btn btn-danger btn-sm" onClick={() => wishlist.remove(entry.itemId)}>
            Remove it from the list
          </button>
        </div>
      </div>
    );
  }

  const price = priceItem(item, levels);
  const requirement = meetsRequirement(item.requires, levels);
  const missing = shortfall(balance, price.final);
  const ready = canAfford(balance, price.final) && requirement.ok;
  const pct = progressPercent(balance, price.final);
  const order = priceOrder(item, 1, levels, null);

  function confirmOrder() {
    if (!item || !pendingId) return;
    const result = placeOrderNow({ orderId: pendingId, line: { item, quantity: 1 }, ticket: null });
    setPendingId(null);
    if (!result.ok) {
      setError(result.message);
      announce(`Order not placed. ${result.message}`);
      return;
    }
    setError(null);
    setPlaced(result.order);
    announce(`Order ${result.order.number} placed for ${item.name}. ${formatOre(result.order.oreSpent)} spent.`);
  }

  function remove() {
    if (!item) return;
    wishlist.remove(entry.itemId);
    announce(`${item.name} removed from your wishlist.`);
    onRemoved();
  }

  return (
    <article className="gr-order" aria-labelledby={`${base}-name`}>
      <div className="gr-row-between">
        <div className="gr-row">
          <span className="gr-sprite-box">
            <Sprite name={item.sprite} size={40} />
          </span>
          <div className="gr-tight">
            <h3 id={`${base}-name`}>{item.name}</h3>
            <div className="gr-tags">
              <Tag>Sample item</Tag>
              <Tag>{CATEGORY_LABELS[item.category]}</Tag>
            </div>
          </div>
        </div>
        <div className="gr-price">
          <OreAmount amount={price.final} strong />
          {price.permanentSaving > 0 ? (
            <>
              <span className="gr-was">
                <span className="sr-only">Base price </span>
                {price.base.toLocaleString("en-GB")} Ore
              </span>
              <Tag tone="ok">{price.permanentPercent}% off</Tag>
            </>
          ) : null}
        </div>
      </div>

      <div className="gr-progress">
        <Meter value={Math.min(balance, price.final)} max={price.final} label={`Ore toward ${item.name}`} />
        <p className="mut">
          {formatOre(Math.min(balance, price.final))} of {formatOre(price.final)} ({pct}%).{" "}
          {!requirement.ok
            ? `Locked: needs ${item.requires?.tracks.join(" or ")} level ${item.requires?.level}, ${requirement.levelsRemaining} to go.`
            : ready
              ? "You can order this now."
              : `You need ${formatOre(missing)} more.`}
          {!ready && requirement.ok ? (
            <>
              {" "}
              <Link href="/ore-calculator">Estimate Ore</Link>
            </>
          ) : null}
        </p>
      </div>

      <Field label={`Note for ${item.name}`} hint="Why you want it. Up to 140 characters.">
        <input type="text" maxLength={140} value={entry.note} onChange={(event) => wishlist.setNote(entry.itemId, event.target.value)} />
      </Field>

      {placed ? (
        <p className="gr-success" role="status">
          Order {placed.number} placed. <Link href="/orders">View your orders</Link>.
        </p>
      ) : null}
      {error ? (
        <p className="gr-warn" role="alert">
          {error}
        </p>
      ) : null}

      {pendingId ? (
        <div className="gr-confirm" role="group" aria-labelledby={`${base}-confirm`}>
          <p id={`${base}-confirm`} ref={confirmRef} tabIndex={-1} className="gr-focus-target">
            <strong>
              Confirm: spend {formatOre(order.total)} on {item.name}?
            </strong>
          </p>
          <p className="mut">
            Base {formatOre(price.base)}, track discount {order.permanentSavingTotal > 0 ? `-${formatOre(order.permanentSavingTotal)}` : "none"}. To use a Requisition, order from the Shop. {AVAILABILITY_NOTE}
          </p>
          <div className="gr-row">
            <button type="button" className="btn" onClick={confirmOrder}>
              Confirm and spend {formatOre(order.total)}
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                setPendingId(null);
                window.setTimeout(() => orderRef.current?.focus(), 0);
              }}
            >
              Go back
            </button>
          </div>
        </div>
      ) : removing ? (
        <div className="gr-confirm" role="group" aria-label={`Remove ${item.name}`}>
          <p>
            <strong>Remove {item.name} from your wishlist?</strong> Your note goes with it.
          </p>
          <div className="gr-row">
            <button type="button" className="btn btn-danger btn-sm" onClick={remove}>
              Yes, remove
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setRemoving(false)}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div className="gr-row">
          <button
            ref={orderRef}
            type="button"
            className="btn btn-sm"
            aria-disabled={!ready}
            onClick={() => {
              if (ready) {
                setError(null);
                setPendingId(uid("ord"));
              }
            }}
          >
            Order now
          </button>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            id={`${base}-up`}
            aria-label={`Move ${item.name} up`}
            disabled={!reorderable || index === 0}
            onClick={() => {
              wishlist.move(entry.itemId, -1);
              announce(`${item.name} moved up to position ${index}.`);
              refocus(index - 1 === 0 ? `${base}-down` : `${base}-up`);
            }}
          >
            Move up
          </button>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            id={`${base}-down`}
            aria-label={`Move ${item.name} down`}
            disabled={!reorderable || index === count - 1}
            onClick={() => {
              wishlist.move(entry.itemId, 1);
              announce(`${item.name} moved down to position ${index + 2}.`);
              refocus(index + 1 === count - 1 ? `${base}-up` : `${base}-down`);
            }}
          >
            Move down
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setRemoving(true)}>
            Remove
          </button>
        </div>
      )}
    </article>
  );
}
