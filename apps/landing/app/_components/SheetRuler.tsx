"use client";

import { useEffect, useRef, useState } from "react";
import "../ruler.css";

const UNIT = 160; // px between two numbered ticks on the top ruler
const TOP_MARKS = Array.from({ length: 26 }, (_, index) => index * UNIT); // enough for a 4000px wide window
const TICK = 10; // metres between two ticks on the depth ruler
const LEVEL = 100; // metres between two depth markers ("-100 M")
const LABEL = 50; // metres between two numbers on the depth ruler
const CLEARANCE = 28; // px kept free under the top ruler

const DEPTH_STOPS = [
  { id: "top", name: "Surface" },
  { id: "tracks", name: "Tracks" },
  { id: "process", name: "Build loop" },
  { id: "project-fit", name: "Project fit" },
  { id: "progression", name: "Levels" },
  { id: "shop", name: "Prizes" },
  { id: "custom-orders", name: "Custom orders" },
  { id: "eras", name: "Eras" },
  { id: "loadout-irl", name: "IRL" },
  { id: "faq", name: "FAQ" },
  { id: "behind-loadout", name: "Team" },
];
type DepthStop = (typeof DEPTH_STOPS)[number] & { depth: string };

type Tick = { y: number; depth: number };
type Marker = { y: number; depth: number };

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
function depthTicks(markers: Marker[], total: number) {
  const ticks: Tick[] = [];
  const add = (y: number, depth: number) => {
    if (y >= CLEARANCE && y <= total - 8) ticks.push({ y: Math.round(y), depth });
  };
  const stepsBetween = (from: Marker, to: Marker) => Math.max(1, Math.round((to.depth - from.depth) / TICK));
  const firstSteps = stepsBetween(markers[0], markers[1]);
  const first = (markers[1].y - markers[0].y) / firstSteps;
  for (let n = 1; markers[0].y - n * first >= CLEARANCE; n++) add(markers[0].y - n * first, markers[0].depth - n * TICK);
  for (let level = 0; level < markers.length - 1; level++) {
    const from = markers[level];
    const to = markers[level + 1];
    const steps = stepsBetween(from, to);
    for (let n = 0; n < steps; n++) {
      add(from.y + (to.y - from.y) * n / steps, from.depth + n * TICK);
    }
  }
  const last = markers.length - 1;
  const lastSteps = stepsBetween(markers[last - 1], markers[last]);
  const tail = (markers[last].y - markers[last - 1].y) / lastSteps;
  for (let n = 0; markers[last].y + n * tail <= total; n++) add(markers[last].y + n * tail, markers[last].depth + n * TICK);
  return ticks;
}

// Rulers like the edge of a technical drawing. The top one is in pixels (a tick every 32px, a number
// every 160px). The one down the left side is the depth of the page in metres, pinned to the depth
// markers so that beside the "-500 M" strip it reads -500.
export function SheetRuler() {
  const side = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const pendingNavigation = useRef<{ id: string; direction: number } | null>(null);
  const previousScrollY = useRef(0);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [height, setHeight] = useState(0);
  const [active, setActive] = useState("top");
  const [stops, setStops] = useState<DepthStop[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const parent = side.current?.parentElement;
    if (!parent) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const markers = Array.from(parent.querySelectorAll<HTMLElement>(".pit")).flatMap((pit) => {
        const raw = pit.querySelector("b")?.textContent?.trim();
        const value = raw?.match(/\d+/)?.[0];
        if (!value) return [];
        return [{ y: offsetWithin(pit, parent) + pit.offsetHeight / 2, depth: Number(value) }];
      });
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

  useEffect(() => {
    const available = DEPTH_STOPS.flatMap((stop) => {
      const target = document.getElementById(stop.id);
      if (!target) return [];
      if (stop.id === "top") return [{ ...stop, depth: "SURFACE" }];
      const marker = target.previousElementSibling;
      const depth = marker?.matches(".pit")
        ? marker.querySelector("b")?.textContent?.replace(/\s*M\s*$/i, "").trim()
        : undefined;
      return depth ? [{ ...stop, depth }] : [];
    });
    const stopsFrame = requestAnimationFrame(() => setStops(available));
    previousScrollY.current = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      const delta = scrollY - previousScrollY.current;
      previousScrollY.current = scrollY;
      const readingLine = Math.min(200, window.innerHeight * 0.3);
      let current = available.filter(({ id }) => document.getElementById(id)!.getBoundingClientRect().top <= readingLine).at(-1)?.id ?? available[0]?.id ?? "top";
      const pending = pendingNavigation.current;
      if (pending && delta && Math.sign(delta) !== pending.direction) pendingNavigation.current = null;
      else if (pending) {
        const destination = document.getElementById(pending.id);
        if (destination && destination.getBoundingClientRect().top <= readingLine) pendingNavigation.current = null;
        else current = pending.id;
      }
      if (scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = available.at(-1)?.id ?? current;
      setActive((previous) => previous === current ? previous : current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(stopsFrame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeFromPointer = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest(".depth-nav")) setOpen(false);
    };
    document.addEventListener("pointerdown", closeFromPointer, { passive: true });
    return () => document.removeEventListener("pointerdown", closeFromPointer);
  }, [open]);

  const closeIfOutside = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  };

  const chooseStop = (_event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    setOpen(false);
    const target = document.getElementById(id);
    const targetY = target ? target.getBoundingClientRect().top + window.scrollY : window.scrollY;
    pendingNavigation.current = { id, direction: Math.sign(targetY - window.scrollY) };
    setActive(id);
    const heading = target?.querySelector<HTMLElement>("h1, h2");
    if (heading) {
      heading.tabIndex = -1;
      requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    }
  };
  const currentStop = stops.find(({ id }) => id === active) ?? stops[0];

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
      <nav className={`depth-nav${open ? " is-open" : ""}`} aria-label="Page depth" onBlur={closeIfOutside} onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          toggle.current?.focus();
        }
      }}>
        <button ref={toggle} className="depth-nav-toggle" type="button" aria-label={`Page depth navigation, current ${currentStop?.name ?? "Surface"}${currentStop && currentStop.id !== "top" ? ` ${currentStop.depth}` : ""}`} aria-expanded={open} aria-controls="depth-nav-list" onClick={() => setOpen((value) => !value)}>
          <span aria-hidden="true">⌖</span>{currentStop?.id !== "top" && <span className="depth-nav-current-depth">{currentStop?.depth}</span>}<span className="depth-nav-current-name">{currentStop?.name ?? "Surface"}</span><span className="depth-nav-caret" aria-hidden="true">{open ? "▴" : "▾"}</span>
        </button>
        <ol className="depth-nav-list" id="depth-nav-list" data-lenis-prevent>
          {stops.map(({ id, depth, name }) => (
            <li key={id}>
              <a href={`#${id}`} aria-current={active === id ? "location" : undefined} onClick={(event) => chooseStop(event, id)}>
                <span className="depth-nav-metre">{id === "top" ? "↑" : depth}</span><span>{name}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
