"use client";

import { useEffect, useSyncExternalStore } from "react";

export type DisplayTheme = "dark" | "light";
export type GrainPreference = "animated" | "still" | "off";
export type ReadingSize = 100 | 125 | 150 | 200;
export type ColorVisionProfile = "standard" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";
export type DisplayPreferences = {
  theme: DisplayTheme;
  colorVision: ColorVisionProfile;
  reduceMotion: boolean;
  grain: GrainPreference;
  underlineLinks: boolean;
  phantomSans: boolean;
  readingSize: ReadingSize;
  moreSpacing: boolean;
  strongContrast: boolean;
  systemCursor: boolean;
  largerControls: boolean;
  hideGrid: boolean;
  hideAscii: boolean;
  hideMascot: boolean;
  hideMarkings: boolean;
  nativeScroll: boolean;
};

type StoragePort = Pick<Storage, "getItem" | "setItem">;
export const DEFAULT_PREFERENCES: DisplayPreferences = {
  theme: "dark", colorVision: "standard", reduceMotion: false, grain: "animated",
  underlineLinks: false, phantomSans: false, readingSize: 100, moreSpacing: false,
  strongContrast: false, systemCursor: false, largerControls: false,
  hideGrid: false, hideAscii: false, hideMascot: false, hideMarkings: false, nativeScroll: false,
};
const preferenceKeys: Record<keyof DisplayPreferences, string> = {
  theme: "loadout-theme", colorVision: "loadout-color-vision", reduceMotion: "loadout-reduce-motion",
  grain: "loadout-grain", underlineLinks: "loadout-underline-links",
  phantomSans: "loadout-phantom-sans", readingSize: "loadout-reading-size",
  moreSpacing: "loadout-more-spacing", strongContrast: "loadout-strong-contrast",
  systemCursor: "loadout-system-cursor", largerControls: "loadout-larger-controls",
  hideGrid: "loadout-hide-grid", hideAscii: "loadout-hide-ascii",
  hideMascot: "loadout-hide-mascot", hideMarkings: "loadout-hide-markings",
  nativeScroll: "loadout-native-scroll",
};
const names = Object.keys(preferenceKeys) as (keyof DisplayPreferences)[];

