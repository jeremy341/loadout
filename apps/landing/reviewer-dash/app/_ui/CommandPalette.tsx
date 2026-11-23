"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Icon from "@hackclub/icons";
import type { NavModel } from "./nav";
import { combineHits, isArrowKey, moveCursor, pageHits } from "./paletteSearch";
import { PaletteFooter, PaletteResults, PaletteTrigger, searchPlaceholder } from "./PaletteParts";
import ReviewCheer from "./ReviewCheer";
import Shortcuts, { OPEN_SEARCH_EVENT, OPEN_SHORTCUTS_EVENT } from "./Shortcuts";
import { usePaletteSearch } from "./usePaletteSearch";

function isPaletteToggle(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
}

// Ctrl/Cmd+K (or /): jump to a page, builder or project. Pages are searched here and always work. Builders and projects come from
// /api/search; when that is absent (a 404, an HTML error page, a network failure) the palette stops asking for the rest of the session
// and says it is searching pages only. The desk's shortcut list and the approval celebration are mounted from here because this is the one
// client component the layout already renders.
export default function CommandPalette({ nav }: { nav: NavModel }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const { builders, projects, remote } = usePaletteSearch(q, () => setCursor(0));

  function open() {
    dialog.current?.showModal();
  }
  function close() {
    dialog.current?.close();
    setQ("");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isPaletteToggle(e)) return;
      e.preventDefault();
      if (dialog.current?.open) close();
      else open();
    }
    // The "/" shortcut asks for the palette with this event (Shortcuts.tsx).
    function onOpenRequest() {
      if (!dialog.current?.open) open();
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenRequest);
    };
  }, []);

  const hits = combineHits(pageHits(nav, q), builders, projects);

  function go(href: string) {
    close();
    router.push(href);
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (isArrowKey(e.key)) {
      e.preventDefault();
      setCursor((c) => moveCursor(e.key, c, hits.length));
      return;
    }
    const hit = e.key === "Enter" ? hits[cursor] : undefined;
    if (!hit) return;
    e.preventDefault();
    go(hit.href);
  }

  function openShortcuts() {
    close();
    window.dispatchEvent(new Event(OPEN_SHORTCUTS_EVENT));
  }

  return (
    <>
      <PaletteTrigger remote={remote} onOpen={open} />

      <dialog
        ref={dialog}
        className="hc-dialog hc-search-dialog"
        onClose={() => setQ("")}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <div className="hc-search-input">
          <Icon glyph="search" size={20} className="hc-muted shrink-0" aria-hidden />
          <input
            autoFocus
            placeholder={searchPlaceholder(remote)}
            aria-label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <button type="button" className="hc-kbd" onClick={close}>
            Esc
          </button>
        </div>
        <p className="rv-search-note" aria-live="polite">
          {remote ? "" : "Pages only. Builder and project search is not connected."}
        </p>
        <PaletteResults hits={hits} cursor={cursor} onCursor={setCursor} onOpen={go} />
        <PaletteFooter onShortcuts={openShortcuts} />
      </dialog>
      <Shortcuts nav={nav} />
      <ReviewCheer />
    </>
  );
}
