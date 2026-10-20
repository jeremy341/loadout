"use client";

import { useCallback, useSyncExternalStore } from "react";

// The platform has no backend yet. Every working feature keeps its state in this browser's localStorage so
// it behaves like a real app (add, edit, delete, reload) while nothing is sent to LOADOUT. When a service
// ships, a module swaps this hook for its real data source and the page code stays the same.

export const PREVIEW_PREFIX = "loadout-platform:v1:";

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();
// Values that could not be persisted (storage blocked or full). They live for this tab so the page keeps working.
const memory = new Map<string, unknown>();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(PREVIEW_PREFIX)) {
      cache.clear();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Reads a stored value, or `fallback` when nothing valid is stored. Returns a stable reference between writes. */
function read<T>(key: string, fallback: T): T {
  if (memory.has(key)) return memory.get(key) as T;
  const store = storage();
  if (!store) return fallback;
  let raw: string | null = null;
  try {
    raw = store.getItem(PREVIEW_PREFIX + key);
  } catch {
    return fallback;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return (hit.value === undefined ? fallback : hit.value) as T;
  let value: unknown = undefined;
  if (raw !== null) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = undefined;
    }
  }
  cache.set(key, { raw, value });
  return (value === undefined ? fallback : value) as T;
}

function write<T>(key: string, value: T) {
  const store = storage();
  let saved = false;
  if (store) {
    try {
      store.setItem(PREVIEW_PREFIX + key, JSON.stringify(value));
      saved = true;
    } catch {
      // Storage full or blocked: fall through to the in-memory copy below.
    }
  }
  if (saved) memory.delete(key);
  else memory.set(key, value);
  cache.delete(key);
  emit();
}

/** Imperative read for event handlers and pure helpers. Never call during render; use the hook there. */
export function getPreview<T>(key: string, fallback: T): T {
  return read(key, fallback);
}

/** Imperative write for helpers (ledger, notifications) that run outside React. */
export function setPreview<T>(key: string, value: T) {
  write(key, value);
}

/**
 * Persistent state for a preview feature. `initial` is the seed (sample data) used until the participant
 * changes something. Keep `initial` a module-level constant so its reference is stable.
 * The server and the first client render both use `initial`, so there is no hydration mismatch.
 */
export function usePreviewState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, initial),
    () => initial,
  );
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, initial);
      write(key, typeof next === "function" ? (next as (prev: T) => T)(prev) : next);
    },
    [key, initial],
  );
  return [value, set, hydrated];
}

/** Removes every preview key (Account > Reset preview data). */
export function resetPreviewData() {
  const store = storage();
  if (store) {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (k && k.startsWith(PREVIEW_PREFIX)) doomed.push(k);
      }
      for (const k of doomed) store.removeItem(k);
    } catch {
      // ignore
    }
  }
  cache.clear();
  memory.clear();
  emit();
}

let counter = 0;
/** A short unique id for locally created records. */
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
