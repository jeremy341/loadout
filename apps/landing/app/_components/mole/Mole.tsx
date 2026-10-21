"use client";

import { useEffect, useRef } from "react";
import { useDisplayPreferences } from "../display-preferences";
import { useMotionPreference } from "../motion-preference";

// The homepage mole (.ulpi/design/mole.md). This only hosts the elements; engine.ts does everything else. The layer is
// decoration: hidden from assistive technology, it lets the pointer through everywhere except on the mole itself.
export function Mole() {
  const { paused } = useMotionPreference();
  const { hideMascot } = useDisplayPreferences();
  const layer = useRef<HTMLDivElement>(null);
  const mole = useRef<HTMLDivElement>(null);
  const sprite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hideMascot) return;
    const layerEl = layer.current;
    const moleEl = mole.current;
    const spriteEl = sprite.current;
    if (!layerEl || !moleEl || !spriteEl) return;

    let disposed = false;
    let engine: import("./engine").MoleEngine | undefined;
    let idleHandle: number | undefined;
    let fallbackTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
    const idleWindow = window as Partial<Pick<Window, "requestIdleCallback" | "cancelIdleCallback">>;
    const start = () => {
      idleHandle = undefined;
      fallbackTimer = undefined;
      void import("./engine").then(({ MoleEngine }) => {
        if (disposed) return;
        engine = new MoleEngine(moleEl, spriteEl, layerEl, new URLSearchParams(window.location.search), paused);
      }).catch(() => {});
    };

    if (typeof idleWindow.requestIdleCallback === "function") idleHandle = idleWindow.requestIdleCallback(start, { timeout: 1200 });
    else fallbackTimer = globalThis.setTimeout(start, 250);

    return () => {
      disposed = true;
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (fallbackTimer !== undefined) globalThis.clearTimeout(fallbackTimer);
      engine?.destroy();
    };
  }, [paused, hideMascot]);

  if (hideMascot) return null;
  return (
    <div ref={layer} className="mole-layer" aria-hidden="true">
      <div ref={mole} className="mole">
        <div ref={sprite} className="mole-sprite" />
      </div>
    </div>
  );
}
