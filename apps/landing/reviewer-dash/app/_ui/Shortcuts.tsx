"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NavModel } from "./nav";
import { hasModifier, isLiveChord, isTyping, readEnabled, resolveKey, writeEnabled, type Chord } from "./shortcutKeys";
import ShortcutsTable from "./ShortcutsTable";

// Desk-wide keyboard shortcuts and the dialog that lists them. Rules (see .ulpi/design/reviewer-desk-staging-honesty.md section 6):
// ignored while typing, with a modifier held, or while a dialog is open; a switch in the dialog turns them all off (WCAG 2.1.4), kept
// in localStorage inside a try/catch. The review page's own keys (arrows, j, k, r, d) live in review/[id]/ReviewShortcuts.tsx and are
// only listed here.
export const OPEN_SEARCH_EVENT = "reviewer:open-search";
export const OPEN_SHORTCUTS_EVENT = "reviewer:open-shortcuts";

function isIgnored(e: KeyboardEvent, enabled: boolean): boolean {
  if (!enabled || e.defaultPrevented || hasModifier(e)) return true;
  return isTyping(document.activeElement) || document.querySelector("dialog[open]") !== null;
}

function navHrefs(nav: NavModel): Set<string> {
  return new Set([...nav.primary, ...nav.groups.flatMap((g) => g.items)].map((item) => item.href));
}

export default function Shortcuts({ nav }: { nav: NavModel }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);
  const chord = useRef<Chord | null>(null);
  const hrefs = useRef<Set<string>>(new Set());
  hrefs.current = navHrefs(nav);

  useEffect(() => {
    const on = readEnabled();
    enabledRef.current = on;
    setEnabled(on);
  }, []);

  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener(OPEN_SHORTCUTS_EVENT, open);
    return () => window.removeEventListener(OPEN_SHORTCUTS_EVENT, open);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isIgnored(e, enabledRef.current)) return;
      const now = Date.now();
      const action = resolveKey(e.key, e.shiftKey, isLiveChord(chord.current, now), hrefs.current);
      chord.current = action.type === "chord" ? { key: "g", at: now } : null;
      if (action.type === "go") router.push(action.href);
      else if (action.type === "search") window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
      else if (action.type === "help") dialog.current?.showModal();
      // The keys that mean something must not also reach the page (a "/" typed into nothing, a "?" scrolling).
      if (action.type !== "none" && action.type !== "chord") e.preventDefault();
    }
    // Capture phase, so a matched chord (g then r) marks the key as handled before the ship page's own r key (open the repository) sees it.
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [router]);

  return (
    <dialog ref={dialog} className="hc-dialog rv-shortcuts" aria-labelledby="rv-shortcuts-title" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
      <div className="rv-shortcuts-body">
        <div className="rv-shortcuts-head">
          <h2 id="rv-shortcuts-title" className="hc-heading text-lg">
            Keyboard shortcuts
          </h2>
          <button type="button" className="hc-btn hc-btn-ghost hc-btn-sm" onClick={() => dialog.current?.close()} autoFocus>
            Close
          </button>
        </div>
        <ShortcutsTable hrefs={hrefs.current} />
        <label className="hc-check">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              enabledRef.current = e.target.checked;
              setEnabled(e.target.checked);
              writeEnabled(e.target.checked);
            }}
          />
          <span>Single-key shortcuts on. Turn off if they get in the way. Ctrl or Cmd+K always works.</span>
        </label>
        <p className="hc-caption text-xs">Shortcuts never fire while you are typing in a field. Every action also has a button on the page.</p>
      </div>
    </dialog>
  );
}
