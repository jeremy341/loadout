export type Theme = "dark" | "light";

/** Same key the public site uses, so one choice carries across when both apps share an origin. */
export const THEME_STORAGE_KEY = "loadout-theme";
export const THEME_ATTRIBUTE = "data-display-theme";

/** Anything that is not exactly "light" is dark, the default theme. */
export function parseTheme(value: string | null | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

export function otherTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

/**
 * Runs in <head> before the first paint so the saved theme never flashes. It is a fixed string with
 * no user input, which is the only reason it is safe to inline.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.setAttribute("${THEME_ATTRIBUTE}",t==="light"?"light":"dark")}catch(e){}`;
