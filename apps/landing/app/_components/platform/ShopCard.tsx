import Image from "next/image";
import Link from "next/link";
import { hoursOfWork, lockFor, priceFor, type ShopItem, type TrackHours } from "@/lib/platform/shop";
import { formatDiscount } from "@/lib/platform/progress";
import { trackSlug } from "@/lib/platform/tracks";
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
export function ShopTags({ item, max }: Readonly<{ item: ShopItem; max?: number }>) {
  const shown = max ? item.tracks.slice(0, max) : item.tracks;
  const more = item.tracks.length - shown.length;
  return (
    <ul className={max ? "pf-shop-tags pf-shop-tags-one" : "pf-shop-tags"} aria-label="Tags">
      {item.tracks.length === 0 ? (
        <li className="pf-shop-tag">General</li>
      ) : (
        shown.map((track) => (
          <li key={track} className="pf-shop-tag" data-track={trackSlug(track)}>
            <span className="pf-shop-swatch" aria-hidden="true" />
            {track}
          </li>
        ))
      )}
      {more > 0 ? <li className="pf-shop-tag pf-shop-tag-more">+{more}</li> : null}
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

// One item as a card with one anatomy and one height: the photo with its Limited and lock badges, the kind, the name (two lines
// reserved), one line of tags, the price row (Ore price chip and the level discount) and the hours of work. The whole card is the
// link. The grid stretches every card in a row to the same height.
export function ShopCard({ item, approved }: Readonly<{ item: ShopItem; approved: TrackHours }>) {
  const price = priceFor(item, approved);
  const lock = lockFor(item, approved);
  return (
    <div className="pf-card pf-shop-card" data-locked={lock ? "true" : undefined}>
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
          <ShopTags item={item} max={2} />
          <span className="pf-shop-price-row">
            <OrePrice base={price.base} final={price.final} />
            {price.final < price.base ? <span className="pf-shop-off">−{formatDiscount(price.percent)}</span> : null}
          </span>
          <span className="pf-shop-hours">{hoursOfWork(price.final)} H of work</span>
        </div>
      </Link>
    </div>
  );
}
