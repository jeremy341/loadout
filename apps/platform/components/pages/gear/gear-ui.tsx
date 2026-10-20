"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Field } from "../../ui/ui";
import "./gear.css";
import { PLAN_RULES, TRACKS } from "./data";
import { useGearProfile } from "./gear-store";
import { trackDiscountPercent } from "./logic/pricing";

// Small building blocks shared by the six Gear pages.

/** A 32x32 pixel sprite from /loadout/sprites. Decorative: it has no accessible name. */
export function Sprite({ name, size = 32, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`gr-sprite ${className}`.trim()}
      style={{ width: size, height: size, backgroundImage: `url(/loadout/sprites/${name}.png)` }}
    />
  );
}

/** "1,200 Ore" with the gem. The word Ore is real text, the gem is decoration. */
export function OreAmount({ amount, strong = false }: { amount: number; strong?: boolean }) {
  return (
    <span className={strong ? "gr-ore gr-ore-strong" : "gr-ore"}>
      <Sprite name="ore" size={16} />
      <span>{amount.toLocaleString("en-GB")} Ore</span>
    </span>
  );
}

export function formatOre(amount: number): string {
  return `${amount.toLocaleString("en-GB")} Ore`;
}

/** A fixed-zone timestamp, so the server and the browser print the same text. */
export function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toLocaleString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} UTC`;
}

/**
 * Feeds the page's polite live region. Saying the same sentence twice in a row still announces it, because a
 * zero-width character is toggled onto the end.
 */
export function useAnnounce(): [string, (message: string) => void] {
  const [message, setMessage] = useState("");
  const flip = useRef(false);
  const announce = useCallback((next: string) => {
    flip.current = !flip.current;
    setMessage(flip.current ? next : `${next}​`);
  }, []);
  return [message, announce];
}

/** Labelled area for tools that exist only because the preview has no backend. Say so every time. */
export function PreviewTools({
  title = "Preview tools",
  level = 3,
  children,
  hint,
}: {
  title?: string;
  /** Heading level, so the heading order stays correct where the tools sit. */
  level?: 2 | 3 | 4;
  children: ReactNode;
  hint?: ReactNode;
}) {
  const id = useId();
  const Heading = `h${level}` as "h2" | "h3" | "h4";
  return (
    <section className="gr-tools" aria-labelledby={id}>
      <Heading id={id} className="gr-tools-title">
        {title}
      </Heading>
      {hint ? <p className="mut gr-tools-hint">{hint}</p> : null}
      <div className="gr-tools-body">{children}</div>
    </section>
  );
}

export interface GearTabDef {
  id: string;
  label: string;
  panel: ReactNode;
  count?: number;
}

/** WAI-ARIA tabs that a parent can drive (the shared Tabs component keeps its own state). */
export function GearTabs({
  tabs,
  label,
  value,
  onChange,
}: {
  tabs: GearTabDef[];
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onChange(tabs[next].id);
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
            aria-selected={value === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={value === tab.id ? 0 : -1}
            className="tabs-tab"
            onClick={() => onChange(tab.id)}
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
          hidden={value !== tab.id}
          className="tabs-panel"
        >
          {value === tab.id ? tab.panel : null}
        </div>
      ))}
    </div>
  );
}

/** Where the numbers that decide your price come from: the main track and a level in each track. */
export function ProfilePanel() {
  const { track, setTrack, levels, setLevel } = useGearProfile();
  const id = useId();
  return (
    <details className="gr-profile">
      <summary>Preview profile: main track and levels</summary>
      <div className="gr-profile-body">
        <p className="mut">
          Real levels will come from your approved projects. Until then, set sample levels here to see how your track discount and Field Requisitions change prices. Saved in this browser only.
        </p>
        <div className="form-grid">
          <Field label="Main track">
            <select value={track} onChange={(event) => setTrack(event.target.value as (typeof TRACKS)[number])}>
              {TRACKS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset className="gr-fieldset">
          <legend>Level in each track (0 to {PLAN_RULES.maxLevel})</legend>
          <div className="form-grid">
            {TRACKS.map((name) => (
              <Field
                key={name}
                label={name}
                hint={`${trackDiscountPercent(levels[name])}% permanent discount (draft curve)`}
              >
                <input
                  id={`${id}-${name}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={PLAN_RULES.maxLevel}
                  step={1}
                  value={levels[name]}
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    setLevel(name, Number.isNaN(parsed) ? 0 : parsed);
                  }}
                />
              </Field>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  );
}

/** A level-appropriate label for how an item's access class reads. */
export function accessLabel(access: "open" | "specialist" | "mastery"): string {
  return access === "open" ? "Open equipment" : access === "specialist" ? "Specialist equipment" : "Mastery equipment";
}
