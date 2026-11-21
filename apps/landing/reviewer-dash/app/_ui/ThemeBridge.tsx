"use client";

import { useEffect } from "react";

// Pixl's themes hang off attributes on <html> (data-theme, data-accent, data-font, ...) that its root layout sets. LOADOUT's root layout
// owns <html>, so this sets them from the reviewer layout instead. The light or dark choice follows the site's own setting
// (data-display-theme, written by the display preferences and read by the homepage, the Docs and the platform); a light or dark
// chosen in the settings keeps winning, as in Pixl (its editor themes are not offered here).
export default function ThemeBridge({ theme, accent, font, monoFont, density }: { theme: string; accent: string; font: string; monoFont: string; density: string }) {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const site = root.dataset.displayTheme === "light" ? "light" : "dark";
      root.dataset.theme = theme === "dark" || theme === "light" ? theme : site;
      root.dataset.accent = accent;
      root.dataset.font = font;
      root.dataset.monoFont = monoFont;
      root.dataset.density = density;
    };
    apply();
    const watch = new MutationObserver(apply);
    watch.observe(root, { attributes: true, attributeFilter: ["data-display-theme"] });
    return () => {
      watch.disconnect();
      for (const key of ["theme", "accent", "font", "monoFont", "density"]) delete root.dataset[key];
    };
  }, [theme, accent, font, monoFont, density]);
  return null;
}
