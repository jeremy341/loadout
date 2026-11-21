"use client";

import { useCallback, useEffect, useId, useReducer, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { groupRows } from "@/lib/platform/search-view";
import {
  FINDER_CLOSED,
  FINDER_EMPTY_TEXT,
  finderReduce,
  finderStatusText,
  type FinderView,
} from "@/lib/platform/toolbelt-ui";
import { ProjectResultRow, type ResultRowData } from "./ProjectResultRow";
import { onSaveStatus, SaveButton } from "./SaveButton";
import "./discover.css";
import "./toolbelt.css";

export type FinderTool = ResultRowData;

type Phase = "idle" | "loading" | "done" | "error" | "limited";
type Group = { key: string; label: string; rows: FinderTool[] };

const DEBOUNCE_MS = 150;
const SLOW_MS = 200;
const STATUS_MS = 250;
const HINT = "Search approved open-source projects from other builders. Press the star to save one for later. Alt+S saves the highlighted tool.";

// Drawn like the plus and the back arrow: a 12 by 12 pixel grid, crisp edges.
function Glass() {
  return (
    <svg className="pf-finder-glass" viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d="M3 1h4v1h1v1h1v4H8v1H7v1H3V8H2V7H1V3h1V2h1zM3 3v4h4V3zM8 8h1v1h1v1h1v1h-1v-1H9V9H8z" fillRule="evenodd" />
    </svg>
  );
}

// "Find a tool" (stardance-layout.md F.3 and F.4): an ARIA 1.2 editable combobox with list autocomplete. The list sits in the page flow
// under the field, so there is no layer and no focus trap. Focus stays in the input while the arrows move the active option
// (aria-activedescendant). The Save star is never inside an option or the listbox: the stars sit in a column beside it.
export function ToolFinder({
  projectId,
  chosen,
  onChoose,
  onEdit,
  inputRef,
}: Readonly<{
  projectId: string;
  chosen: FinderTool | null;
  onChoose: (tool: FinderTool) => void;
  onEdit: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}>) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const listId = `${uid}-list`;
  const hintId = `${uid}-hint`;
  const statusId = `${uid}-status`;
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<FinderTool[]>([]);
  const [total, setTotal] = useState(0);
  // The text the rows on screen were searched for. Enter and Down ignore rows that are older than the text in the field.
  const [rowsFor, setRowsFor] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [list, dispatch] = useReducer(finderReduce, FINDER_CLOSED);
  const [saveNote, setSaveNote] = useState<{ text: string; error: boolean } | null>(null);
  const [live, setLive] = useState("");
  const [seenChosen, setSeenChosen] = useState<FinderTool | null>(chosen);
  const abort = useRef<AbortController | null>(null);
  const typing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const lastSaved = useRef("");
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // A tool picked outside the field (the Saved tools list) fills it; a cancelled step empties it again.
  if (chosen !== seenChosen) {
    setSeenChosen(chosen);
    if (chosen) {
      setQuery(chosen.title);
      dispatch({ type: "close" });
    } else if (seenChosen && query === seenChosen.title) {
      setQuery("");
    }
  }

  const empty = query.trim() === "";
  const fresh = rowsFor === query;
  const groups: Group[] = empty
    ? groupRows(rows).map((group) => ({ key: group.key, label: group.label, rows: group.rows }))
    : [{ key: "results", label: "", rows }];
  const options = groups.flatMap((group) => group.rows);
  const expanded = list.open && options.length > 0;
  const activeRow = list.active >= 0 ? options[list.active] : undefined;
  const optionId = (id: string) => `${uid}-opt-${id}`;

  const run = useCallback(
    async (text: string) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setPhase("loading");
      setSlow(false);
      const slowTimer = setTimeout(() => setSlow(true), SLOW_MS);
      const blank = text.trim() === "";
      try {
        const url = `/platform-search?scope=toolbelt&projectId=${encodeURIComponent(projectId)}&q=${encodeURIComponent(text)}&limit=${blank ? 30 : 8}`;
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (response.status === 429) {
          setPhase("limited");
          return;
        }
        if (!response.ok) throw new Error("search");
        const data = (await response.json()) as { rows: FinderTool[]; total: number };
        const next = data.rows;
        const count = blank ? groupRows(next).reduce((sum, group) => sum + group.rows.length, 0) : next.length;
        setRows(next);
        setRowsFor(text);
        setTotal(data.total);
        setLoaded(true);
        setPhase("done");
        dispatch({ type: "results", count, auto: !blank });
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
        setPhase("error");
      } finally {
        clearTimeout(slowTimer);
        if (abort.current === controller) setSlow(false);
      }
    },
    [projectId],
  );

  useEffect(
    () => () => {
      abort.current?.abort();
      if (typing.current) clearTimeout(typing.current);
    },
    [],
  );

  // Save results from the stars, in the finder's own live line.
  useEffect(
    () =>
      onSaveStatus((detail) => {
        const title = lastSaved.current;
        let text = detail.message;
        if (!detail.error && title) text = detail.message === "Saved." ? `Saved ${title}.` : `Removed ${title} from Saved.`;
        setSaveNote({ text, error: detail.error });
      }),
    [],
  );

  const view: FinderView =
    phase === "limited"
      ? { phase: "limited" }
      : phase === "loading" && slow
        ? { phase: "loading" }
        : phase === "done" && list.open
          ? { phase: "results", count: options.length, query }
          : { phase: "idle" };
  const target = saveNote?.text ?? finderStatusText(view);
  // The line follows after a short pause, so a screen reader hears one message and not one per key.
  useEffect(() => {
    const timer = setTimeout(() => setLive(target), STATUS_MS);
    return () => clearTimeout(timer);
  }, [target]);

  const choose = useCallback(
    (tool: FinderTool) => {
      setQuery(tool.title);
      dispatch({ type: "close" });
      setSaveNote(null);
      onChoose(tool);
    },
    [onChoose],
  );

  // Opening is a click or the Down key, never plain focus: focus is also given by the page (after Remove or Cancel) and must not
  // push the slots down with a list nobody asked for.
  const open = () => {
    if (chosen || list.open) return;
    dispatch({ type: "open" });
    if (!loaded || queryRef.current.trim() === "") void run(queryRef.current);
  };

  const onChange = (value: string) => {
    setQuery(value);
    setSaveNote(null);
    if (chosen) onEdit();
    dispatch({ type: "open" });
    if (typing.current) clearTimeout(typing.current);
    typing.current = setTimeout(() => void run(value), value.trim() === "" ? 0 : DEBOUNCE_MS);
  };

  const clear = () => {
    setQuery("");
    setSaveNote(null);
    if (chosen) onEdit();
    inputRef.current?.focus();
    dispatch({ type: "open" });
    void run("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.altKey && (event.key === "s" || event.key === "S")) {
      event.preventDefault();
      if (activeRow) {
        lastSaved.current = activeRow.title;
        root.current?.querySelector<HTMLButtonElement>(`[data-star-for="${activeRow.id}"] .pf-save`)?.click();
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        if (chosen) return;
        if (!list.open && (!loaded || empty)) void run(query);
        dispatch({ type: event.key === "ArrowDown" ? "next" : "prev", count: options.length });
        return;
      case "Enter":
        if (list.open && !fresh) {
          event.preventDefault();
        } else if (list.open && activeRow) {
          event.preventDefault();
          choose(activeRow);
        } else if (list.open && options.length === 1) {
          event.preventDefault();
          choose(options[0]);
        }
        return;
      case "Escape":
        if (list.open) {
          event.preventDefault();
          event.stopPropagation();
          dispatch({ type: "close" });
        } else if (query !== "") {
          event.preventDefault();
          event.stopPropagation();
          setQuery("");
          setSaveNote(null);
          if (chosen) onEdit();
        }
        return;
      // Tab does not close the list: the Clear button, the Save stars and Try again follow the field in Tab order, so they stay
      // reachable from the keyboard. The list closes on Escape, when focus leaves the finder (onBlur on the root), or on a
      // click outside it (document mousedown below), which also covers a click on a non-focusable element that does not move focus.
    }
  };

  // The active option stays inside the scrolling list; never a smooth scroll, the move came from the keyboard.
  useEffect(() => {
    if (!activeRow) return;
    document.getElementById(optionId(activeRow.id))?.scrollIntoView({ block: "nearest" });
    // optionId is derived from uid, which does not change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRow?.id]);

  // A click outside the finder closes the list even when the click lands on a non-focusable element (the Toolbelt heading) and
  // focus therefore stays on a Save button inside the pop, where onBlur cannot see it. Only mouse clicks trigger this: Tab and
  // the arrow keys must leave the list open while focus is still inside the finder.
  useEffect(() => {
    if (!list.open) return;
    const onOutsideClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) dispatch({ type: "close" });
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [list.open]);

  const tokensQuery = empty ? "" : query;
  const showSkeleton = list.open && phase === "loading" && !loaded;
  const noTools = list.open && phase === "done" && options.length === 0;
  const describedBy = chosen ? hintId : `${hintId} ${statusId}`;

  return (
    <div
      className="pf-finder"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) dispatch({ type: "close" });
      }}
    >
      <label className="pf-finder-label" htmlFor={inputId}>Find a tool</label>
      <div className="pf-finder-field">
        <Glass />
        <input
          id={inputId}
          ref={inputRef}
          data-focus="finder"
          className="pf-finder-input"
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={expanded && activeRow ? optionId(activeRow.id) : undefined}
          aria-readonly={chosen ? true : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
          maxLength={80}
          spellCheck={false}
          value={query}
          onChange={(event) => onChange(event.target.value)}
          onClick={open}
          onKeyDown={onKeyDown}
        />
        {query !== "" ? (
          <button type="button" className="pf-finder-clear" aria-label="Clear search" onClick={clear}>
            <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
              <path d="M2 1h2v1h1v1h2V2h1V1h2v2H9v1H8v1H7v2h1v1h1v1h1v2H8v-1H7V9H5v1H4v1H2V9h1V8h1V7h1V5H4V4H3V3H2z" />
            </svg>
          </button>
        ) : null}
      </div>
      <p className="pf-hint pf-finder-hint" id={hintId}>{HINT}</p>

      {list.open && (expanded || showSkeleton || noTools || phase === "error") ? (
        <div
          className="pf-finder-pop"
          onMouseDown={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            // Escape from a button in the list (a star, Clear, Try again) closes it and hands focus back to the field.
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              dispatch({ type: "close" });
              inputRef.current?.focus();
            }
          }}
        >
          {expanded ? (
            <div className="pf-finder-scroll">
              <div className="pf-finder-cols">
                <div id={listId} className="pf-finder-list" role="listbox" aria-label="Tools" aria-busy={phase === "loading" ? true : undefined}>
                  {groups.map((group) => {
                    const labelId = `${uid}-group-${group.key}`;
                    return (
                      <div role="group" aria-labelledby={group.label ? labelId : undefined} key={group.key}>
                        {group.label ? (
                          <div className="pf-finder-group" id={labelId}>{group.label}</div>
                        ) : null}
                        {group.rows.map((row) => {
                          const index = options.indexOf(row);
                          const name = `${row.title}, by ${row.ownerHandle ?? "a builder"}, used by ${row.usedBy}${row.track ? `, ${row.track}` : ""}${row.saved ? ", saved" : ""}`;
                          return (
                            <div
                              id={optionId(row.id)}
                              className="pf-finder-option"
                              role="option"
                              aria-selected={index === list.active}
                              aria-label={name}
                              data-row-id={row.id}
                              data-active={index === list.active ? "true" : undefined}
                              onClick={() => choose(row)}
                              key={row.id}
                            >
                              <ProjectResultRow row={row} query={tokensQuery} showRepo />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                {/* The stars live beside the listbox, never inside it: a listbox owns only options. Rows have one fixed height so each star lines up with its option. */}
                <div
                  className="pf-finder-stars"
                  onClickCapture={(event) => {
                    const id = (event.target as HTMLElement).closest<HTMLElement>("[data-star-for]")?.dataset.starFor;
                    const row = options.find((item) => item.id === id);
                    if (row) lastSaved.current = row.title;
                  }}
                >
                  {groups.map((group) => (
                    <div key={group.key}>
                      {group.label ? <div className="pf-finder-group-gap" /> : null}
                      {group.rows.map((row) => (
                        <span className="pf-finder-save" data-star-for={row.id} data-active={options.indexOf(row) === list.active ? "true" : undefined} key={row.id}>
                          <SaveButton projectId={row.id} saved={row.saved} title={row.title} variant="row" />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {!empty && total > rows.length ? (
                <p className="pf-hint pf-finder-more">{total - rows.length} more. Keep typing to narrow the list.</p>
              ) : null}
            </div>
          ) : null}
          {showSkeleton ? (
            <div className="pf-finder-skeleton" aria-hidden="true">
              <span /> <span /> <span />
            </div>
          ) : null}
          {noTools && empty ? <p className="pf-finder-note">{FINDER_EMPTY_TEXT}</p> : null}
          {noTools && !empty ? (
            <div className="pf-finder-note">
              <p>No tools match. Clear the search.</p>
              <button type="button" className="pf-btn" onClick={clear}>Clear</button>
            </div>
          ) : null}
          {phase === "error" ? (
            <div className="pf-finder-note">
              <p role="alert">Search is not available. Try again.</p>
              <button type="button" className="pf-btn" onClick={() => void run(query)}>Try again</button>
            </div>
          ) : null}
        </div>
      ) : null}

      <p
        className="pf-hint pf-finder-status"
        id={statusId}
        role="status"
        aria-live="polite"
        data-error={saveNote?.error || phase === "limited" ? "true" : undefined}
      >
        {live}
      </p>
    </div>
  );
}
