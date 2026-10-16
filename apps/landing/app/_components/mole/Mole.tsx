"use client";

import { useEffect, useRef } from "react";
import { MoleEngine } from "./engine";

// The homepage mole (.ulpi/design/mole.md). This only hosts the elements; engine.ts does everything else. The layer is
// decoration: hidden from assistive technology, it lets the pointer through everywhere except on the mole itself.
export function Mole() {
  const layer = useRef<HTMLDivElement>(null);
  const mole = useRef<HTMLDivElement>(null);
  const sprite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layer.current || !mole.current || !sprite.current) return;
    const engine = new MoleEngine(mole.current, sprite.current, layer.current, new URLSearchParams(window.location.search));
    return () => engine.destroy();
  }, []);

  return (
    <div ref={layer} className="mole-layer" aria-hidden="true">
      <div ref={mole} className="mole">
        <div ref={sprite} className="mole-sprite" />
      </div>
    </div>
  );
}
