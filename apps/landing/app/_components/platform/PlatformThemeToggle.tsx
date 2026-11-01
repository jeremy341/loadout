"use client";

import { useDisplayPreferences } from "../display-preferences";

// The homepage's light and dark switch, with the same pixel moon and sun, for the platform. It writes the same saved
// preference the homepage and Docs read, so the choice follows the builder across all three. It is a switch button,
// not the homepage's hidden checkbox, because the platform themes through data-display-theme and not :has(#theme).
export function PlatformThemeToggle({ className = "", showLabel = false }: Readonly<{ className?: string; showLabel?: boolean }>) {
  const { theme, setTheme } = useDisplayPreferences();
  const light = theme === "light";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      aria-label="Light mode"
      className={`pf-theme ${className}`.trim()}
      onClick={() => setTheme(light ? "dark" : "light")}
    >
      <span className="pxw mo" aria-hidden="true"><i className="b" /></span>
      <span className="pxw su" aria-hidden="true"><i className="a" /></span>
      {showLabel ? <span className="pf-theme-label" aria-hidden="true">{light ? "Light mode" : "Dark mode"}</span> : null}
    </button>
  );
}
