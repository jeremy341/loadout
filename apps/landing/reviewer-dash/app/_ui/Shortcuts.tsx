"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NavModel } from "./nav";

// Desk-wide keyboard shortcuts and the dialog that lists them. Rules (see .ulpi/design/reviewer-desk-staging-honesty.md section 6):
// ignored while typing, with a modifier held, or while a dialog is open; a switch in the dialog turns them all off (WCAG 2.1.4), kept
// in localStorage inside a try/catch. The review page's own keys (arrows, j, k, r, d) live in review/[id]/ReviewShortcuts.tsx and are
// only listed here.
export const OPEN_SEARCH_EVENT = "reviewer:open-search";
export const OPEN_SHORTCUTS_EVENT = "reviewer:open-shortcuts";
const STORE_KEY = "loadout-reviewer-shortcuts";
const CHORD_MS = 1500;

// g, then one of these. Only the pages that are in the viewer's nav are reachable.
const GO: Record<string, { href: string; label: string }> = {
  o: { href: "/", label: "Overview" },
  r: { href: "/review", label: "Review" },
  p: { href: "/projects", label: "Projects" },
  b: { href: "/players", label: "Builders" },
};

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return el.matches("input, textarea, select");
}

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORE_KEY) !== "off";
  } catch {
    return true;
  }
}

function writeEnabled(on: boolean) {
  try {
    if (on) localStorage.removeItem(STORE_KEY);
    else localStorage.setItem(STORE_KEY, "off");
  } catch {
    // the switch still works for this page view
  }
}

export default function Shortcuts({ nav }: { nav: NavModel }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);
  const chord = useRef<{ key: string; at: number } | null>(null);
  const hrefs = useRef<Set<string>>(new Set());
  hrefs.current = new Set([...nav.primary, ...nav.groups.flatMap((g) => g.items)].map((item) => item.href));

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
      if (!enabledRef.current || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(document.activeElement) || document.querySelector("dialog[open]")) return;
      const key = e.key;
      const pending = chord.current;
      chord.current = null;
      if (pending && pending.key === "g" && Date.now() - pending.at <= CHORD_MS) {
        const target = GO[key.toLowerCase()];
        if (target && hrefs.current.has(target.href)) {
          e.preventDefault();
          router.push(target.href);
        }
        return;
      }
      if (key === "/") {
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
      } else if (key === "?") {
        e.preventDefault();
        dialog.current?.showModal();
      } else if (key === "g" && !e.shiftKey) {
        chord.current = { key: "g", at: Date.now() };
      }
    }
    // Capture phase, so a matched chord (g then r) marks the key as handled before the ship page's own r key (open the repository) sees it.
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [router]);

  const goRows = Object.entries(GO).filter(([, v]) => hrefs.current.has(v.href));

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
        <table className="rv-shortcuts-table">
          <caption className="sr-only">Keyboard shortcuts for the reviewer desk</caption>
          <tbody>
            <tr>
              <th scope="row">
                <kbd className="hc-kbd">/</kbd>
              </th>
              <td>Open search (Ctrl or Cmd+K does the same)</td>
            </tr>
            <tr>
              <th scope="row">
                <kbd className="hc-kbd">?</kbd>
              </th>
              <td>Show this list</td>
            </tr>
            {goRows.map(([key, v]) => (
              <tr key={key}>
                <th scope="row">
                  <kbd className="hc-kbd">g</kbd> then <kbd className="hc-kbd">{key}</kbd>
                </th>
                <td>Go to {v.label}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">
                <kbd className="hc-kbd">←</kbd> <kbd className="hc-kbd">→</kbd> or <kbd className="hc-kbd">k</kbd> <kbd className="hc-kbd">j</kbd>
              </th>
              <td>On a ship: previous or next ship</td>
            </tr>
            <tr>
              <th scope="row">
                <kbd className="hc-kbd">r</kbd> <kbd className="hc-kbd">d</kbd>
              </th>
              <td>On a ship: open the repository or the demo</td>
            </tr>
            <tr>
              <th scope="row">
                <kbd className="hc-kbd">1</kbd> to <kbd className="hc-kbd">9</kbd>
              </th>
              <td>On a ship: switch the evidence tab</td>
            </tr>
          </tbody>
        </table>
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
