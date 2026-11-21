"use client";

import { useEffect, useRef } from "react";

// A whole number that counts up from zero once, on load. The server renders the final value; with motion off nothing moves.
export function CountUp({ value, duration = 800 }: Readonly<{ value: string; duration?: number }>) {
  const node = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = node.current;
    const target = Number(value.replace(/,/g, ""));
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motionPaused === "true";
    if (!el || calm || !/^[\d,]+$/.test(value) || !Number.isFinite(target) || target < 1) return;
    let id = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-US");
      if (t < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(id);
      el.textContent = value;
    };
  }, [value, duration]);
  return <span ref={node}>{value}</span>;
}
