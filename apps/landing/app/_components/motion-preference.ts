"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let reduced = false;
let stopListening: (() => void) | undefined;
const snapshot = () => String(reduced);
const serverSnapshot = () => "true";

function publish() {
  document.documentElement.dataset.motionPaused = String(reduced);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopListening) {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced = media.matches;
    const onMedia = () => { reduced = media.matches; publish(); };
    media.addEventListener("change", onMedia);
    stopListening = () => {
      media.removeEventListener("change", onMedia);
    };
    publish();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { stopListening?.(); stopListening = undefined; }
  };
}

export function useMotionPreference() {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const reduced = state === "true";
  return { userPaused: false, reduced, paused: reduced };
}

export function MotionPreference() {
  useMotionPreference();
  return null;
}
