"use client";

import { useEffect, useRef, useState } from "react";
import "../ruler.css";

const UNIT = 160; // px between two numbered ticks on the top ruler
const TOP_MARKS = Array.from({ length: 26 }, (_, index) => index * UNIT); // enough for a 4000px wide window
const TICK = 10; // metres between two ticks on the depth ruler
const LEVEL = 100; // metres between two depth markers ("-100 M")
const LABEL = 50; // metres between two numbers on the depth ruler
const CLEARANCE = 28; // px kept free under the top ruler

type Tick = { y: number; depth: number };

// Offset of an element from the top of `ancestor`, ignoring transforms (the reveal animation moves sections).
function offsetWithin(element: HTMLElement, ancestor: HTMLElement) {
  let y = 0;
  let current: HTMLElement | null = element;
  while (current && current !== ancestor) {
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return y;
}

function kindOf(depth: number) {
  if (depth % LEVEL === 0) return "rl-major";
  return depth % LABEL === 0 ? "rl-half" : "rl-ten";
}

function label(depth: number) {
  if (depth === 0) return "0";
  return (depth > 0 ? "\u2212" : "+") + Math.abs(depth);
}

// Ticks every 10 m. Each depth marker ("-100 M" strip) is exactly its depth, so the number beside it
// matches the strip; between two markers the ticks are spread evenly, above the first they count up
// (+) and below the last they keep the last spacing to the end of the page.
function depthTicks(markers: number[], total: number) {
  const ticks: Tick[] = [];
  const add = (y: number, depth: number) => {
    if (y >= CLEARANCE && y <= total - 8) ticks.push({ y: Math.round(y), depth });
  };
  const steps = LEVEL / TICK;
  const gap = (from: number, to: number) => (to - from) / steps;
  const first = gap(markers[0], markers[1]);
  for (let n = 1; markers[0] - n * first >= CLEARANCE; n++) add(markers[0] - n * first, -n * TICK);
  for (let level = 0; level < markers.length - 1; level++) {
    const step = gap(markers[level], markers[level + 1]);
    for (let n = 0; n < steps; n++) add(markers[level] + n * step, level * LEVEL + n * TICK);
  }
  const last = markers.length - 1;
  const tail = gap(markers[last - 1], markers[last]);
  for (let n = 0; markers[last] + n * tail <= total; n++) add(markers[last] + n * tail, last * LEVEL + n * TICK);
  return ticks;
}

// Rulers like the edge of a technical drawing. The top one is in pixels (a tick every 32px, a number
// every 160px). The one down the left side is the depth of the page in metres, pinned to the depth
// markers so that beside the "-500 M" strip it reads -500.
export function SheetRuler() {
  const side = useRef<HTMLDivElement>(null);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const parent = side.current?.parentElement;
    if (!parent) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const markers = Array.from(parent.querySelectorAll<HTMLElement>(".pit")).map((pit) => offsetWithin(pit, parent) + pit.offsetHeight / 2);
      setHeight(parent.clientHeight);
      setTicks(markers.length > 1 ? depthTicks(markers, parent.clientHeight) : []);
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

  return (
    <>
      <div className="tick rl-top" aria-hidden="true">
        {TOP_MARKS.map((x) => (
          <span key={x} style={{ left: x }}>{x}</span>
        ))}
      </div>
      <div ref={side} className="rl-side" style={height ? { height } : undefined} aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick.depth} className={kindOf(tick.depth)} style={{ top: tick.y }}>
            {tick.depth % LABEL === 0 ? label(tick.depth) : null}
          </span>
        ))}
      </div>
    </>
  );
}
