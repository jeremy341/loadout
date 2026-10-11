"use client";

import { useEffect, useRef, useState } from "react";

const storageKey = "loadout-theme";

export function ThemeToggle() {
  const button = useRef<HTMLButtonElement>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let savedDark = false;
      try { savedDark = localStorage.getItem(storageKey) === "dark"; } catch { /* Storage may be unavailable. */ }
      setDark(savedDark);
      const shell = button.current?.closest<HTMLElement>(".site-shell");
      if (shell) shell.dataset.theme = savedDark ? "dark" : "light";
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function changeTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    const theme = nextDark ? "dark" : "light";
    const shell = button.current?.closest<HTMLElement>(".site-shell");
    if (shell) shell.dataset.theme = theme;
    try { localStorage.setItem(storageKey, theme); } catch { /* The control still works without persistence. */ }
  }

  return <button ref={button} type="button" className="nav-theme-toggle" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} aria-pressed={dark} onClick={changeTheme}>
    <svg className="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
    <svg className="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>
  </button>;
}
