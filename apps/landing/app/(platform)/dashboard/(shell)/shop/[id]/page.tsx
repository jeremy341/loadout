import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopPhoto, ShopTags } from "@/app/_components/platform/ShopCard";
import { formatDiscount } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";
import {
  DISCOUNT_CAP_PERCENT,
  hoursOfWork,
  lockFor,
  priceFor,
  REQUISITION_MIN_ORE,
  REQUISITION_PERCENT,
  requisitionPreview,
  sampleApprovedHours,
  shopItemById,
} from "@/lib/platform/shop";

export const metadata: Metadata = { title: "Item - LOADOUT" };

const ore = (value: number) => `${value.toLocaleString("en-GB")} Ore`;

// One proposed item: the photo, what it is, its tags, and how the price is worked out from your level (plan 02 section
// 26.10: base price, level discount, final price, and what a Field Requisition would add). There is nothing to buy yet.
export default async function ShopItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  const item = shopItemById(id);
  if (!item) notFound();

  const approved = sampleApprovedHours();
  const price = priceFor(item, approved);
  const lock = lockFor(item, approved);
  const requisition = requisitionPreview(item, price);

  return (
    <>
      <div className="pf-crumbs">
        <Link className="pf-back" href="/dashboard/shop">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to Shop
        </Link>
      </div>

      <div className="pf-shop-detail">
        <div className="pf-shop-detail-side">
          <div className="pf-shop-detail-photo">
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

        <div className="pf-shop-detail-main">
          <span className="pf-shop-kind">
            {item.kind}
            {item.limited ? " / Limited" : ""}
          </span>
          <h1>{item.name}</h1>
          <p className="pf-project-lead">{item.blurb}</p>
          <ShopTags item={item} />

          <section className="pf-box" aria-labelledby="price-heading">
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
            <p className="pf-hint">That is about {hoursOfWork(price.final)} approved hours of work.</p>

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

            <p className="pf-shop-closed">
              Ordering opens in a later release. This is a proposed item at a draft price.{" "}
              <Link href="/docs/pricing">How prices are worked out</Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
