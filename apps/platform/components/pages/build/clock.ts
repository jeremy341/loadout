"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getPreview, setPreview, usePreviewState } from "../../../lib/preview-store";
import { KEYS, SEED_CLOCK } from "./data";
import { HOUR_MS } from "./logic/constants";

// The preview clock. The 24 hour journal-age gate and the 24 hour flag window need real days to pass, so the preview
// tools can move this clock forward. "Now" everywhere in the Build tabs means real time plus that offset.

/** Imperative "now" on the preview clock, for event handlers. Never call it while rendering. */
export function previewNow(): number {
  return Date.now() + getPreview<number>(KEYS.clock, SEED_CLOCK) * HOUR_MS;
}

export function advancePreviewClock(hours: number) {
  setPreview(KEYS.clock, getPreview<number>(KEYS.clock, SEED_CLOCK) + hours);
}

export function resetPreviewClock() {
  setPreview(KEYS.clock, SEED_CLOCK);
}

function subscribeMinute(callback: () => void) {
  const id = setInterval(callback, 30_000);
  return () => clearInterval(id);
}

const minuteSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;

/**
 * Preview "now" for rendering, at one-minute resolution. `ready` is false on the server and during hydration;
 * render time-dependent text only when it is true so the markup always matches.
 */
export function useBuildClock() {
  const real = useSyncExternalStore(subscribeMinute, minuteSnapshot, () => 0);
  const [offsetHours] = usePreviewState<number>(KEYS.clock, SEED_CLOCK);
  const ready = real !== 0;
  const advance = useCallback((hours: number) => advancePreviewClock(hours), []);
  const reset = useCallback(() => resetPreviewClock(), []);
  return { now: ready ? real + offsetHours * HOUR_MS : 0, ready, offsetHours, advance, reset };
}
