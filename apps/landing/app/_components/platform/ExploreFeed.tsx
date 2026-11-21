"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { feedUrl } from "@/lib/platform/explore";
import type { FeedCard } from "@/lib/platform/explore-feed";
import { ExploreCard } from "./ExploreCard";
import "./explore.css";

// The Explore grid with infinite scroll. The server renders the whole first page into this component (so the grid is in the HTML,
// no script needed) and a "Load more" link to the next page (?cursor=). With script the link becomes a button, and an
// IntersectionObserver presses it as the end of the grid nears, unless the person prefers reduced motion (then the button is the
// only way: nothing loads or moves on its own). Each press fetches the next 21 cards from /platform-explore.
//
// Props: the first page of cards, the cursor of the next page (null at the end), the filter (to build the fetch address), the total
// and the server-built links for the script-free path.
type Props = {
  initial: FeedCard[];
  next: string | null;
  total: number;
  // How many projects come before this first page (a ?cursor= page).
  offset: number;
  filter: { q: string; track: string | null; saved: boolean };
  nextHref: string | null;
  prevHref: string | null;
};

const subscribeNever = () => () => {};

export function ExploreFeed({ initial, next, total, offset, filter, nextHref, prevHref }: Readonly<Props>) {
  const [cards, setCards] = useState(initial);
  const [cursor, setCursor] = useState(next);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // false in the server HTML and during hydration (the script-free link shows), true once the page is live.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const busy = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (busy.current || cursor === null) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(feedUrl(filter, cursor), { headers: { Accept: "application/json" } });
      if (response.status === 429) throw new Error("Loading too fast. Wait a moment and press Load more.");
      if (!response.ok) throw new Error("Could not load more projects. Try again.");
      const body = (await response.json()) as { cards: FeedCard[]; next: string | null };
      setCards((current) => {
        const seen = new Set(current.map((card) => card.id));
        return [...current, ...body.cards.filter((card) => !seen.has(card.id))];
      });
      setCursor(body.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more projects. Try again.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [cursor, filter]);

  // Press Load more as the end of the grid comes near. Not with reduced motion, and not while an error is showing (a retry is a press).
  useEffect(() => {
    const node = sentinel.current;
    if (!hydrated || !node || cursor === null || error !== "") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: "320px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hydrated, cursor, error, loadMore, cards.length]);

  return (
    <div className="pf-explore-feed">
      <ul className="pf-explore-grid">
        {cards.map((card) => (
          <li key={card.id}>
            <ExploreCard card={card} />
          </li>
        ))}
      </ul>

      <div className="pf-explore-more" ref={sentinel}>
        <p className="pf-explore-shown" role="status">
          {cursor === null && offset === 0 ? `All ${total} ${total === 1 ? "project" : "projects"} shown.` : `${offset + cards.length} of ${total} projects shown.`}
        </p>
        {error !== "" ? <p className="pf-explore-more-error" role="alert">{error}</p> : null}
        {cursor !== null ? (
          hydrated ? (
            <button type="button" className="pf-btn pf-explore-more-btn" onClick={() => void loadMore()} aria-disabled={loading ? true : undefined}>
              {loading ? "Loading" : error !== "" ? "Try again" : "Load more"}
            </button>
          ) : nextHref ? (
            <Link className="pf-btn pf-explore-more-btn" href={nextHref} rel="next">Load more</Link>
          ) : null
        ) : null}
        {prevHref ? <Link className="pf-explore-prev" href={prevHref} rel="prev">Earlier projects</Link> : null}
      </div>
    </div>
  );
}
