"use client";

import { useDisplayPreferences } from "@/app/_components/display-preferences";

// Light or dark for the reviewer site. It writes the site's own saved preference (the one the homepage, the Docs and the platform read),
// and ThemeBridge maps it onto Pixl's data-theme. Pixl has no switch in its top bar (its theme is a setting), so this is a plain
// ghost button in Pixl's button classes.
export default function ThemeToggle() {
  const { theme, setTheme } = useDisplayPreferences();
  const light = theme === "light";
  return (
    <button type="button" className="hc-btn hc-btn-ghost hc-btn-sm reviewer-theme-switch" aria-pressed={light} onClick={() => setTheme(light ? "dark" : "light")} title="Switch between light and dark">
      {light ? "Dark" : "Light"}
    </button>
  );
}
