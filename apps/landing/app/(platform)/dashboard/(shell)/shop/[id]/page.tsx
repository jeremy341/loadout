import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrePrice, ShopCard, ShopPhoto, ShopTags } from "@/app/_components/platform/ShopCard";
import { ShopRail } from "@/app/_components/platform/ShopRails";
import { WishlistStar } from "@/app/_components/platform/WishlistStar";
import { formatDiscount } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";
import {
  DISCOUNT_CAP_PERCENT,
  hoursOfWork,
  lockFor,
  priceFor,
  REQUISITION_MIN_ORE,
  REQUISITION_PERCENT,
  relatedItems,
  requisitionPreview,
  sampleApprovedHours,
  shopItemById,
} from "@/lib/platform/shop";
import "@/app/_components/platform/shop.css";

export const metadata: Metadata = { title: "Item - LOADOUT" };

const ore = (value: number) => `${value.toLocaleString("en-GB")} Ore`;
const NOTE_ID = "shop-wish-note";

// One proposed item. The photo, what it is and what else is like it on the left; on the right a price box that stays in view
// (plan 02 section 26.10: base price, level discount, final price, and what a Field Requisition would add). There is nothing to
// buy yet, so the call to action is a button that says so and why.
export default async function ShopItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  const item = shopItemById(id);
  if (!item) notFound();

  const approved = sampleApprovedHours();
  const price = priceFor(item, approved);
  const lock = lockFor(item, approved);
  const requisition = requisitionPreview(item, price);
  const related = relatedItems(item, 4);

  return (
    <>
      <div className="pf-crumbs">
        <Link className="pf-back" href="/dashboard/shop">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to Shop
        </Link>
        <WishlistStar item={item} variant="button" describedBy={NOTE_ID} />
      </div>

      <div className="pf-shop-item">
        <div className="pf-shop-item-photo">
          <div className="pf-shop-frame">
            <ShopPhoto item={item} large />
          </div>
          {item.credit ? (
            <p className="pf-shop-credit">
              Photo: {item.credit.by}, {item.credit.licence}, via{" "}
              <a href={item.credit.url} target="_blank" rel="noopener noreferrer">
                Wikimedia Commons
              </a>
            </p>
          ) : null}
        </div>

        <div className="pf-shop-item-side">
          <section className="pf-box pf-shop-buy" aria-labelledby="price-heading">
            <span className="pf-shop-kind">
              {item.kind}
              {item.limited ? " / Limited" : ""}
            </span>
            <h1>{item.name}</h1>
            <OrePrice base={price.base} final={price.final} large />
            <p className="pf-hint">That is about {hoursOfWork(price.final)} approved hours of work.</p>

            <h2 id="price-heading">Your price</h2>
            <dl className="pf-shop-lines">
              <div>
                <dt>Base price</dt>
                <dd>{ore(price.base)}</dd>
              </div>
              <div>
                <dt>{price.track ? `${price.track} level discount` : item.tracks.length === 0 ? "General item" : "Level discount"}</dt>
                <dd>{price.track ? `−${formatDiscount(price.percent)}` : item.tracks.length === 0 ? "No discount" : "None yet"}</dd>
              </div>
              <div className="pf-shop-total">
                <dt>You pay</dt>
                <dd>{ore(price.final)}</dd>
              </div>
            </dl>

            {requisition.eligible ? (
              <p className="pf-shop-requisition">
                With a Field Requisition this would be <strong>{ore(requisition.final)}</strong>: another {REQUISITION_PERCENT}% of the base price, up to {DISCOUNT_CAP_PERCENT}% off in
                total. It needs a matching track and a base price of {REQUISITION_MIN_ORE} Ore or more.
              </p>
            ) : item.tracks.length === 0 ? (
              <p className="pf-hint">General items are open to everyone at the full price. Level discounts and Field Requisitions need a matching track.</p>
            ) : (
              <p className="pf-hint">A Field Requisition needs a base price of {REQUISITION_MIN_ORE} Ore or more.</p>
            )}

            {lock ? (
              <p className="pf-shop-lock" role="note">
                Needs {lock.track} LV.{lock.level}. {lock.hoursToGo} more approved hours in {lock.track} to unlock it.
              </p>
            ) : null}

            <button type="button" className="pf-btn pri pf-shop-order" aria-disabled="true" aria-describedby="shop-order-why">
              Order opens later
            </button>
            <p className="pf-shop-closed" id="shop-order-why">
              Ordering opens in a later release. This is a proposed item at a draft price. <Link href="/docs/pricing">How prices are worked out</Link>
            </p>
            <p className="pf-hint" id={NOTE_ID}>
              Wishlists open with the Shop release. Nothing is saved yet.
            </p>
          </section>
        </div>

        <div className="pf-shop-item-more">
          <section className="pf-box pf-shop-about" aria-labelledby="about-heading">
            <h2 id="about-heading">About</h2>
            <p className="pf-project-lead">{item.blurb}</p>
            <dl className="pf-shop-facts">
              <div>
                <dt>Kind</dt>
                <dd>{item.kind}</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>
                  <ShopTags item={item} />
                </dd>
              </div>
            </dl>
          </section>

          {related.length > 0 ? (
            <ShopRail title="Related">
              {related.map((entry) => (
                <li key={entry.id}>
                  <ShopCard item={entry} approved={approved} noteId={NOTE_ID} />
                </li>
              ))}
            </ShopRail>
          ) : null}
        </div>
      </div>
    </>
  );
}
