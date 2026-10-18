"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import type { DocsGroup } from "./docs-data";
import { DocsSearch } from "./DocsSearch";
import { ThemeSwitch } from "../_components/ThemeSwitch";
import { NoiseGrain } from "../_components/NoiseGrain";
import { Logo } from "../_components/home/Logo";

const STORAGE_KEY = "loadout-docs-groups-v1";
const CHANGE_EVENT = "loadout-docs-groups-change";
let memorySnapshot: string | null = null;

function subscribeGroupPreferences(onChange: () => void) {
  const onStorage = () => { memorySnapshot = null; onChange(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readGroupSnapshot(labels: string[]) {
  if (memorySnapshot !== null) return memorySnapshot;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      memorySnapshot = stored;
      return stored;
    }
  } catch { /* Storage can be disabled; use the default directory state. */ }
  return JSON.stringify(labels);
}

function writeGroupSnapshot(next: string[]) {
  memorySnapshot = JSON.stringify(next);
  try { localStorage.setItem(STORAGE_KEY, memorySnapshot); } catch { /* Keep the in-memory directory usable. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function DocsShell({ children, groups }: { children: React.ReactNode; groups: DocsGroup[] }) {
  const pathname = usePathname();
  const active = pathname.split("/").filter(Boolean).pop() ?? "start";
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // While the drawer is open, the page behind it is inert: focus and screen readers stay in the drawer.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>(":scope > .docs-main, :scope > .docs-toc, :scope > .docs-skip, .docs-nav-head").forEach((node) => { node.inert = mobileOpen; });
  }, [mobileOpen]);
  // Focus moves into the drawer when it opens and returns to the Guides button when it closes.
  useEffect(() => {
    if (mobileOpen) {
      wasOpen.current = true;
      closeRef.current?.focus();
      return;
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      toggleRef.current?.focus();
    }
  }, [mobileOpen]);
  // Escape closes the drawer unless the search box has already used it. Tab wraps inside the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!event.defaultPrevented) setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const drawer = document.getElementById("docs-guides");
      if (!drawer) return;
      const stops = Array.from(drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, summary")).filter((node) => node.getClientRects().length > 0);
      if (stops.length === 0) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      if (!drawer.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);
  const labels = useMemo(() => groups.map((group) => group.label), [groups]);
  const getSnapshot = useCallback(() => readGroupSnapshot(labels), [labels]);
  const getServerSnapshot = useCallback(() => JSON.stringify(labels), [labels]);
  const snapshot = useSyncExternalStore(subscribeGroupPreferences, getSnapshot, getServerSnapshot);
  let expandedGroups: string[];
  try {
    const stored = JSON.parse(snapshot) as unknown;
    expandedGroups = Array.isArray(stored) ? stored.filter((label): label is string => typeof label === "string" && labels.includes(label)) : labels;
  } catch { expandedGroups = labels; }

  function toggleGroup(label: string, isActive: boolean, event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    if (isActive) return;
    const currentSnapshot = readGroupSnapshot(labels);
    let current: string[];
    try {
      const parsed = JSON.parse(currentSnapshot) as unknown;
      current = Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string" && labels.includes(entry)) : [...labels];
    } catch { current = [...labels]; }
    const next = current.includes(label) ? current.filter((entry) => entry !== label) : [...current, label];
    writeGroupSnapshot(next);
  }

  function navigate() { setMobileOpen(false); }

  return <div className="docs" ref={rootRef}>
    <NoiseGrain />
    <a className="docs-skip" href="#docs-main">Skip to documentation</a>
    <aside className="docs-nav" aria-label="Documentation directory">
      <ThemeSwitch />
      <div className="docs-nav-head"><Link className="docs-brand" href="/"><Logo /><span>DOCS</span></Link>
        <div className="docs-nav-actions">
          <label className="tg docs-theme" htmlFor="theme"><span className="pxw mo"><i className="b" /></span><span className="pxw su"><i className="a" /></span></label>
          <button ref={toggleRef} className="docs-guides-toggle" type="button" aria-expanded={mobileOpen} aria-controls="docs-guides" aria-label="Guides" onClick={() => setMobileOpen(!mobileOpen)}><span className="docs-icon docs-icon-guides" aria-hidden="true" /></button>
        </div></div>
      <div className="docs-guides" id="docs-guides" data-open={mobileOpen}>
        <div className="docs-guides-head"><span>Guides</span><button ref={closeRef} className="docs-guides-close" type="button" aria-label="Close guides" onClick={() => setMobileOpen(false)}><span className="docs-icon docs-icon-close" aria-hidden="true" /></button></div>
        <Link className="docs-back-button" href="/">← BACK TO LOADOUT</Link>
        <DocsSearch key={pathname} />
        <nav className="docs-navigation" aria-label="Documentation sections">
        {groups.map((group) => {
          const activeGroup = group.items.some((item) => item.slug === active);
          const open = activeGroup || expandedGroups.includes(group.label);
          return <details className="docs-group" key={group.label} open={open}>
            <summary onClick={(event) => toggleGroup(group.label, activeGroup, event)}><span>{group.label}</span><span className="docs-group-count">{group.items.length}</span></summary>
            <div className="docs-group-items">{group.items.map((item) => <Link className={active === item.slug ? "section-link active" : "section-link"} href={`/docs/${item.slug}`} aria-current={active === item.slug ? "page" : undefined} key={item.slug} onClick={navigate}>{item.label}</Link>)}</div>
          </details>;
        })}
        <p className="docs-nav-note">Every guide is a draft reference while LOADOUT is in development.</p>
        </nav>
      </div>
      <noscript><style>{".docs .docs-guides{display:block!important;position:static!important;visibility:visible!important;transform:none!important;width:auto!important;height:auto!important;border-right:0!important;box-shadow:none!important}.docs .docs-guides-toggle,.docs .docs-guides-head,.docs .docs-scrim{display:none!important}.docs .docs-back-button{display:flex!important}"}</style></noscript>
    </aside>
    {mobileOpen ? <button className="docs-scrim" type="button" tabIndex={-1} aria-hidden="true" onClick={() => setMobileOpen(false)} /> : null}
    {children}
  </div>;
}
