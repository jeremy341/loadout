import Image from "next/image";
import Link from "next/link";
import { hoursOfWork, lockFor, priceFor, type ShopItem, type TrackHours } from "@/lib/platform/shop";
import { trackSlug } from "@/lib/platform/tracks";

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

// One item in the catalog grid: the photo with its badges, the kind, the name, the tags, and a footer with the price (the
// price before your discount struck through when you have one) and the hours of work it comes to.
export function ShopCard({ item, approved }: Readonly<{ item: ShopItem; approved: TrackHours }>) {
  const price = priceFor(item, approved);
  const lock = lockFor(item, approved);
  const discounted = price.final < price.base;
  return (
    <Link className="pf-card pf-project-card pf-shop-card" href={`/dashboard/shop/${item.id}`}>
      <div className="pf-shop-cover">
        {item.limited ? <span className="pf-badge pf-badge-status">Limited</span> : null}
        {lock ? <span className="pf-badge pf-badge-track">Needs {lock.track} LV.{lock.level}</span> : null}
        <ShopPhoto item={item} />
      </div>
      <div className="pf-project-body">
        <span className="pf-shop-kind">{item.kind}</span>
        <h3>{item.name}</h3>
        <ShopTags item={item} />
      </div>
      <span className="pf-project-foot pf-shop-foot">
        <span className="pf-shop-price">
          {discounted ? (
            <>
              <s className="pf-shop-was">
                <span className="pf-sr">Was </span>
                {price.base.toLocaleString("en-GB")}
              </s>{" "}
              <span className="pf-sr">now </span>
            </>
          ) : null}
          <b className="pf-shop-now">{price.final.toLocaleString("en-GB")}</b> Ore
        </span>
        <span>{hoursOfWork(price.final)} H of work</span>
      </span>
    </Link>
  );
}
