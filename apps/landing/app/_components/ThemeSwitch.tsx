"use client";

import { useSyncExternalStore } from "react";

const storageKey = "loadout-theme";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readLight() {
  try {
    return window.localStorage.getItem(storageKey) === "light";
  } catch {
    // Storage can be blocked; the default dark palette still works.
    return false;
  }
}

function writeLight(light: boolean) {
  try {
    window.localStorage.setItem(storageKey, light ? "light" : "dark");
  } catch {
    // Ignore storage failures; the switch still works for this page view.
  }
  listeners.forEach((listener) => listener());
}

// Hidden checkbox that drives the light palette through :has(#theme:checked).
// The choice is remembered per browser so the homepage and docs stay in step.
export function ThemeSwitch() {
  const light = useSyncExternalStore(subscribe, readLight, () => false);

  return (
    <input
      id="theme"
      type="checkbox"
      checked={light}
      aria-label="Light mode"
      onChange={(event) => writeLight(event.currentTarget.checked)}
      style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
    />
  );
}
