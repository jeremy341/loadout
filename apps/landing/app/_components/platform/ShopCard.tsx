import Image from "next/image";
import Link from "next/link";
import { hoursOfWork, lockFor, priceFor, type ShopItem, type TrackHours } from "@/lib/platform/shop";
import { trackSlug } from "@/lib/platform/tracks";
import { WishlistStar } from "./WishlistStar";
import "./shop.css";

// The product photo, or a pixel sprite for items that have none, on a quiet panel. The name sits beside it, so it is decoration.
export function ShopPhoto({ item, large = false }: Readonly<{ item: ShopItem; large?: boolean }>) {
  return (
    <div className={["pf-shop-photo", large ? "pf-shop-photo-lg" : "", item.logo ? `pf-shop-logo pf-shop-logo-${item.logo}` : ""].filter(Boolean).join(" ")}>
      <Image
        className={item.icon ? "pf-shop-sprite" : undefined}
        src={item.photo}
        alt=""
        width={item.width}
        height={item.height}
        sizes={large ? "(min-width: 900px) 480px, 100vw" : "(min-width: 900px) 320px, (min-width: 560px) 50vw, 100vw"}
        unoptimized={item.icon}
      />
    </div>
  );
}

// An item's tags: the tracks it relates to, each with the track's colour, or General for everyone.
export function ShopTags({ item }: Readonly<{ item: ShopItem }>) {
  return (
    <ul className="pf-shop-tags" aria-label="Tags">
      {item.tracks.length === 0 ? (
        <li className="pf-shop-tag">General</li>
      ) : (
        item.tracks.map((track) => (
          <li key={track} className="pf-shop-tag" data-track={trackSlug(track)}>
            <span className="pf-shop-swatch" aria-hidden="true" />
            {track}
          </li>
        ))
      )}
    </ul>
  );
}

// The Ore price: the Ore gem, the price after your level discount (the price before it struck through when you have one) and a
// plain-spoken sr-only reading. A bordered box, not a button: the whole card is the link.
export function OrePrice({ base, final, large = false }: Readonly<{ base: number; final: number; large?: boolean }>) {
  const discounted = final < base;
  return (
    <span className={large ? "pf-shop-chip pf-shop-chip-lg" : "pf-shop-chip"}>
      <Image className="pf-ore-icon" src="/loadout/sprites/ore.png" alt="" width={32} height={32} unoptimized />
      <span className="pf-shop-chip-text">
        {discounted ? (
          <>
            <s className="pf-shop-was">
              <span className="pf-sr">Was </span>
              {base.toLocaleString("en-GB")}
            </s>{" "}
            <span className="pf-sr">now </span>
          </>
        ) : null}
        <b className="pf-shop-amount">{final.toLocaleString("en-GB")}</b>
        <span className="pf-sr"> Ore</span>
      </span>
    </span>
  );
}

// One item as a compact card: the photo with its badges and the wishlist star, the kind, the name, the tags, and a foot with
// the Ore price chip and the hours of work it comes to. The star is a sibling of the link, not inside it. At phone width the
// grid turns the card into a row (a small photo at the left) so a screen holds several items.
export function ShopCard({ item, approved, noteId }: Readonly<{ item: ShopItem; approved: TrackHours; noteId: string }>) {
  const price = priceFor(item, approved);
  const lock = lockFor(item, approved);
  return (
    <div className="pf-card pf-shop-card">
      <Link className="pf-shop-link" href={`/dashboard/shop/${item.id}`}>
        <div className="pf-shop-cover">
          <ShopPhoto item={item} />
          {item.limited || lock ? (
            <span className="pf-shop-badges">
              {item.limited ? <span className="pf-shop-badge">Limited</span> : null}
              {lock ? (
                <span className="pf-shop-badge">
                  Needs {lock.track} LV.{lock.level}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
        <div className="pf-shop-body">
          <span className="pf-shop-kind">{item.kind}</span>
          <h3 className="pf-shop-name">{item.name}</h3>
          <ShopTags item={item} />
          <span className="pf-shop-foot">
            <OrePrice base={price.base} final={price.final} />
            <span className="pf-shop-hours">{hoursOfWork(price.final)} H of work</span>
          </span>
        </div>
      </Link>
      <WishlistStar item={item} describedBy={noteId} />
    </div>
  );
}
