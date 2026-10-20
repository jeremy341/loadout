"use client";

import { useSyncExternalStore } from "react";
import { PixelIcon } from "./icons";
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, otherTheme, parseTheme, type Theme } from "../../lib/theme";

const CHANGE_EVENT = "loadout-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The inline script in the root layout has already set the attribute before React hydrates.
function getSnapshot(): Theme {
  return parseTheme(document.documentElement.getAttribute(THEME_ATTRIBUTE));
}

function getServerSnapshot(): Theme {
  return "dark";
}

/** A two-state button. Its label names the theme it switches to, as the public site's switch does. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next = otherTheme(theme);

  function toggle() {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked. The choice still applies for this visit.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <button type="button" className="rail-btn" onClick={toggle}>
      <PixelIcon name="theme" />
      <span className="rail-btn-text">{next === "light" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
