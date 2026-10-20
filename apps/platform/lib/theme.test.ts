import { describe, expect, test } from "bun:test";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, otherTheme, parseTheme } from "./theme";

describe("theme", () => {
  test("parseTheme defaults to dark", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("LIGHT")).toBe("dark");
    expect(parseTheme(null)).toBe("dark");
    expect(parseTheme(undefined)).toBe("dark");
  });

  test("otherTheme flips the theme", () => {
    expect(otherTheme("dark")).toBe("light");
    expect(otherTheme("light")).toBe("dark");
  });

  test("the init script reads the shared storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("loadout-theme");
    expect(THEME_INIT_SCRIPT).toContain('"loadout-theme"');
  });
});
