"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import "./profile.css";

export type ProfileTabItem<K extends string = string> = { key: K; label: string; count?: number; panel: ReactNode };

// The event a link inside one tab fires to open another tab without a page load ("3 ship checks left" opens Ship).
export const OPEN_TAB_EVENT = "pf-open-tab";

// An internal tab row, used on the profile (Projects, Activity) and on the owner's project page. Every panel is rendered on the
// server, so the open tab is right on first paint and a reload keeps it (the address carries ?tab=; the default tab has no
// query). Arrow keys, Home and End move between tabs and select them; only the open tab is a tab stop. The `line` look is an
// underlined row that scrolls sideways on a phone instead of wrapping.
export function ProfileTabs<K extends string>({
  items,
  initial,
  base,
  defaultKey,
  label = "Profile sections",
  idPrefix = "pf",
  line = false,
}: Readonly<{ items: ProfileTabItem<K>[]; initial: K; base: string; defaultKey?: K; label?: string; idPrefix?: string; line?: boolean }>) {
  const fallback = defaultKey ?? items[0].key;
  const [active, setActive] = useState<K>(initial);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = useCallback(
    (key: K, focus: boolean) => {
      setActive(key);
      try {
        window.history.replaceState(window.history.state, "", key === fallback ? base : `${base}?tab=${key}`);
      } catch {
        // The address is a convenience; the tab still works without it.
      }
      if (focus) refs.current[key]?.focus();
    },
    [base, fallback],
  );

  useEffect(() => {
    const onOpen = (event: Event) => {
      const key = (event as CustomEvent<string>).detail;
      const item = items.find((entry) => entry.key === key);
      if (item) select(item.key, false);
    };
    window.addEventListener(OPEN_TAB_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TAB_EVENT, onOpen);
  }, [items, select]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const last = items.length - 1;
    const next = event.key === "ArrowRight" ? (index + 1) % items.length : event.key === "ArrowLeft" ? (index - 1 + items.length) % items.length : event.key === "Home" ? 0 : event.key === "End" ? last : -1;
    if (next < 0) return;
    event.preventDefault();
    select(items[next].key, true);
  };

  return (
    <div className={line ? "pf-prof-tabs pf-tabs-line" : "pf-prof-tabs"}>
      <div className="pf-prof-tablist" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            key={item.key}
            ref={(node) => {
              refs.current[item.key] = node;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.key}`}
            aria-selected={active === item.key}
            aria-controls={`${idPrefix}-panel-${item.key}`}
            tabIndex={active === item.key ? 0 : -1}
            className="pf-prof-tab"
            onClick={() => select(item.key, false)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item.label}
            {item.count !== undefined ? <span className="pf-prof-n">{item.count}</span> : null}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div key={item.key} role="tabpanel" id={`${idPrefix}-panel-${item.key}`} aria-labelledby={`${idPrefix}-tab-${item.key}`} tabIndex={0} className="pf-prof-panel" hidden={active !== item.key}>
          {item.panel}
        </div>
      ))}
    </div>
  );
}

// A link that opens another tab on the same page. With no script it is a plain link to ?tab=, which the server renders open.
export function TabLink({ tab, href, children }: Readonly<{ tab: string; href: string; children: ReactNode }>) {
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent(OPEN_TAB_EVENT, { detail: tab }));
      }}
    >
      {children}
    </a>
  );
}
