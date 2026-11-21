"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { groupStarts, PALETTE_QUERY_MAX, searchPalette, type PaletteEntry } from "@/lib/reviewer/palette";

// Pixl's command palette (Ctrl+K), as a keyboard-accessible <dialog>. A wide field in the top bar opens it; "/" or Ctrl/Cmd+K
// does too. Type to jump to a page this role may open, or to a sample player, project, ship, order or ticket. The results are
// plain links: Arrow keys move between the field and the links, Enter opens, Escape closes. The server sends only the entries
// the role may open (lib/reviewer/palette.ts), so nothing is hidden by the client alone.

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
}

export function CommandPalette({ entries }: Readonly<{ entries: PaletteEntry[] }>) {
  const router = useRouter();
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchPalette(entries, query), [entries, query]);
  const starts = useMemo(() => groupStarts(results), [results]);

  function open() {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }
  function close() {
    dialog.current?.close();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const modified = event.ctrlKey || event.metaKey;
      if (modified && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else dialog.current?.showModal();
      } else if (event.key === "/" && !modified && !event.altKey && !isTyping(event.target) && !dialog.current?.open) {
        event.preventDefault();
        dialog.current?.showModal();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // A page change (a result was opened, or the browser went back) closes the dialog.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  // Arrow keys step between the field and the result links, so the focus ring always shows where Enter will go.
  function onKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const stops = [field.current, ...Array.from(dialog.current?.querySelectorAll<HTMLElement>(".rs-pal-results a") ?? [])].filter((node): node is HTMLElement => node !== null);
    const at = stops.indexOf(document.activeElement as HTMLElement);
    if (at === -1) return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? Math.min(at + 1, stops.length - 1) : Math.max(at - 1, 0);
    stops[next].focus();
  }

  const typed = query.trim().length > 0;

  return (
    <>
      <button type="button" className="rs-search" onClick={open} aria-haspopup="dialog" aria-keyshortcuts="/ Control+K">
        <span className="rs-search-text">Search pages, players, projects</span>
        <span className="rs-keys" aria-hidden="true">
          <kbd>/</kbd>
          <kbd>Ctrl K</kbd>
        </span>
      </button>

      <dialog
        ref={dialog}
        className="rs-palette"
        aria-label="Search"
        onClose={() => setQuery("")}
        onKeyDown={onKeyDown}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
      >
        <div className="rs-pal-head">
          <input
            ref={field}
            type="search"
            name="q"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            maxLength={PALETTE_QUERY_MAX}
            aria-label="Search pages, players, projects, ships and orders"
            placeholder="Search pages, players, projects"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) {
                event.preventDefault();
                close();
                router.push(results[0].href);
              }
            }}
          />
          <button type="button" className="rs-pal-close" onClick={close}>
            Close
          </button>
        </div>

        <p className="pf-sr" role="status">
          {results.length === 0 ? "No results." : `${results.length} ${results.length === 1 ? "result" : "results"}.`}
        </p>

        {results.length === 0 ? (
          <p className="rs-pal-empty">{typed ? "Nothing matches that." : "Nothing to search."}</p>
        ) : (
          <ul className="rs-pal-results">
            {results.map((entry, index) => (
              <li key={`${entry.group}:${entry.href}`}>
                {starts.has(index) ? <p className="rs-pal-group">{entry.group}</p> : null}
                <Link href={entry.href} onClick={close}>
                  <span className="rs-pal-label">{entry.label}</span>
                  {entry.sub ? <span className="rs-pal-sub">{entry.sub}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="rs-pal-foot">
          <span>
            <kbd>Up</kbd> <kbd>Down</kbd> to move
          </span>
          <span>
            <kbd>Enter</kbd> to open
          </span>
          <span>
            <kbd>Esc</kbd> to close
          </span>
        </p>
      </dialog>
    </>
  );
}
