"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import "./shop.css";

// A horizontal strip of cards with a ruled head: the heading, an optional "See all" link and, from 900 px, arrow buttons.
// Scrolling is native (scroll snap), the arrows only move it by one card, and an arrow is disabled at its end. The cards come in
// as children from the server, so the strip adds no data of its own.
export function ShopRail({
  title,
  seeAllHref,
  count,
  children,
}: Readonly<{ title: string; seeAllHref?: string; count?: number; children: ReactNode }>) {
  const headingId = useId();
  const stripId = useId();
  const strip = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const node = strip.current;
    if (!node) return;
    setEdge({ start: node.scrollLeft <= 2, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function move(direction: 1 | -1) {
    const node = strip.current;
    if (!node) return;
    const card = node.querySelector("li");
    const step = (card ? card.getBoundingClientRect().width + 16 : 240) * direction;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: step, behavior: calm ? "auto" : "smooth" });
  }

  return (
    <section className="pf-shop-rail" aria-labelledby={headingId}>
      <div className="pf-shop-rail-head">
        <h2 id={headingId}>{title}</h2>
        <div className="pf-shop-rail-tools">
          {seeAllHref ? (
            <Link href={seeAllHref} className="pf-shop-seeall">
              See all{typeof count === "number" ? ` ${count}` : ""}
              <span className="pf-sr"> {title}</span>
            </Link>
          ) : null}
          <button type="button" className="pf-shop-arrow" aria-label={`Scroll ${title} left`} aria-controls={stripId} disabled={edge.start} onClick={() => move(-1)}>
            <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
              <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
            </svg>
          </button>
          <button type="button" className="pf-shop-arrow" aria-label={`Scroll ${title} right`} aria-controls={stripId} disabled={edge.end} onClick={() => move(1)}>
            <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false" style={{ transform: "scaleX(-1)" }}>
              <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
            </svg>
          </button>
        </div>
      </div>
      <ul id={stripId} ref={strip} className="pf-shop-strip" onScroll={measure}>
        {children}
      </ul>
    </section>
  );
}
