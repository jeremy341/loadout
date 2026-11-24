"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui";

// The site-wide sentence about sample data, kept out of every page's header. It sits behind an info button in the top bar: one
// control, same words, opened on demand. Each page still carries its own note (DataScopeNote) beside the data it describes.
// Escape and a click outside close it; the button reports its state with aria-expanded.
export default function SampleDataInfo() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="rv-info">
      <button
        type="button"
        className="hc-btn hc-btn-ghost hc-btn-sm hc-btn-icon"
        aria-expanded={open}
        aria-controls="rv-info-panel"
        aria-label="About the data on this site"
        title="About the data on this site"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon glyph="info" size={20} />
      </button>
      {open && (
        <p id="rv-info-panel" className="reviewer-sample-note rv-info-panel">
          Each page says where its data comes from. Anything marked sample data is kept in memory and is gone when the server restarts.
        </p>
      )}
    </div>
  );
}
