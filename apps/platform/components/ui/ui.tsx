"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import "./ui.css";

// Shared building blocks for every platform page. They use the shell's tokens (see app/globals.css) and the
// plain classes in ui.css, so a page needs no CSS of its own for the common cases.

export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="pg-head">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <div className="pg-head-row">
        <h1>{title}</h1>
        {actions ? <div className="pg-actions">{actions}</div> : null}
      </div>
      {lead ? <p className="lead">{lead}</p> : null}
    </header>
  );
}

/** One line under the header that says what is real and what is sample. Put it on every page. */
export function PreviewNote({ children }: { children?: ReactNode }) {
  return (
    <p className="pv-note" role="note">
      <strong>Preview.</strong>{" "}
      {children ?? "Figures are sample data and your changes are saved only in this browser. Nothing is sent to LOADOUT."}
    </p>
  );
}

export function Panel({
  title,
  actions,
  children,
  as: Tag = "section",
  className = "",
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  as?: "section" | "div" | "article" | "li";
  className?: string;
}) {
  const id = useId();
  return (
    <Tag className={`pn ${className}`.trim()} aria-labelledby={title ? id : undefined}>
      {title || actions ? (
        <div className="pn-head">
          {title ? <h2 id={id}>{title}</h2> : <span />}
          {actions ? <div className="pg-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="stat-grid">{children}</div>;
}

export function Tag({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "accent" | "ok" | "warn" | "bad" }) {
  return <span className={`tg tg-${tone}`}>{children}</span>;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)}>
      <div className="meter-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** A labelled form row. `children` is the control (input, select, textarea). */
export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <label className="fld">
      <span className="fld-label">{label}</span>
      {children}
      {hint ? <span className="fld-hint">{hint}</span> : null}
      {error ? (
        <span className="fld-error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export interface TabDef {
  id: string;
  label: string;
  panel: ReactNode;
  count?: number;
}

/** WAI-ARIA tabs with arrow, Home and End keys. */
export function Tabs({ tabs, label, initial }: { tabs: TabDef[]; label: string; initial?: string }) {
  const base = useId();
  const [active, setActive] = useState(initial && tabs.some((t) => t.id === initial) ? initial : tabs[0]?.id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className="tabs">
      <div role="tablist" aria-label={label} className="tabs-list">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            className="tabs-tab"
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => onKey(event, index)}
          >
            {tab.label}
            {typeof tab.count === "number" ? <span className="tabs-count">{tab.count}</span> : null}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="tabs-panel"
        >
          {active === tab.id ? tab.panel : null}
        </div>
      ))}
    </div>
  );
}

/** A polite live region for "Saved", "Added to wishlist" style feedback. Render it once per page and feed it a string. */
export function Status({ message }: { message: string }) {
  return (
    <p className="pg-status" role="status" aria-live="polite">
      {message}
    </p>
  );
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
