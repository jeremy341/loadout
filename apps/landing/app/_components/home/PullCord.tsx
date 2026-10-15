"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, usePull } from "./usePull";

// The pull cord at the very bottom of the page, and the hidden level it opens (.ulpi/design/pull-cord.md). A ring sits on
// the floor of the footer. Pull it up like a rubber band, the same gesture as the Docs tab, and a dark panel opens below:
// -1404 M, the depth of the 404 page. It is also an ordinary button: a click, Enter or Space opens and closes the panel,
// so nobody has to drag.

// The ring, drawn on a 16 by 15 grid like the sprites. Each "#" is one square.
const RING = [
  "....########....",
  "..############..",
  ".####......####.",
  ".###........###.",
  "####........####",
  "###..........###",
  "###..........###",
  "###..........###",
  "###..........###",
  "###..........###",
  "####........####",
  ".###........###.",
  ".####......####.",
  "..############..",
  "....########....",
];
const SQUARES = RING.flatMap((row, y) => [...row].flatMap((cell, x) => (cell === "#" ? [{ x, y }] : [])));

export function PullCord() {
  const [open, setOpen] = useState(false);
  const ring = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const pull = usePull(ring, () => setOpen(true));

  // Whenever the panel opens, bring it into view and move focus to its heading so a screen reader announces it.
  useEffect(() => {
    if (!open) return;
    title.current?.focus({ preventScroll: true });
    title.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  }, [open]);

  const backToSurface = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  return (
    <>
      <div className="cord">
        <p className="cord-ground" aria-hidden="true">
          <span>Sohle</span> <span>−1404 M</span>
        </p>
        <button
          ref={ring}
          type="button"
          className="cord-ring"
          aria-label="Dig deeper, minus 1404 meters"
          aria-expanded={open}
          aria-controls="sohle"
          {...pull.handlers}
          onClick={(event) => {
            pull.handlers.onClick(event);
            if (!event.defaultPrevented) setOpen((value) => !value);
          }}
        >
          <svg viewBox="0 0 16 15" aria-hidden="true" shapeRendering="crispEdges" focusable="false">
            {SQUARES.map(({ x, y }) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
            ))}
          </svg>
        </button>
      </div>
      <section id="sohle" className="sohle" aria-labelledby="sohle-title" hidden={!open}>
        <p className="sohle-tag" aria-hidden="true">SOHLE · −1404 M</p>
        <h2 id="sohle-title" ref={title} tabIndex={-1} className="sohle-title">You found the bottom.</h2>
        <p className="sohle-text">The only way back is up.</p>
        <button type="button" className="btn pri sohle-btn" onClick={backToSurface}>
          BACK TO THE SURFACE
        </button>
      </section>
    </>
  );
}