function decode<K extends keyof DisplayPreferences>(key: K, raw: string | null): DisplayPreferences[K] {
  const fallback = DEFAULT_PREFERENCES[key];
  if (key === "theme") return (raw === "light" ? "light" : "dark") as DisplayPreferences[K];
  if (key === "colorVision") return (["standard", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"].includes(raw ?? "") ? raw : fallback) as DisplayPreferences[K];
  if (key === "grain") return (["animated", "still", "off"].includes(raw ?? "") ? raw : fallback) as DisplayPreferences[K];
  if (key === "readingSize") return (["100", "125", "150", "200"].includes(raw ?? "") ? Number(raw) : fallback) as DisplayPreferences[K];
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
  function hasIndependentDecorationChoices() {
    return ["loadout-hide-grid", "loadout-hide-ascii", "loadout-hide-mascot", "loadout-hide-markings"]
      .some((key) => read(key) !== null);
  }
  function migrateGrain(raw: string | null) {
    if (legacyQuietModeNeedsMigration()) return "off";
    if (raw !== null) return raw;
    if (read("loadout-hide-grain") !== "true") return raw;
    return "off";
  }
  function migrateDecoration(raw: string | null) {
    if (raw !== null) return raw;
    if (read("loadout-simplify-decoration") !== "true") return raw;
    return "true";
  }
  function legacyQuietModeNeedsMigration() {
    return read("loadout-simplify-decoration") === "true" && !hasIndependentDecorationChoices();
  }
  function migratePreference(name: keyof DisplayPreferences, raw: string | null) {
    switch (name) {
      case "colorVision": return migrateColorVision(raw);
      case "grain": return migrateGrain(raw);
      case "phantomSans": return migratePhantomSans(raw);
      case "hideGrid":
      case "hideAscii":
      case "hideMascot":
      case "hideMarkings": return migrateDecoration(raw);
      default: return raw;
    }
  }
  function persistMigration(name: keyof DisplayPreferences, stored: string | null, migrated: string | null) {
    if (migrated === null || migrated === stored) return;
    try { storage()?.setItem(preferenceKeys[name], migrated); } catch { /* Memory remains usable. */ }
  }
  function migrateColorVision(raw: string | null) {
    if (raw !== null) return raw;
    return read("loadout-color-safe") === "true" ? "deuteranopia" : raw;
  }
  function migratePhantomSans(raw: string | null) {
    return raw ?? read("loadout-plain-typography");
  }
  function notify() { listeners.forEach((listener) => listener()); }
  function hydrate() {
    if (hydrated) return;
    hydrated = true;
    let next = { ...snapshot };
    for (const name of names) {
      if (dirty.has(name)) continue;
      const storedRaw = read(preferenceKeys[name]);
      const raw = migratePreference(name, storedRaw);
      next = { ...next, [name]: decode(name, raw) };
      // Save migrated values so a later independent change or reset can override the legacy key.
      persistMigration(name, storedRaw, raw);
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
    setColorVision: (value: ColorVisionProfile) => update("colorVision", value),
    setReduceMotion: (value: boolean) => update("reduceMotion", value),
    setUnderlineLinks: (value: boolean) => update("underlineLinks", value),
  };
}
const store = createDisplayPreferencesStore(() => typeof window === "undefined" ? null : window.localStorage);
export function useDisplayPreferences() {
  const preferences = useSyncExternalStore(store.subscribe, store.getSnapshot, () => DEFAULT_PREFERENCES);
  return {
    ...preferences, setPreference: store.setPreference, reset: store.reset,
    setTheme: store.setTheme, setColorVision: store.setColorVision,
    setReduceMotion: store.setReduceMotion, setUnderlineLinks: store.setUnderlineLinks,
  };
}
/** Keep optional presentation attributes in sync without adding a layout wrapper. */
export function DisplayPreferencesEffects() {
  const preferences = useDisplayPreferences();
  const systemContrast = useSyncExternalStore(subscribeToMoreContrast, prefersMoreContrast, () => false);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.displayTheme = preferences.theme;
    root.dataset.colorVision = preferences.colorVision;
    root.dataset.grain = preferences.grain;
    root.dataset.underlineLinks = String(preferences.underlineLinks);
    root.dataset.phantomSans = String(preferences.phantomSans);
    root.dataset.readingSize = String(preferences.readingSize);
    root.dataset.readingLayout = String(preferences.readingSize !== 100 || preferences.moreSpacing);
    root.dataset.moreSpacing = String(preferences.moreSpacing);
    root.dataset.strongContrast = String(preferences.strongContrast);
    root.dataset.systemCursor = String(preferences.systemCursor);
    root.dataset.largerControls = String(preferences.largerControls);
    root.dataset.hideGrid = String(preferences.hideGrid);
    root.dataset.hideAscii = String(preferences.hideAscii);
    root.dataset.hideMascot = String(preferences.hideMascot);
    root.dataset.hideMarkings = String(preferences.hideMarkings);
    root.dataset.nativeScroll = String(preferences.nativeScroll);
  }, [preferences.theme, preferences.colorVision, preferences.underlineLinks, preferences.phantomSans,
    preferences.grain, preferences.readingSize, preferences.moreSpacing, preferences.strongContrast, preferences.systemCursor, preferences.largerControls,
    preferences.hideGrid, preferences.hideAscii, preferences.hideMascot, preferences.hideMarkings, preferences.nativeScroll]);
  useEffect(() => {
    const root = document.documentElement;
    if (systemContrast) root.dataset.systemContrast = "true";
    else delete root.dataset.systemContrast;
  }, [systemContrast]);
  return null;
}

function prefersMoreContrast() {
  return window.matchMedia("(prefers-contrast: more)").matches;
}

function subscribeToMoreContrast(listener: () => void) {
  const preference = window.matchMedia("(prefers-contrast: more)");
  preference.addEventListener("change", listener);
  return () => preference.removeEventListener("change", listener);
}
