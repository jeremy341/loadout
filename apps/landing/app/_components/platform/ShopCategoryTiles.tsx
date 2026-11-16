import Image from "next/image";
import Link from "next/link";
import { categoryCount, categoryThumbs, SHOP_TAGS, shopHref, type ShopTag } from "@/lib/platform/shop";
import { trackSlug } from "@/lib/platform/tracks";
import type { Track } from "@/lib/platform/progress";
import "./shop.css";

const PLAIN = { q: "", tag: null, sort: "featured", afford: false } as const;

// The five shop tags (the four tracks and General) as ruled tiles: three small pictures of what is under the tag, the name and
// how many items. Each tile is a link to the tag, so the address carries the state. A tag with no items is not drawn.
export function ShopCategoryTiles() {
  const tags: ShopTag[] = SHOP_TAGS.filter((tag) => categoryCount(tag) > 0);
  return (
    <nav className="pf-shop-tiles" aria-label="Shop categories">
      <ul>
        {tags.map((tag) => {
          const count = categoryCount(tag);
          return (
            <li key={tag} data-track={tag === "General" ? undefined : trackSlug(tag as Track)} data-general={tag === "General" ? "true" : undefined}>
              <Link href={shopHref({ ...PLAIN, tag })}>
                <span className="pf-shop-tile-thumbs" aria-hidden="true">
                  {categoryThumbs(tag).map((item) => (
                    <span key={item.id} className="pf-shop-tile-thumb">
                      <Image className={item.icon ? "pf-shop-sprite" : undefined} src={item.photo} alt="" width={item.width} height={item.height} sizes="48px" unoptimized={item.icon} />
                    </span>
                  ))}
                </span>
                <span className="pf-shop-tile-name">
                  {tag === "General" ? null : <span className="pf-shop-swatch" aria-hidden="true" />}
                  {tag}
                </span>
                <span className="pf-shop-tile-count">{count} items</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
