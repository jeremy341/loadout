// Pure rules for the desk-wide keyboard shortcuts (see Shortcuts.tsx for the wiring and the policy).
export const STORE_KEY = "loadout-reviewer-shortcuts";
export const CHORD_MS = 1500;

// g, then one of these. Only the pages that are in the viewer's nav are reachable.
export const GO: Record<string, { href: string; label: string }> = {
  o: { href: "/", label: "Overview" },
  r: { href: "/review", label: "Review" },
  p: { href: "/projects", label: "Projects" },
  b: { href: "/players", label: "Builders" },
};

export interface Chord {
  key: string;
  at: number;
}

export type ShortcutAction =
  | { type: "go"; href: string }
  | { type: "search" }
  | { type: "help" }
  | { type: "chord" }
  | { type: "none" };

const NONE: ShortcutAction = { type: "none" };

export function isTyping(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return el.matches("input, textarea, select");
}

export function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeEnabled(on: boolean) {
  try {
    if (on) localStorage.removeItem(STORE_KEY);
    else localStorage.setItem(STORE_KEY, "off");
  } catch {
    // the switch still works for this page view
  }
}

export function hasModifier(e: Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey">): boolean {
  return e.metaKey || e.ctrlKey || e.altKey;
}

/** True when a "g" was pressed no more than CHORD_MS ago. */
export function isLiveChord(pending: Chord | null, now: number): boolean {
  return pending !== null && pending.key === "g" && now - pending.at <= CHORD_MS;
}

/** The page the second key of a g chord leads to, if it is one the viewer's nav reaches. */
export function chordTarget(key: string, hrefs: ReadonlySet<string>): string | null {
  const target = GO[key.toLowerCase()];
  return target && hrefs.has(target.href) ? target.href : null;
}

/** The Go rows to list: only the pages in the viewer's nav. */
export function reachableRows(hrefs: ReadonlySet<string>): [string, { href: string; label: string }][] {
  return Object.entries(GO).filter(([, v]) => hrefs.has(v.href));
}

function singleKeyAction(key: string, shift: boolean): ShortcutAction {
  if (key === "/") return { type: "search" };
  if (key === "?") return { type: "help" };
  if (key === "g" && !shift) return { type: "chord" };
  return NONE;
}

/** What a key press means, given whether a g chord is live. A live chord consumes the key whether or not it leads anywhere. */
export function resolveKey(
  key: string,
  shift: boolean,
  chordLive: boolean,
  hrefs: ReadonlySet<string>,
): ShortcutAction {
  if (!chordLive) return singleKeyAction(key, shift);
  const href = chordTarget(key, hrefs);
  return href ? { type: "go", href } : NONE;
}
