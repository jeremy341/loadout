"use client";

import { useEffect, useRef } from "react";
import { useDisplayPreferences } from "../display-preferences";
import { useMotionPreference } from "../motion-preference";

// Decorative ASCII drawing with a cursor "flashlight", as on the Stasis homepage:
// a faint base layer plus a brighter copy revealed by a radial mask that follows the pointer.
// The pointer position goes into CSS variables, so moving the mouse never re-renders React.
export function AsciiField({ html, side = "right", top }: { html: string; side?: "left" | "right"; top?: string }) {
  const { paused } = useMotionPreference();
  const { hideAscii } = useDisplayPreferences();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    if (paused || hideAscii) return;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = field.getBoundingClientRect();
        field.style.setProperty("--mx", `${pointerX - rect.left}px`);
        field.style.setProperty("--my", `${pointerY - rect.top}px`);
      });
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, [paused, hideAscii]);

  if (hideAscii) return null;

  return (
    <div ref={ref} className={`ar ar-${side}`} style={top ? { top } : undefined} aria-hidden="true">
      <pre className="ar-base" dangerouslySetInnerHTML={{ __html: html }} />
      <pre className="ar-lit" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
