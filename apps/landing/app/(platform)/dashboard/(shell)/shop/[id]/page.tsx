import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrePrice, ShopPhoto, ShopTags } from "@/app/_components/platform/ShopCard";
import { RequisitionChoice } from "@/app/_components/platform/RequisitionChoice";
import { SaveToggle } from "@/app/_components/platform/expeditions/SaveToggle";
import { ShopOrderForm } from "@/app/_components/platform/expeditions/ShopOrderForm";
import "@/app/_components/platform/orders-live.css";
import { formatDiscount } from "@/lib/platform/progress";
import { COUPON_LEVELS, requisitionOffer, requisitionReasonText, requisitionsAvailable, requisitionsEarned } from "@/lib/platform/requisitions";
import { requireViewer } from "@/lib/platform/session";
import { hoursOfWork, lockFor, priceFor, sampleApprovedHours, shopItemById } from "@/lib/platform/shop";
import { shopOrderingOn } from "@/lib/platform/shop-ordering";
import { listSaved } from "@/lib/platform/wishlist-data";
import { placeOrderAction, toggleSaveAction } from "./actions";
import "@/app/_components/platform/shop.css";

export const metadata: Metadata = { title: "Item - LOADOUT" };

const ore = (value: number) => `${value.toLocaleString("en-GB")} Ore`;

// One proposed item. The photo, what it is and what else is like it on the left; on the right a price box that stays in view
// (plan 02 section 26.10: base price, level discount, final price, and what a Field Requisition would add). There is no Related
// rail: it was removed on purpose, so nothing below the About box points at other items. While the
// shop-ordering flag is off there is nothing to buy, so the call to action is a button that says so and why. With it on, the
// one filled button is Order (quantity 1 to 10, the chosen requisition) and a Save/Saved text toggle keeps the item on the wishlist.
export default async function ShopItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const { id } = await params;
  const raw = await searchParams;
  const item = shopItemById(id);
  if (!item) notFound();

  const ordering = await shopOrderingOn();
  const saved = ordering ? (await listSaved(viewer.id)).includes(item.id) : false;
  const approved = sampleApprovedHours();
  const price = priceFor(item, approved);
  const lock = lockFor(item, approved);
  // Requisitions are worked out from approved hours. No order has used one yet, so the used list is empty.
  const offer = requisitionOffer(item, price, requisitionsAvailable(requisitionsEarned(approved), []));
  const wanted = (Array.isArray(raw.requisition) ? raw.requisition[0] : raw.requisition) === "1";
  const using = offer.eligible && wanted;
  const final = using ? offer.priceWith : price.final;
  const reason = requisitionReasonText(offer.reason);
  // Only when the builder simply has none yet: say how one is earned, from the same level table the offer uses.
  const unlock = offer.reason === "no_requisition_available" ? `You earn one at each coupon level in a track: LV.${COUPON_LEVELS.join(", ")}.` : null;

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

      <div className="pf-shop-item pf-flat">
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
            <OrePrice base={price.base} final={final} large />
            <p className="pf-hint">That is about {hoursOfWork(final)} approved hours of work.</p>

            {lock ? (
              <p className="pf-shop-lock" role="note">
                Needs {lock.track} LV.{lock.level}. {lock.hoursToGo} more approved hours in {lock.track} to unlock it.
              </p>
            ) : null}

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
              {using ? (
                <div>
                  <dt>Field Requisition</dt>
                  <dd>−{formatDiscount(offer.percentWith - price.percent)}</dd>
                </div>
              ) : null}
              <div className="pf-shop-total">
                <dt>You pay</dt>
                <dd>{ore(final)}</dd>
              </div>
            </dl>
            {using ? <p className="pf-hint">You save {ore(price.final - offer.priceWith)} more with the requisition.</p> : null}

            <RequisitionChoice useRequisition={using} available={offer.available} reason={offer.eligible ? null : reason} unlock={unlock} ordering={ordering} />

            {ordering ? (
              <>
                <ShopOrderForm itemId={item.id} requisition={using} action={placeOrderAction} />
                <SaveToggle itemId={item.id} saved={saved} action={toggleSaveAction} />
              </>
            ) : (
              <button type="button" className="pf-btn pri pf-shop-order" aria-disabled="true" aria-describedby="shop-order-why">
                Order opens later
              </button>
            )}
            <p className="pf-shop-closed" id={ordering ? undefined : "shop-order-why"}>
              {ordering ? null : <>Ordering opens in a later release. This is a proposed item at a draft price. </>}
              <Link href="/docs/pricing">How prices are worked out</Link>
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
        </div>
      </div>
    </>
  );
}
