"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toggleBookmark } from "@/lib/platform/bookmark-actions";
import "./discover.css";

// Save (bookmark) a project. Native button, aria-pressed carries the state; the accessible name is always "Save {title}"
// and never changes with the state (visible text "Save" / "Saved" only in the `button` variant).
//
// Optimistic: flips at once, calls toggleBookmark, rolls back and reports the message if the action fails or returns an error.
// A press while a save is in flight is ignored (aria-disabled, focus stays on the button).
//
// Status line: after each result the button dispatches a window event ("pf-save-status", detail { message, error }).
// A page hosts ONE <SavedStatus /> (a role="status" polite region, always rendered). A page that owns its own live region
// (the Toolbelt finder) can instead listen with onSaveStatus(handler) and write the text into its line.
//   <SavedStatus />                         stand-alone region, class "pf-hint pf-saved-status"
//   onSaveStatus((detail) => ...) -> off()  detail: { message: string; error: boolean }
// onChange(saved) runs on the flip and again with the old value if it is rolled back.
export const SAVE_STATUS_EVENT = "pf-save-status";
export type SaveStatusDetail = { message: string; error: boolean };

export function onSaveStatus(handler: (detail: SaveStatusDetail) => void): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<SaveStatusDetail>).detail);
  window.addEventListener(SAVE_STATUS_EVENT, listener);
  return () => window.removeEventListener(SAVE_STATUS_EVENT, listener);
}

function announce(detail: SaveStatusDetail) {
  window.dispatchEvent(new CustomEvent<SaveStatusDetail>(SAVE_STATUS_EVENT, { detail }));
}

export function SavedStatus({ className = "" }: Readonly<{ className?: string }>) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = onSaveStatus((detail) => {
      // One message after a short pause so a screen reader does not hear a burst.
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setMessage(detail.message);
        setError(detail.error);
      }, 250);
    });
    return () => {
      off();
      if (timer) clearTimeout(timer);
    };
  }, []);
  return (
    <p
      className={`pf-hint pf-saved-status ${className}`.trim()}
      role="status"
      aria-live="polite"
      data-error={error ? "true" : undefined}
    >
      {message}
    </p>
  );
}

// 12 by 12 pixel grid, crisp edges. Filled when saved; outline (one cell ring, 2 px at the 24 px size) when not, so the
// state is not colour alone.
const STAR = [
  "000001100000",
  "000001100000",
  "000011110000",
  "111111111111",
  "011111111110",
  "001111111100",
  "000111111000",
  "001111111100",
  "001111111100",
  "011110011110",
  "011100001110",
  "011000000110",
];

function starPath(outline: boolean): string {
  const on = (x: number, y: number) => STAR[y]?.[x] === "1";
  let d = "";
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if (!on(x, y)) continue;
      const inner = on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1);
      if (outline && inner) continue;
      d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

export const STAR_PATH_FILLED = starPath(false);
export const STAR_PATH_OUTLINE = starPath(true);

function Star({ saved }: { saved: boolean }) {
  return (
    <svg
      className="pf-save-star"
      viewBox="0 0 12 12"
      width="24"
      height="24"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <path d={saved ? STAR_PATH_FILLED : STAR_PATH_OUTLINE} fill="currentColor" />
    </svg>
  );
}

export function SaveButton({
  projectId,
  saved,
  title,
  variant,
  onChange,
}: Readonly<{
  projectId: string;
  saved: boolean;
  title: string;
  variant: "card" | "row" | "button";
  onChange?: (saved: boolean) => void;
}>) {
  const [value, setValue] = useState(saved);
  const [seen, setSeen] = useState(saved);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  // A new `saved` prop from the server (after a revalidate) wins over the local copy.
  if (saved !== seen) {
    setSeen(saved);
    setValue(saved);
  }

  function press() {
    if (busy.current) return;
    busy.current = true;
    const next = !value;
    setValue(next);
    onChange?.(next);
    const body = new FormData();
    body.set("projectId", projectId);
    startTransition(async () => {
      try {
        const result = await toggleBookmark({ status: "idle" }, body);
        if (result.status === "error") throw new Error(result.message);
        announce({ message: next ? "Saved." : "Removed from Saved.", error: false });
      } catch (e) {
        setValue(!next);
        onChange?.(!next);
        const known = e instanceof Error && e.message !== "" && e.message.length < 120 && /\.$/.test(e.message);
        announce({ message: known ? (e as Error).message : "Could not save. Try again.", error: true });
      } finally {
        busy.current = false;
      }
    });
  }

  return (
    <button
      type="button"
      className={`pf-save pf-save-${variant}`}
      aria-pressed={value}
      aria-disabled={pending ? true : undefined}
      data-saved={value ? "true" : "false"}
      onClick={press}
    >
      <Star saved={value} />
      {variant === "button" ? (
        <span className="pf-save-label" aria-hidden="true">
          {value ? "Saved" : "Save"}
        </span>
      ) : null}
      <span className="pf-sr">Save {title}</span>
    </button>
  );
}
