"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { EXPLORE_QUERY_MAX, exploreHref } from "@/lib/platform/explore";
import "./explore.css";

// The one search box of Explore, for projects and builders (a word matches a title, a description or a builder's handle;
// track:tools and by:handle work inside the text). A plain GET form, so Enter or the Search button works with no script
// (?q=). With script, typing re-asks the server for the grid after a short pause (the address changes with router.replace, no new
// history entry, no scroll jump) and the grid below is the only list of results.
//
// Props carry the filters of the current page so the chips and the search agree. The component is not re-keyed on a new
// address: the typed text stays, and a change that did not come from typing (a Clear link, a chip) is copied into the field.
const PAUSE_MS = 300;

export function ExploreSearch({ q, track, saved }: Readonly<{ q: string; track: string | null; saved: boolean }>) {
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(q);
  const sent = useRef(q);
  const [pending, startTransition] = useTransition();

  // An address change that did not come from this field.
  useEffect(() => {
    if (q !== sent.current) {
      sent.current = q;
      setValue(q);
    }
  }, [q]);

  useEffect(() => {
    const text = value.trim().replace(/\s+/g, " ");
    if (text === sent.current) return;
    const pause = setTimeout(() => {
      sent.current = text;
      startTransition(() => router.replace(exploreHref({ q: text, track, saved }), { scroll: false }));
    }, PAUSE_MS);
    return () => clearTimeout(pause);
  }, [value, track, saved, router]);

  return (
    <div className="pf-explore-head">
      <form className="pf-explore-form" method="get" action="/dashboard/explore" role="search">
        <label className="pf-sr" htmlFor={inputId}>Search</label>
        <div className="pf-explore-field">
          <svg className="pf-explore-glass" viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M3 1h4v1H3zM2 2h1v4H2zM7 2h1v4H7zM3 6h4v1H3zM7 7h1v1H7zM8 8h1v1H8zM9 9h1v1H9zM10 10h1v1h-1z" />
          </svg>
          <input
            ref={input}
            id={inputId}
            className="pf-explore-input"
            type="search"
            name="q"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={EXPLORE_QUERY_MAX}
            placeholder="Search projects or builders"
            autoComplete="off"
            enterKeyHint="search"
            aria-describedby={hintId}
          />
          {value !== "" ? (
            <button
              type="button"
              className="pf-explore-clear"
              onClick={() => {
                setValue("");
                input.current?.focus();
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
        {track ? <input type="hidden" name="track" value={track.toLowerCase()} /> : null}
        {saved ? <input type="hidden" name="saved" value="1" /> : null}
        <button type="submit" className="pf-btn pri pf-explore-submit">
          Search
        </button>
      </form>
      <p id={hintId} className="pf-hint pf-explore-hint">
        Try a name, a builder, or track:tools or by:handle.
        <span className="pf-explore-pending" role="status" aria-live="polite">{pending ? " Searching." : ""}</span>
      </p>
    </div>
  );
}
