"use client";

import { useEffect, useRef, useState } from "react";
import "../ruler.css";

const UNIT = 160; // px between two numbered ticks
const MAJOR = 800; // px between two heavy ticks on the side rulers
const TOP_MARKS = Array.from({ length: 26 }, (_, index) => index * UNIT); // enough for a 4000px wide window

// Rulers like the ones on the edge of a technical drawing, measured in pixels: a tick every 32px
// and a number every 160px along the top and down the left side. The ticks are CSS gradients; only
// the side numbers need the page height.
export function SheetRuler() {
  const side = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const parent = side.current?.parentElement;
    if (!parent) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setHeight(parent.clientHeight);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(parent);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const marks = Array.from({ length: Math.max(0, Math.floor(height / UNIT)) }, (_, index) => (index + 1) * UNIT);
  const numbers = marks.map((y) => (
    <span key={y} className={y % MAJOR === 0 ? "rl-major" : undefined} style={{ top: y }}>
      {"-" + y}
    </span>
  ));

  return (
    <>
      <div className="tick rl-top" aria-hidden="true">
        {TOP_MARKS.map((x) => (
          <span key={x} style={{ left: x }}>{x}</span>
        ))}
      </div>
      <div ref={side} className="rl-side" style={height ? { height } : undefined} aria-hidden="true">
        {numbers}
      </div>
    </>
  );
}
