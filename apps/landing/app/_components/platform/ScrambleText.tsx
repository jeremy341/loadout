"use client";

import { useEffect, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=";

function motionAllowed() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return document.documentElement.dataset.motionPaused !== "true";
}

// A title that decodes itself: every letter flickers through random characters, then locks left to right. It runs once on load and
// again when a mouse pointer enters it. The real text is always in the page for screen readers (a visually hidden copy; aria-label is not allowed on a plain span) and is what the
// server renders, so with motion off, or before the script runs, nothing is scrambled.
export function ScrambleText({ text, duration = 650, className }: Readonly<{ text: string; duration?: number; className?: string }>) {
  const node = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);

  const run = useRef((ms: number) => {
    const el = node.current;
    if (!el || !motionAllowed()) return;
    cancelAnimationFrame(frame.current);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const locked = Math.floor(t * text.length * 1.15);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        out += i < locked || !/[A-Za-z0-9]/.test(c) ? c : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = t >= 1 ? text : out;
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  });

  useEffect(() => {
    const go = run.current;
    go(duration);
    return () => cancelAnimationFrame(frame.current);
  }, [duration]);

  return (
    <span
      className={className}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") run.current(420);
      }}
    >
      <span ref={node} aria-hidden="true">{text}</span>
      <span className="pf-sr">{text}</span>
    </span>
  );
}
