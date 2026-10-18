import { describe, expect, test } from "bun:test";
import { createDisplayPreferencesStore, DEFAULT_PREFERENCES } from "./display-preferences";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    values,
  };
}

describe("display preferences store", () => {
  test("hydrates the existing theme key and persists updates to stable keys", () => {
    const storage = memoryStorage({ "loadout-theme": "light", "loadout-color-safe": "true" });
    const store = createDisplayPreferencesStore(() => storage);
    expect(store.getSnapshot()).toEqual(DEFAULT_PREFERENCES);

    const unsubscribe = store.subscribe(() => {});
    expect(store.getSnapshot()).toEqual({ ...DEFAULT_PREFERENCES, theme: "light", colorSafe: true });
    store.setReduceMotion(true);
    expect(storage.values.get("loadout-theme")).toBe("light");
    expect(storage.values.get("loadout-color-safe")).toBe("true");
    expect(storage.values.get("loadout-reduce-motion")).toBe("true");
    unsubscribe();
  });

  test("migrates a saved hide-grain choice and allows it to be changed back", () => {
    const storage = memoryStorage({ "loadout-hide-grain": "true" });
    const store = createDisplayPreferencesStore(() => storage);
    const unsubscribe = store.subscribe(() => {});
    expect(store.getSnapshot().grain).toBe("off");
    store.setPreference("grain", "animated");
    expect(store.getSnapshot().grain).toBe("animated");
    expect(storage.values.get("loadout-grain")).toBe("animated");
    unsubscribe();
  });

  test("retains in-memory changes when storage reads and writes throw", () => {
    const blockedStorage = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
    };
    const store = createDisplayPreferencesStore(() => blockedStorage);
    let notifications = 0;
    const unsubscribe = store.subscribe(() => { notifications += 1; });

    store.setColorSafe(true);
    store.setTheme("light");

    expect(store.getSnapshot()).toEqual({ ...DEFAULT_PREFERENCES, theme: "light", colorSafe: true });
    expect(notifications).toBe(2);
    unsubscribe();
  });

  test("syncs valid preference changes and storage clears across tabs", () => {
    const storage = memoryStorage();
    const store = createDisplayPreferencesStore(() => storage);
    let notifications = 0;
    const unsubscribe = store.subscribe(() => { notifications += 1; });

    store.syncStorage("loadout-theme", "light");
    store.syncStorage("loadout-color-safe", "true");
    store.syncStorage("loadout-reduce-motion", "true");
    expect(store.getSnapshot()).toEqual({ ...DEFAULT_PREFERENCES, theme: "light", colorSafe: true, reduceMotion: true });
    expect(storage.values.size).toBe(0);

    store.syncStorage("loadout-color-safe", null);
    expect(store.getSnapshot()).toEqual({ ...DEFAULT_PREFERENCES, theme: "light", reduceMotion: true });
    expect(notifications).toBe(4);
    unsubscribe();
  });
});
