import { WISHLIST_IDS } from "@/lib/platform/orders";
import "./shop.css";

// A pixel star on an 11 by 11 grid, in the same crisp-edge path style as the back arrow and the plus. Filled when the item is on
// the wishlist, an outline when it is not, so the state is never colour alone.
const STAR_SHAPE = "M5 0h1v1H5zM4 1h3v2H4zM0 3h11v1H0zM1 4h9v2H1zM2 6h7v2H2zM2 8h3v1H2zM6 8h3v1H6zM1 9h3v1H1zM7 9h3v1H7zM0 10h3v1H0zM8 10h3v1H8z";
const STAR_HOLE = "M2 4h7v2H2zM3 6h5v2H3z";

export function StarGlyph({ filled }: Readonly<{ filled: boolean }>) {
  return (
    <svg className="pf-shop-star-glyph" viewBox="0 0 11 11" width="22" height="22" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d={filled ? STAR_SHAPE : `${STAR_SHAPE}${STAR_HOLE}`} fillRule="evenodd" />
    </svg>
  );
}

// The wishlist star. Wishlists are not built yet (plan 02 keeps the Shop closed), so it is a focusable button that says why it
// does nothing: `aria-disabled`, named for the item, described by the reason. An item on the sample wishlist shows filled.
// Nothing is saved when it is pressed. The markup stays the same when the Shop release makes it live.
export function WishlistStar({
  item,
  variant = "card",
  describedBy,
}: Readonly<{ item: { id: string; name: string }; variant?: "card" | "button"; describedBy: string }>) {
  const saved = WISHLIST_IDS.includes(item.id);
  return (
    <button
      type="button"
      className={variant === "button" ? "pf-btn pf-shop-star pf-shop-star-text" : "pf-shop-star"}
      aria-disabled="true"
      aria-pressed={saved}
      aria-describedby={describedBy}
      aria-label={`Add ${item.name} to your wishlist`}
    >
      <StarGlyph filled={saved} />
      {variant === "button" ? <span aria-hidden="true">Wishlist</span> : null}
    </button>
  );
}
