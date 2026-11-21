"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import "./shop.css";

// The profile's Projects as one row that scrolls sideways instead of a grid that grows downward. Scrolling is native (scroll
// snap, touch and trackpad work as they are); the two arrows and the Left and Right arrow keys move it by one card, and an
// arrow is disabled at its end. The cards come in as children from the server, so this adds no data of its own.
export function ProjectsCarousel({ children, count }: Readonly<{ children: ReactNode; count: number }>) {
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

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowRight" ? 1 : -1);
  }

  return (
    <>
      <div className="pf-sp-head">
        <h2 id="projects-heading">
          Projects <span className="pf-sp-count">{count}</span>
        </h2>
        {count > 1 ? (
          <div className="pf-shop-rail-tools">
            <button type="button" className="pf-shop-arrow" aria-label="Scroll projects left" aria-controls={stripId} disabled={edge.start} onClick={() => move(-1)}>
              <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
                <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
              </svg>
            </button>
            <button type="button" className="pf-shop-arrow" aria-label="Scroll projects right" aria-controls={stripId} disabled={edge.end} onClick={() => move(1)}>
              <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false" style={{ transform: "scaleX(-1)" }}>
                <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
      <ul id={stripId} ref={strip} className="pf-sp-grid" aria-labelledby="projects-heading" onScroll={measure} onKeyDown={onKeyDown}>
        {children}
      </ul>
    </>
  );
}
