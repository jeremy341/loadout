"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import type { DocsGroup } from "./docs-data";
import { DocsSearch } from "./DocsSearch";

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

  return <div className="docs">
    <a className="docs-skip" href="#docs-main">Skip to documentation</a>
    <aside className="docs-nav" aria-label="Documentation directory">
      <div className="docs-nav-head"><Link className="docs-brand" href="/">LOADOUT <span>DOCS</span></Link><p>Build, ship, and understand LOADOUT</p></div>
      <Link className="docs-back-button" href="/">← BACK TO LOADOUT</Link>
      <DocsSearch key={pathname} />
      <button className="docs-mobile-toggle" type="button" aria-expanded={mobileOpen} aria-controls="docs-navigation" onClick={() => setMobileOpen(!mobileOpen)}>Browse topics <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span></button>
      <nav className="docs-navigation" id="docs-navigation" data-open={mobileOpen} aria-label="Documentation sections">
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
      <noscript><style>{".docs .docs-navigation{display:block!important}.docs .docs-mobile-toggle{display:none!important}"}</style></noscript>
    </aside>
    {children}
  </div>;
}
