import { mock } from "bun:test";

// Shared test doubles for the engine and render tests. bun applies mock.module to the whole test process, so both
// files import this one module and see the same in-memory preview store and the same controllable clock.
// It holds no tests itself.

export const NOW = Date.UTC(2026, 9, 25, 12, 0, 0);
export const clock = { now: NOW };
export const store = new Map<string, unknown>();
let counter = 0;

export function resetTestState() {
  store.clear();
  clock.now = NOW;
}

mock.module("../../../lib/preview-store", () => ({
  PREVIEW_PREFIX: "test:",
  usePreviewState: <T>(key: string, initial: T) => [(store.has(key) ? store.get(key) : initial) as T, () => undefined, true] as const,
  getPreview: <T>(key: string, fallback: T) => (store.has(key) ? (store.get(key) as T) : fallback),
  setPreview: (key: string, value: unknown) => {
    store.set(key, value);
  },
  uid: (prefix = "id") => `${prefix}_${(counter += 1)}`,
  resetPreviewData: () => store.clear(),
}));

mock.module("./clock", () => ({
  previewNow: () => clock.now,
  advancePreviewClock: (hours: number) => {
    clock.now += hours * 3_600_000;
  },
  resetPreviewClock: () => {
    clock.now = NOW;
  },
  useBuildClock: () => ({ now: clock.now, ready: true, offsetHours: 0, advance: () => undefined, reset: () => undefined }),
}));
