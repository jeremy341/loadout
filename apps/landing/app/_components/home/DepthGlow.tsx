"use client";

import { useEffect } from "react";

// The section dividers: the hatching, the depth numeral and the label are faint until the pointer
// passes near them, then light around the pointer, as the footer wordmark does. Positions go into CSS variables, so moving the
// mouse never re-renders React. Touch visitors see the faint numerals only.
export function DepthGlow() {
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const numerals = Array.from(document.querySelectorAll<HTMLElement>(".home .pit, .home .pit b, .home .pit > span"));
      const boxes = numerals.map((numeral) => numeral.getBoundingClientRect());
      numerals.forEach((numeral, index) => {
        numeral.style.setProperty("--mx", `${event.clientX - boxes[index].left}px`);
        numeral.style.setProperty("--my", `${event.clientY - boxes[index].top}px`);
      });
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  return null;
}
