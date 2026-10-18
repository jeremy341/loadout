"use client";

import { useEffect, useSyncExternalStore } from "react";

export type DisplayTheme = "dark" | "light";
export type GrainPreference = "animated" | "still" | "off";
export type ReadingSize = 100 | 125 | 150;
export type DisplayPreferences = {
  theme: DisplayTheme;
  colorSafe: boolean;
  reduceMotion: boolean;
  grain: GrainPreference;
  underlineLinks: boolean;
  plainTypography: boolean;
  readingSize: ReadingSize;
  moreSpacing: boolean;
  strongContrast: boolean;
  systemCursor: boolean;
  simplifyDecoration: boolean;
  nativeScroll: boolean;
};

type StoragePort = Pick<Storage, "getItem" | "setItem">;
export const DEFAULT_PREFERENCES: DisplayPreferences = {
  theme: "dark", colorSafe: false, reduceMotion: false, grain: "animated",
  underlineLinks: false, plainTypography: false, readingSize: 100, moreSpacing: false,
  strongContrast: false, systemCursor: false, simplifyDecoration: false, nativeScroll: false,
};
const preferenceKeys: Record<keyof DisplayPreferences, string> = {
  theme: "loadout-theme", colorSafe: "loadout-color-safe", reduceMotion: "loadout-reduce-motion",
  grain: "loadout-grain", underlineLinks: "loadout-underline-links",
  plainTypography: "loadout-plain-typography", readingSize: "loadout-reading-size",
  moreSpacing: "loadout-more-spacing", strongContrast: "loadout-strong-contrast",
  systemCursor: "loadout-system-cursor", simplifyDecoration: "loadout-simplify-decoration",
  nativeScroll: "loadout-native-scroll",
};
const names = Object.keys(preferenceKeys) as (keyof DisplayPreferences)[];

function decode<K extends keyof DisplayPreferences>(key: K, raw: string | null): DisplayPreferences[K] {
  const fallback = DEFAULT_PREFERENCES[key];
  if (key === "theme") return (raw === "light" ? "light" : "dark") as DisplayPreferences[K];
  if (key === "grain") return (["animated", "still", "off"].includes(raw ?? "") ? raw : fallback) as DisplayPreferences[K];
  if (key === "readingSize") return (["100", "125", "150"].includes(raw ?? "") ? Number(raw) : fallback) as DisplayPreferences[K];
  return (raw === "true") as DisplayPreferences[K];
}

/** Shared persisted preferences, with an in-memory fallback when storage is blocked. */
export function createDisplayPreferencesStore(getStorage: () => StoragePort | null) {
  let snapshot = DEFAULT_PREFERENCES;
  let hydrated = false;
  const dirty = new Set<keyof DisplayPreferences>();
  const listeners = new Set<() => void>();
  function storage() { try { return getStorage(); } catch { return null; } }
  function read(key: string) { try { return storage()?.getItem(key) ?? null; } catch { return null; } }
  function migrateGrain(raw: string | null) {
    if (raw !== null) return raw;
    if (read("loadout-hide-grain") !== "true") return raw;
    return "off";
  }
  function notify() { listeners.forEach((listener) => listener()); }
  function hydrate() {
    if (hydrated) return;
    hydrated = true;
    let next = { ...snapshot };
    for (const name of names) {
      if (dirty.has(name)) continue;
      let raw = read(preferenceKeys[name]);
      if (name === "grain") raw = migrateGrain(raw);
      next = { ...next, [name]: decode(name, raw) };
    }
    snapshot = next;
  }
  function update<K extends keyof DisplayPreferences>(key: K, value: DisplayPreferences[K]) {
    dirty.add(key);
    // Persist even a default choice, so an old migrated preference can be replaced.
    try { storage()?.setItem(preferenceKeys[key], String(value)); } catch { /* Memory remains usable. */ }
    if (snapshot[key] === value) return;
    snapshot = { ...snapshot, [key]: value };
    notify();
  }
  function reset() {
    names.forEach((name) => {
      dirty.add(name);
      try { storage()?.setItem(preferenceKeys[name], String(DEFAULT_PREFERENCES[name])); } catch { /* Memory remains usable. */ }
    });
    snapshot = { ...DEFAULT_PREFERENCES };
    notify();
  }
  function syncStorage(key: string, value: string | null) {
    const name = names.find((name) => preferenceKeys[name] === key);
    if (!name) return;
    const decoded = decode(name, value);
    if (snapshot[name] === decoded) return;
    snapshot = { ...snapshot, [name]: decoded };
    notify();
  }
  function handleStorage(event: StorageEvent) {
    if (event.storageArea && event.storageArea !== storage()) return;
    if (event.key === null) { snapshot = { ...DEFAULT_PREFERENCES }; notify(); }
    else syncStorage(event.key, event.newValue);
  }
  function subscribe(listener: () => void) {
    listeners.add(listener);
    hydrate();
    if (listeners.size === 1 && typeof window !== "undefined") window.addEventListener("storage", handleStorage);
    return () => {
      listeners.delete(listener);
      if (!listeners.size && typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
    };
  }
  return {
    getSnapshot: () => snapshot, subscribe, setPreference: update, reset, syncStorage,
    setTheme: (value: DisplayTheme) => update("theme", value),
    setColorSafe: (value: boolean) => update("colorSafe", value),
    setReduceMotion: (value: boolean) => update("reduceMotion", value),
    setUnderlineLinks: (value: boolean) => update("underlineLinks", value),
  };
}
const store = createDisplayPreferencesStore(() => typeof window === "undefined" ? null : window.localStorage);
export function useDisplayPreferences() {
  const preferences = useSyncExternalStore(store.subscribe, store.getSnapshot, () => DEFAULT_PREFERENCES);
  return {
    ...preferences, setPreference: store.setPreference, reset: store.reset,
    setTheme: store.setTheme, setColorSafe: store.setColorSafe,
    setReduceMotion: store.setReduceMotion, setUnderlineLinks: store.setUnderlineLinks,
  };
}
/** Keep optional presentation attributes in sync without adding a layout wrapper. */
export function DisplayPreferencesEffects() {
  const preferences = useDisplayPreferences();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.displayTheme = preferences.theme;
    root.dataset.colorSafe = String(preferences.colorSafe);
    root.dataset.grain = preferences.grain;
    root.dataset.underlineLinks = String(preferences.underlineLinks);
    root.dataset.plainTypography = String(preferences.plainTypography);
    root.dataset.readingSize = String(preferences.readingSize);
    root.dataset.moreSpacing = String(preferences.moreSpacing);
    root.dataset.strongContrast = String(preferences.strongContrast);
    root.dataset.systemCursor = String(preferences.systemCursor);
    root.dataset.simplifyDecoration = String(preferences.simplifyDecoration);
    root.dataset.nativeScroll = String(preferences.nativeScroll);
  }, [preferences.theme, preferences.colorSafe, preferences.underlineLinks, preferences.plainTypography,
    preferences.grain, preferences.readingSize, preferences.moreSpacing, preferences.strongContrast, preferences.systemCursor,
    preferences.simplifyDecoration, preferences.nativeScroll]);
  return null;
}
