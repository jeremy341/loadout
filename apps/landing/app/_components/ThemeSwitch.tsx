"use client";

import { useDisplayPreferences } from "./display-preferences";

// Hidden checkbox that drives the light palette through :has(#theme:checked).
// The choice is remembered per browser so the homepage and docs stay in step.
export function ThemeSwitch() {
  const { theme, setTheme } = useDisplayPreferences();
  const light = theme === "light";

  return (
    <input
      id="theme"
      type="checkbox"
      checked={light}
      aria-label="Light mode"
      onChange={(event) => setTheme(event.currentTarget.checked ? "light" : "dark")}
      style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
    />
  );
}
