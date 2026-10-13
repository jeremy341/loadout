"use client";

import { useEffect, useRef } from "react";

const FALL_MS = 1800;

const label = (depth: number) => `−${depth} M`;

// The big depth numeral of the 404 and cave-in pages. The server renders the final depth ("−1404 M"). In the
// browser it falls from −0 M to that depth, speeding up like a stone, then lands: data-falling holds while it counts
// and data-landed is set at the end (rock-bottom.css fades the numeral back into the rock and gives it one thud).
// It writes straight into the text node, so React never re-renders while it counts. Reduced motion lands at once.
export function DepthNumeral({ depth }: { depth: number }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    const text = element?.firstChild;
    if (!element || !text) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.dataset.landed = "";
      return;
    }
    let frame = 0;
    let start = 0;
    const step = (now: number) => {
      start ||= now;
      const progress = Math.min(1, (now - start) / FALL_MS);
      text.nodeValue = label(Math.round(depth * progress ** 2.4));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        delete element.dataset.falling;
        element.dataset.landed = "";
      }
    };
    // The first frame runs after DepthGlow has read the final depth from the markup.
    element.dataset.falling = "";
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      text.nodeValue = label(depth);
      delete element.dataset.falling;
    };
  }, [depth]);

  return <b ref={ref} className="rb-num">{label(depth)}</b>;
}
