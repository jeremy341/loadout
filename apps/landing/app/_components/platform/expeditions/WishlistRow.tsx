import Link from "next/link";
import { ShopPhoto, ShopTags } from "@/app/_components/platform/ShopCard";
import type { WishlistEntry } from "@/lib/platform/orders";
import { hoursOfWork } from "@/lib/platform/shop";
import "@/app/_components/platform/orders-live.css";

// One saved item: the picture, name and tags, the price at your level, and a Remove button that is off until the Shop
// opens. `noteId` names the sentence that says why. When `remove` is given (ordering is on) Remove is a real text action.
export function WishlistRow({ entry, noteId, remove }: Readonly<{ entry: WishlistEntry; noteId: string; remove?: (formData: FormData) => Promise<void> }>) {
  const { item, price, lock } = entry;
  const discounted = price.final < price.base;
  return (
    <li className="ex-row ex-wish">
      <span className="ex-thumb">
        <ShopPhoto item={item} />
      </span>
      <div className="ex-main">
        <span className="ex-label">{item.kind}</span>
        <h3 className="ex-name">
          <Link href={`/dashboard/shop/${item.id}`}>{item.name}</Link>
        </h3>
        <ShopTags item={item} />
        {lock ? (
          <p className="ex-wish-lock">
            Needs {lock.track} LV.{lock.level}. {lock.hoursToGo} more approved hours in {lock.track} to unlock it.
          </p>
        ) : null}
      </div>
      <p className="ex-wish-price">
        <span className="ex-total">
          {discounted ? (
            <>
              <s className="ex-was">
                <span className="pf-sr">Was </span>
                {price.base.toLocaleString("en-GB")}
              </s>{" "}
              <span className="pf-sr">now </span>
            </>
          ) : null}
          {price.final.toLocaleString("en-GB")} <small>Ore</small>
        </span>
        <span className="ex-label">{hoursOfWork(price.final)} H of work</span>
      </p>
      <div className="ex-wish-action">
        {remove ? (
          <form action={remove}>
            <input type="hidden" name="itemId" value={item.id} />
            <button type="submit" className="ol-act" aria-label={`Remove ${item.name} from your wishlist`}>
              Remove
            </button>
          </form>
        ) : (
          <button type="button" className="pf-btn" disabled aria-label={`Remove ${item.name} from your wishlist`} aria-describedby={noteId}>
            Remove
          </button>
        )}
      </div>
    </li>
  );
}
