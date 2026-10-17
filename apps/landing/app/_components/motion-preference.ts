"use client";

import { useSyncExternalStore } from "react";

export const MOTION_STORAGE_KEY = "loadout-motion-paused";
const listeners = new Set<() => void>();
let userPaused = false;
let reduced = false;
let stopListening: (() => void) | undefined;
const snapshot = () => `${userPaused}:${reduced}`;
const serverSnapshot = () => "true:false";

function publish() {
  document.documentElement.dataset.motionPaused = String(userPaused || reduced);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopListening) {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    try { userPaused = localStorage.getItem(MOTION_STORAGE_KEY) === "true"; } catch { /* Keep this visit's choice. */ }
    reduced = media.matches;
    const onMedia = () => { reduced = media.matches; publish(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === MOTION_STORAGE_KEY || event.key === null) {
        userPaused = event.newValue === "true";
        publish();
      }
    };
    media.addEventListener("change", onMedia);
    window.addEventListener("storage", onStorage);
    stopListening = () => {
      media.removeEventListener("change", onMedia);
      window.removeEventListener("storage", onStorage);
    };
    publish();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { stopListening?.(); stopListening = undefined; }
  };
}

export function setMotionPaused(paused: boolean) {
  userPaused = paused;
  try { localStorage.setItem(MOTION_STORAGE_KEY, String(paused)); } catch { /* In-memory choice still works. */ }
  publish();
}

export function useMotionPreference() {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [saved, system] = state.split(":");
  return { userPaused: saved === "true", reduced: system === "true", paused: saved === "true" || system === "true" };
}

export function MotionPreference() {
  useMotionPreference();
  return null;
}
