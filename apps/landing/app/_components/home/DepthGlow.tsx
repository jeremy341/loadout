"use client";

import { useEffect } from "react";
import { useMotionPreference } from "../motion-preference";
import { useDisplayPreferences } from "../display-preferences";

// The section dividers: the hatching, the depth numeral and the label are faint until the pointer passes near
// them, then light around the pointer, as the footer wordmark does. Deeper markers light more strongly: each
// marker gets --depth-light from its numeral, 40% of the glow at the shallowest and 100% at the deepest. The
// glow runs only on devices with a fine pointer. Positions go into CSS variables, so moving the mouse never
// re-renders React. Touch screens see the faint markers only.
export function DepthGlow() {
  const { paused } = useMotionPreference();
  const { hideMarkings } = useDisplayPreferences();
  useEffect(() => {
    const pits = Array.from(document.querySelectorAll<HTMLElement>(".home .pit"));
    const depths = pits.map((pit) => Number(pit.querySelector("b")?.textContent?.replace(/\D/g, "") ?? 0));
    const deepest = Math.max(1, ...depths);
    pits.forEach((pit, index) => pit.style.setProperty("--depth-light", String(0.4 + 0.6 * (depths[index] / deepest))));

    if (paused || hideMarkings) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onPointerMove = (event: PointerEvent) => {
      const numerals = Array.from(document.querySelectorAll<HTMLElement>(".home .pit, .home .pit b, .home .pit > span"));
      const boxes = numerals.map((numeral) => numeral.getBoundingClientRect());
      numerals.forEach((numeral, index) => {
        numeral.style.setProperty("--mx", `${event.clientX - boxes[index].left}px`);
        numeral.style.setProperty("--my", `${event.clientY - boxes[index].top}px`);
      });
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.querySelectorAll<HTMLElement>(".home .pit, .home .pit b, .home .pit > span").forEach((node) => {
        node.style.removeProperty("--mx");
        node.style.removeProperty("--my");
      });
    };
  }, [paused, hideMarkings]);

  return null;
}
