"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import "./explore.css";

// One Explore rail: a ruled head (heading, optional note, "See all" link, and from 900 px two arrow buttons) over a horizontal
// strip of compact cards. Scrolling is native (scroll snap); the arrows only move it by one card and are disabled at the ends.
// The strip itself is never a tab stop: the links and Save stars inside it are, so keyboard focus scrolls it into view.
// The cards arrive as children from the server.
export function ExploreRail({
  title,
  note,
  seeAllHref,
  seeAllLabel = "See all",
  children,
}: Readonly<{ title: string; note?: string; seeAllHref?: string; seeAllLabel?: string; children: ReactNode }>) {
  const headingId = useId();
  const stripId = useId();
  const strip = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  // The arrows exist only when the strip overflows; a short strip has nothing to scroll.
  const scrolls = !(edge.start && edge.end);

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
    const step = (card ? card.getBoundingClientRect().width + 16 : 216) * direction;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: step, behavior: calm ? "auto" : "smooth" });
  }

  return (
    <section className="pf-explore-rail" aria-labelledby={headingId}>
      <div className="pf-explore-rail-head">
        <div className="pf-explore-rail-title">
          <h2 id={headingId}>{title}</h2>
          {note ? <p className="pf-explore-rail-note">{note}</p> : null}
        </div>
        <div className="pf-explore-rail-tools">
          {seeAllHref ? (
            <Link href={seeAllHref} className="pf-explore-seeall">
              {seeAllLabel}
              {seeAllLabel === "See all" ? <span className="pf-sr"> {title}</span> : null}
            </Link>
          ) : null}
          {scrolls ? (
            <>
              <button type="button" className="pf-explore-arrow" aria-label={`Scroll ${title} left`} aria-controls={stripId} disabled={edge.start} onClick={() => move(-1)}>
                <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
                  <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
                </svg>
              </button>
              <button type="button" className="pf-explore-arrow" aria-label={`Scroll ${title} right`} aria-controls={stripId} disabled={edge.end} onClick={() => move(1)}>
                <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false" style={{ transform: "scaleX(-1)" }}>
                  <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      </div>
      <ul id={stripId} ref={strip} className="pf-explore-strip" onScroll={measure}>
        {children}
      </ul>
    </section>
  );
}
