"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useDisplayPreferences } from "./display-preferences";

const listeners = new Set<() => void>();
let systemReduced = false;
let stopListening: (() => void) | undefined;
const snapshot = () => String(systemReduced);
const serverSnapshot = () => "true";

function publish() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopListening) {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    systemReduced = media.matches;
    const onMedia = () => { systemReduced = media.matches; publish(); };
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
  const { reduceMotion } = useDisplayPreferences();
  const paused = reduced || reduceMotion;

  return { userPaused: reduceMotion, reduced, paused };
}

export function MotionPreference() {
  const { paused } = useMotionPreference();

  useEffect(() => {
    document.documentElement.dataset.motionPaused = String(paused);
  }, [paused]);

  return null;
}
