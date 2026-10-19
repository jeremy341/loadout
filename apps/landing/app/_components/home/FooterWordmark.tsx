"use client";

import { useEffect, useRef } from "react";
import { useMotionPreference } from "../motion-preference";
import { useDisplayPreferences } from "../display-preferences";

// The LOADOUT wordmark across the foot of the page: a faint base layer plus a brighter copy
// revealed by a radial mask that follows the pointer. The pointer goes into CSS variables, so
// moving the mouse never re-renders React. Touch visitors see the faint base only.
export function FooterWordmark() {
  const { paused } = useMotionPreference();
  const { hideMarkings } = useDisplayPreferences();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mark = ref.current;
    if (!mark) return;
    if (paused || hideMarkings) return;
    const onPointerMove = (event: PointerEvent) => {
      const rect = mark.getBoundingClientRect();
      mark.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      mark.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      mark.style.removeProperty("--mx");
      mark.style.removeProperty("--my");
    };
  }, [paused, hideMarkings]);

  if (hideMarkings) return null;

  return (
    <div ref={ref} className="ft-mark" aria-hidden="true">
      <span className="ft-mark-base">LOADOUT</span>
      <span className="ft-mark-lit">LOADOUT</span>
    </div>
  );
}
