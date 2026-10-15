"use client";

import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from "react";

// The pull gesture shared by the Docs tab and the pull cord (.ulpi/design/pull-tab.md, .ulpi/design/pull-cord.md): drag an
// element up like a rubber band. It stretches with more and more resistance and its band gets thinner. Let go and it always
// snaps back first; if the pull was long enough, `onLongPull` is called once it has settled. A press that barely moves stays
// a click. Only two CSS variables change while dragging, one animation frame at a time, so React never re-renders during a pull.
export const MAX = 130; // px the element can be stretched in all
const TAU = 170; // how quickly the band stiffens: the bigger, the longer it stays easy to pull
export const OPEN_AT = 110; // px of pull that counts as a long pull
const DEAD = 6; // px a press must move before it counts as a pull and not a click
export const SPRING_MS = 400; // the snap back, which a long pull waits for
const SETTLE_MS = 450; // when the spring class can be removed

// How far the element shows for a pull of `pull` px: it gives a little at first, then stiffens, and never passes MAX.
export const stretch = (pull: number) => MAX * (1 - Math.exp(-pull / TAU));
export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Press = { id: number; startX: number; startY: number; pulling: boolean; pull: number };

export function usePull<T extends HTMLElement>(ref: RefObject<T | null>, onLongPull: () => void) {
  const press = useRef<Press | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef(0);
  const timers = useRef<number[]>([]);
  const callback = useRef(onLongPull);

  useEffect(() => {
    callback.current = onLongPull;
  });
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      window.cancelAnimationFrame(frame.current);
    };
  }, []);

  const later = (task: () => void, ms: number) => {
    timers.current.push(window.setTimeout(task, ms));
  };
  // The band is as wide as the element where it joins it and thins toward the floor the more it is stretched.
  const setPull = (px: number) => {
    const element = ref.current;
    if (!element) return;
    const half = element.offsetWidth / 2;
    element.style.setProperty("--pull", `${px}px`);
    element.style.setProperty("--waist", `${Math.max(3, half * (1 - 0.92 * Math.min(px / MAX, 1)))}px`);
  };
  const setPulling = (on: boolean) => {
    ref.current?.classList.toggle("is-pulling", on);
    ref.current?.closest(".home")?.classList.toggle("is-pulling", on);
  };

  const springBack = () => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion()) return setPull(0);
    element.classList.add("is-springing");
    element.style.setProperty("--pull", "0px"); // the waist stays thin while the band pulls back
    later(() => element.classList.remove("is-springing"), SETTLE_MS);
  };

  const onPointerDown = (event: PointerEvent<T>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    window.cancelAnimationFrame(frame.current);
    ref.current?.classList.remove("is-springing", "is-nudging");
    press.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, pulling: false, pull: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<T>) => {
    const current = press.current;
    if (!current || current.id !== event.pointerId) return;
    if (!current.pulling) {
      if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < DEAD) return;
      current.pulling = true;
      setPulling(true);
    }
    current.pull = Math.max(0, current.startY - event.clientY);
    if (prefersReducedMotion()) return;
    window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => setPull(stretch(current.pull)));
  };

  const finish = (event: PointerEvent<T>, cancelled: boolean) => {
    const current = press.current;
    if (!current || current.id !== event.pointerId) return;
    press.current = null;
    window.cancelAnimationFrame(frame.current);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.pulling) return; // a plain click: the element does its own job
    suppressClick.current = true;
    later(() => (suppressClick.current = false), 60);
    setPulling(false);
    springBack(); // always snap back first
    if (!cancelled && current.pull >= OPEN_AT) later(() => callback.current(), prefersReducedMotion() ? 0 : SPRING_MS);
  };

  const isPulling = useCallback(() => press.current !== null, []);

  // The click that follows a pull is cancelled, so a pull never also counts as a click.
  const onClick = (event: MouseEvent<T>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
  };

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<T>) => finish(event, false),
      onPointerCancel: (event: PointerEvent<T>) => finish(event, true),
      onClick,
    },
    isPulling,
  };
}
