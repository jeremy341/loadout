"use client";

import { useEffect, useRef } from "react";
import { useDisplayPreferences } from "../display-preferences";
import { useMotionPreference } from "../motion-preference";
import { MoleEngine } from "./engine";

// The homepage mole (.ulpi/design/mole.md). This only hosts the elements; engine.ts does everything else. The layer is
// decoration: hidden from assistive technology, it lets the pointer through everywhere except on the mole itself.
export function Mole() {
  const { paused } = useMotionPreference();
  const { simplifyDecoration } = useDisplayPreferences();
  const layer = useRef<HTMLDivElement>(null);
  const mole = useRef<HTMLDivElement>(null);
  const sprite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (simplifyDecoration) return;
    const layerEl = layer.current;
    const moleEl = mole.current;
    const spriteEl = sprite.current;
    if (!layerEl) return;
    if (!moleEl) return;
    if (!spriteEl) return;
    const engine = new MoleEngine(moleEl, spriteEl, layerEl, new URLSearchParams(window.location.search), paused);
    return () => engine.destroy();
  }, [paused, simplifyDecoration]);

  if (simplifyDecoration) return null;
  return (
    <div ref={layer} className="mole-layer" aria-hidden="true">
      <div ref={mole} className="mole">
        <div ref={sprite} className="mole-sprite" />
      </div>
    </div>
  );
}
