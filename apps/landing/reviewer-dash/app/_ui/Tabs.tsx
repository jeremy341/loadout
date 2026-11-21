"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  key: string;
  label: ReactNode;
  content: ReactNode;
}

// The client tab pattern: one tab stop on the list (roving tabindex), arrow keys / Home / End move between tabs and activate
// them, and each tab names its panel. Navigation between pages uses LinkTabs (aria-current) instead.
export default function Tabs({
  tabs,
  variant = "underline",
  sticky = false,
}: {
  tabs: TabItem[];
  variant?: "underline" | "segmented";
  sticky?: boolean;
}) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const idOf = (key: string, part: "tab" | "panel") => `${base}-${part}-${key}`;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.key === active);
    if (index < 0) return;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    const key = tabs[next].key;
    setActive(key);
    refs.current[key]?.focus();
  };

  return (
    <div>
      <div
        className={`${variant === "segmented" ? "hc-segmented" : "hc-tabs hc-tabs-wrap"} ${sticky ? "hc-tabs-sticky" : ""}`}
        role="tablist"
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[tab.key] = el;
            }}
            id={idOf(tab.key, "tab")}
            type="button"
            role="tab"
            aria-selected={tab.key === active}
            aria-controls={idOf(tab.key, "panel")}
            tabIndex={tab.key === active ? 0 : -1}
            className={variant === "segmented" ? "hc-segmented-item" : "hc-tab"}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          id={idOf(tab.key, "panel")}
          role="tabpanel"
          aria-labelledby={idOf(tab.key, "tab")}
          hidden={tab.key !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
