"use client";

import { useRef, useState, useTransition } from "react";
import { toggleKudos } from "@/lib/platform/kudos-actions";
import { kudosLabel } from "@/lib/platform/kudos";
import { SAVE_STATUS_EVENT, type SaveStatusDetail } from "./SaveButton";
import "./kudos.css";

// Kudos on a project: a pixel heart and the count. Native button; aria-pressed carries "you gave kudos" and the accessible name
// is "Kudos for {title}" plus the count, so it never says the same thing for two different states.
//
// Optimistic like SaveButton: flips and moves the count at once, calls toggleKudos, rolls back and says why if the action fails.
// A press while one is in flight is ignored (aria-disabled, focus stays). The result goes to the page's one <SavedStatus /> region
// through the same window event the Save button uses.
// On your own project there is nothing to press: the count shows as plain text with the heart outline.
const HEART = [
  "011100001110",
  "111110011111",
  "111111111111",
  "111111111111",
  "111111111111",
  "011111111110",
  "001111111100",
  "000111111000",
  "000011110000",
  "000001100000",
];

function heartPath(outline: boolean): string {
  const on = (x: number, y: number) => HEART[y]?.[x] === "1";
  let d = "";
  for (let y = 0; y < HEART.length; y++) {
    for (let x = 0; x < 12; x++) {
      if (!on(x, y)) continue;
      const inner = on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1);
      if (outline && inner) continue;
      d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

const FILLED = heartPath(false);
const OUTLINE = heartPath(true);

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg className="pf-kudos-heart" viewBox="0 0 12 10" width="20" height="17" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d={filled ? FILLED : OUTLINE} fill="currentColor" />
    </svg>
  );
}

function announce(detail: SaveStatusDetail) {
  window.dispatchEvent(new CustomEvent<SaveStatusDetail>(SAVE_STATUS_EVENT, { detail }));
}

export function KudosButton({
  projectId,
  title,
  count,
  given,
  own = false,
  variant,
}: Readonly<{ projectId: string; title: string; count: number; given: boolean; own?: boolean; variant: "card" | "button" }>) {
  const [value, setValue] = useState({ given, count });
  const [seen, setSeen] = useState({ given, count });
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  // New numbers from the server (after a revalidate) win over the local copy.
  if (seen.given !== given || seen.count !== count) {
    setSeen({ given, count });
    setValue({ given, count });
  }

  if (own) {
    return (
      <span className={`pf-kudos pf-kudos-${variant} pf-kudos-own`} role="img" aria-label={`${kudosLabel(value.count)} on your project`}>
        <Heart filled={false} />
        <span className="pf-kudos-count" aria-hidden="true">{value.count}</span>
      </span>
    );
  }

  function press() {
    if (busy.current) return;
    busy.current = true;
    const before = value;
    const next = { given: !before.given, count: Math.max(0, before.count + (before.given ? -1 : 1)) };
    setValue(next);
    const body = new FormData();
    body.set("projectId", projectId);
    startTransition(async () => {
      try {
        const result = await toggleKudos({ status: "idle" }, body);
        if (result.status === "error") throw new Error(result.message);
        announce({ message: next.given ? "Kudos given." : "Kudos taken back.", error: false });
      } catch (e) {
        setValue(before);
        const known = e instanceof Error && e.message !== "" && e.message.length < 120 && /\.$/.test(e.message);
        announce({ message: known ? (e as Error).message : "Could not give kudos. Try again.", error: true });
      } finally {
        busy.current = false;
      }
    });
  }

  return (
    <button
      type="button"
      className={`pf-kudos pf-kudos-${variant}`}
      aria-pressed={value.given}
      aria-disabled={pending ? true : undefined}
      data-given={value.given ? "true" : "false"}
      onClick={press}
    >
      <Heart filled={value.given} />
      <span className="pf-kudos-count" aria-hidden="true">{value.count}</span>
      {variant === "button" ? (
        <span className="pf-kudos-label" aria-hidden="true">{value.given ? "Kudos given" : "Give kudos"}</span>
      ) : null}
      <span className="pf-sr">Kudos for {title}, {kudosLabel(value.count)}</span>
    </button>
  );
}
