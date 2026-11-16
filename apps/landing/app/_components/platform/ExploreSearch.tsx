"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchRow } from "@/lib/platform/discover-data";
import { EXPLORE_QUERY_MAX, exploreHref, liveSearchUrl } from "@/lib/platform/explore";
import { ProjectResultRow } from "./ProjectResultRow";
import { SaveButton } from "./SaveButton";
import "./explore.css";

// The search-first header of Explore. A plain GET form (works with no script: Enter or the Search button opens the full
// results page, ?q=). With script, the rows for what you typed appear under the field after a short pause, in a results region
// that is part of the page (no popup, no listbox, no focus trap), and the status line says how many matched.
//
// Props carry the filters of the current page so the live rows and the "Show all results" link agree with the chips.
type Phase = "idle" | "loading" | "done" | "empty" | "error" | "slow";

export function ExploreSearch({ q, track, saved }: Readonly<{ q: string; track: string | null; saved: boolean }>) {
  const inputId = useId();
  const hintId = useId();
  const regionId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(q);
  // Rows appear only after the person types; the first paint of a results page shows the server grid instead.
  const [touched, setTouched] = useState(false);
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!touched) return;
    const text = value.trim();
    // An empty field shows nothing (see `active` below), so there is nothing to fetch or reset.
    if (text === "") return;
    const controller = new AbortController();
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    const pause = setTimeout(async () => {
      // "Searching." only if the answer takes more than 200 ms; the old rows stay until the new ones arrive.
      loadingTimer = setTimeout(() => {
        setPhase("loading");
        setStatus("Searching.");
      }, 200);
      try {
        const response = await fetch(liveSearchUrl({ q: text, track: track ? track.toLowerCase() : null, saved }), {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (response.status === 429) {
          setPhase("slow");
          setStatus("Searching too fast. Wait a moment.");
          return;
        }
        if (!response.ok) throw new Error("search failed");
        const body = (await response.json()) as { rows: SearchRow[]; total: number };
        setRows(body.rows);
        setTotal(body.total);
        setPhase(body.rows.length === 0 ? "empty" : "done");
        setStatus(body.rows.length === 0 ? "No projects match. Clear the search." : `${body.total} ${body.total === 1 ? "project" : "projects"}.`);
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") return;
        setPhase("error");
        setStatus("Search is not available. Try again.");
      } finally {
        clearTimeout(loadingTimer);
      }
    }, 250);
    return () => {
      clearTimeout(pause);
      clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [value, touched, track, saved]);

  function clear() {
    setValue("");
    setTouched(true);
    input.current?.focus();
  }

  const active = touched && value.trim() !== "";
  const showRows = active && rows.length > 0 && phase !== "empty";
  const showEmpty = active && phase === "empty";
  const clearHref = exploreHref({ q: "", track, saved });
  const allHref = exploreHref({ q: value.trim(), track, saved });

  return (
    <div className="pf-explore-head">
      <form className="pf-explore-form" method="get" action="/dashboard/explore" role="search">
        <label className="pf-explore-label" htmlFor={inputId}>
          Search
        </label>
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
            onChange={(event) => {
              setValue(event.target.value);
              setTouched(true);
            }}
            maxLength={EXPLORE_QUERY_MAX}
            placeholder="Find a project or a builder"
            autoComplete="off"
            enterKeyHint="search"
            aria-describedby={hintId}
            aria-controls={regionId}
          />
          {value !== "" ? (
            <Link
              className="pf-explore-clear"
              href={clearHref}
              onClick={(event) => {
                event.preventDefault();
                clear();
              }}
            >
              Clear
            </Link>
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
      </p>

      <div id={regionId} className="pf-explore-live" data-open={showRows || showEmpty || (active && (phase === "error" || phase === "slow")) ? "true" : undefined} aria-busy={phase === "loading" ? true : undefined}>
        <p className="pf-hint pf-explore-status" role="status" aria-live="polite" data-error={phase === "error" || phase === "slow" ? "true" : undefined}>
          {active ? status : ""}
        </p>
        {showRows ? (
          <>
            <ul className="pf-explore-results">
              {rows.map((row) => (
                <ProjectResultRow
                  key={row.id}
                  as="li"
                  row={row}
                  query={value}
                  href={`/dashboard/explore/${row.id}`}
                  saveSlot={<SaveButton projectId={row.id} saved={row.saved} title={row.title} variant="row" />}
                />
              ))}
            </ul>
            <p className="pf-explore-all">
              <Link href={allHref}>Show all results{total > rows.length ? ` (${total})` : ""}</Link>
            </p>
          </>
        ) : null}
        {showEmpty ? (
          <p className="pf-explore-all">
            <Link
              href={clearHref}
              onClick={(event) => {
                event.preventDefault();
                clear();
              }}
            >
              Clear the search
            </Link>
          </p>
        ) : null}
        {active && (phase === "error" || phase === "slow") ? (
          <p className="pf-explore-all">
            <Link href={allHref}>Show all results</Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
