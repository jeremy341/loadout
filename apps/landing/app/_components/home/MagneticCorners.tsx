"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMotionPreference } from "../motion-preference";

const ACTIVATE = 40; // px from the button where the corners wake up
const RELEASE = 48; // px where they let go again, a little wider so they do not flicker
const PULL = 0.04; // how far the corners follow the pointer, as a share of its offset
const MAX_LEAN = 4; // px the corners can lean in any direction
const lean = (offset: number) => Math.max(-MAX_LEAN, Math.min(MAX_LEAN, offset * PULL));

// Four corner brackets around a button. When a mouse comes within 40px they open up, brighten,
// and lean toward the pointer. The pointer position goes into CSS variables, so moving the
// mouse never re-renders React. Touch input and reduced motion get the static brackets only.
export function MagneticCorners({ children }: { children: ReactNode }) {
  const { paused } = useMotionPreference();
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    element.removeAttribute("data-active");
    element.style.setProperty("--mc-x", "0px");
    element.style.setProperty("--mc-y", "0px");
    if (paused) return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches) return;

    let active = false;
    let frame = 0;
    let x = 0;
    let y = 0;

    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const nearX = Math.max(rect.left, Math.min(x, rect.right));
      const nearY = Math.max(rect.top, Math.min(y, rect.bottom));
      const distance = Math.hypot(x - nearX, y - nearY);
      const next = distance <= (active ? RELEASE : ACTIVATE);
      if (next !== active) {
        active = next;
        element.toggleAttribute("data-active", active);
      }
      const pull = active && !reduceMotion.matches;
      element.style.setProperty("--mc-x", pull ? `${lean(x - (rect.left + rect.width / 2))}px` : "0px");
      element.style.setProperty("--mc-y", pull ? `${lean(y - (rect.top + rect.height / 2))}px` : "0px");
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onLeave = () => {
      x = -9999;
      y = -9999;
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [paused]);

  return (
    <span ref={box} className="mc">
      {children}
      <span className="mc-c mc-tl" aria-hidden="true" />
      <span className="mc-c mc-tr" aria-hidden="true" />
      <span className="mc-c mc-bl" aria-hidden="true" />
      <span className="mc-c mc-br" aria-hidden="true" />
    </span>
  );
}
