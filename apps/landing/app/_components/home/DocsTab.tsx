"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

// The floating Docs tab, and a toy: drag it up like a rubber band. A blue band stretches up from the floor, gets thinner
// and pulls back harder the further you go. Let go and it always snaps back first; if the pull was long enough, the Docs
// open once it has settled (.ulpi/design/pull-tab.md). It stays a plain link: a click and the keyboard work as before,
// and nothing here touches page scrolling. Only a CSS variable changes while dragging, one animation frame at a time,
// so React never re-renders during a pull.
const MAX = 130; // px the tab can be stretched in all
const TAU = 170; // how quickly the band stiffens: the bigger, the longer it stays easy to pull
const OPEN_AT = 110; // px of pull that opens the Docs
const DEAD = 6; // px a press must move before it counts as a pull and not a click
const SPRING_MS = 400; // the snap back, which the Docs wait for
const SETTLE_MS = 450; // when the spring class can be removed
const NUDGE_KEY = "loadout-docs-tab-nudged";

// How far the tab shows for a pull of `pull` px: it gives a little at first, then stiffens, and never passes MAX.
const stretch = (pull: number) => MAX * (1 - Math.exp(-pull / TAU));
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Press = { id: number; startX: number; startY: number; pulling: boolean; pull: number };

export function DocsTab() {
  const router = useRouter();
  const tab = useRef<HTMLAnchorElement>(null);
  const press = useRef<Press | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef(0);
  const timers = useRef<number[]>([]);

  const later = (callback: () => void, ms: number) => {
    timers.current.push(window.setTimeout(callback, ms));
  };
  // The band is as wide as the tab where it joins it and thins toward the floor the more it is stretched.
  const setPull = (px: number) => {
    const element = tab.current;
    if (!element) return;
    const half = element.offsetWidth / 2;
    element.style.setProperty("--pull", `${px}px`);
    element.style.setProperty("--waist", `${Math.max(3, half * (1 - 0.92 * Math.min(px / MAX, 1)))}px`);
  };
  const setPulling = (on: boolean) => {
    tab.current?.classList.toggle("is-pulling", on);
    tab.current?.closest(".home")?.classList.toggle("is-pulling", on);
  };

  const springBack = () => {
    const element = tab.current;
    if (!element) return;
    if (prefersReducedMotion()) return setPull(0);
    element.classList.add("is-springing");
    element.style.setProperty("--pull", "0px"); // the waist stays thin while the band pulls back
    later(() => element.classList.remove("is-springing"), SETTLE_MS);
  };

  // A long pull: the band snaps back first, then the Docs open.
  const open = () => {
    springBack();
    later(() => router.push("/docs"), prefersReducedMotion() ? 0 : SPRING_MS);
  };

  const onPointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    window.cancelAnimationFrame(frame.current);
    tab.current?.classList.remove("is-springing", "is-nudging");
    press.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, pulling: false, pull: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const current = press.current;
    if (!current || current.id !== event.pointerId) return;
    if (!current.pulling) {
      const moved = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
      if (moved < DEAD) return;
      current.pulling = true;
      setPulling(true);
    }
    current.pull = Math.max(0, current.startY - event.clientY);
    if (prefersReducedMotion()) return;
    window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => setPull(stretch(current.pull)));
  };

  const finish = (event: PointerEvent<HTMLAnchorElement>, cancelled: boolean) => {
    const current = press.current;
    if (!current || current.id !== event.pointerId) return;
    press.current = null;
    window.cancelAnimationFrame(frame.current);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.pulling) return; // a plain click: the link does its job
    suppressClick.current = true;
    later(() => (suppressClick.current = false), 60);
    setPulling(false);
    if (!cancelled && current.pull >= OPEN_AT) open();
    else springBack();
  };

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
  };

  // One small wiggle, once per visit, so the first visitor sees that the tab can be pulled.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    try {
      if (window.sessionStorage.getItem(NUDGE_KEY)) return;
    } catch {
      return;
    }
    later(() => {
      if (press.current) return;
      tab.current?.classList.add("is-nudging");
      try {
        window.sessionStorage.setItem(NUDGE_KEY, "1");
      } catch {
        // storage can be blocked; the nudge then simply plays on the next visit too
      }
    }, 4000);
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <Link
      ref={tab}
      className="docs-tab"
      href="/docs"
      aria-label="Open LOADOUT documentation"
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finish(event, false)}
      onPointerCancel={(event) => finish(event, true)}
      onClick={onClick}
      onAnimationEnd={(event) => event.currentTarget.classList.remove("is-nudging")}
    >
      LOADOUT DOCS
    </Link>
  );
}
