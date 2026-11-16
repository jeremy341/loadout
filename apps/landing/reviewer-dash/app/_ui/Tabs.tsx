"use client";

import { useState, type ReactNode } from "react";

export interface TabItem {
  key: string;
  label: ReactNode;
  content: ReactNode;
}

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

  return (
    <div>
      <div
        className={`${variant === "segmented" ? "hc-segmented" : "hc-tabs"} ${sticky ? "hc-tabs-sticky" : ""}`}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active}
            className={variant === "segmented" ? "hc-segmented-item" : "hc-tab"}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.key} role="tabpanel" hidden={tab.key !== active}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
