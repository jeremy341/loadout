"use client";

import { useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 250;
const GAP = 8;

interface Tip {
  text: string;
  x: number;
  y: number;
  below: boolean;
}

// The dashboard's tooltip. Mounted once in the layout: it turns every
// title="..." in the page into a styled tooltip instead of the browser's, so
// pages keep writing a plain title attribute. The text moves to data-tip the
// first time an element is hovered or focused, which is what stops the native
// tooltip from showing as well.
export default function Tooltips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const target = useRef<Element | null>(null);

  useEffect(() => {
    function clear() {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      target.current = null;
      setTip(null);
    }

    function show(el: Element) {
      const text = el.getAttribute("data-tip");
      if (!text || !el.isConnected) return;
      const r = el.getBoundingClientRect();
      const below = r.top < 72;
      setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + GAP : r.top - GAP, below });
    }

    function enter(e: Event) {
      const el = (e.target as Element | null)?.closest?.("[title], [data-tip]");
      if (!el || el === target.current) return;
      const title = el.getAttribute("title");
      if (title) {
        el.setAttribute("data-tip", title);
        el.removeAttribute("title");
        // Keep the name screen readers got from the title.
        if (!el.getAttribute("aria-label") && !el.textContent?.trim()) el.setAttribute("aria-label", title);
      }
      if (timer.current) window.clearTimeout(timer.current);
      setTip(null);
      target.current = el;
      timer.current = window.setTimeout(() => show(el), SHOW_DELAY_MS);
    }

    function leave(e: Event) {
      const el = target.current;
      if (!el) return;
      const to = (e as MouseEvent).relatedTarget as Node | null;
      if (to && el.contains(to)) return;
      clear();
    }

    document.addEventListener("mouseover", enter);
    document.addEventListener("mouseout", leave);
    document.addEventListener("focusin", enter);
    document.addEventListener("focusout", clear);
    document.addEventListener("mousedown", clear);
    document.addEventListener("keydown", clear);
    window.addEventListener("scroll", clear, true);
    return () => {
      document.removeEventListener("mouseover", enter);
      document.removeEventListener("mouseout", leave);
      document.removeEventListener("focusin", enter);
      document.removeEventListener("focusout", clear);
      document.removeEventListener("mousedown", clear);
      document.removeEventListener("keydown", clear);
      window.removeEventListener("scroll", clear, true);
      clear();
    };
  }, []);

  // Once it has a size, keep it inside the viewport.
  useEffect(() => {
    const el = box.current;
    if (!el || !tip) return;
    const half = el.offsetWidth / 2;
    const x = Math.min(Math.max(tip.x, half + GAP), window.innerWidth - half - GAP);
    el.style.left = `${x}px`;
  }, [tip]);

  if (!tip) return null;
  return (
    <div
      ref={box}
      role="tooltip"
      className="hc-tooltip"
      data-below={tip.below ? true : undefined}
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.text}
    </div>
  );
}
