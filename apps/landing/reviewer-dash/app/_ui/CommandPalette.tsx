"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { type GlyphName } from "@hackclub/icons";
import { glyphStyle } from "./glyphs";
import type { NavModel } from "./nav";
import ReviewCheer from "./ReviewCheer";
import { searchIsAbsent } from "./searchProbe";
import Shortcuts, { OPEN_SEARCH_EVENT, OPEN_SHORTCUTS_EVENT } from "./Shortcuts";

interface BuilderHit {
  id: string;
  label: string;
  sub: string;
}
interface ProjectHit {
  id: number;
  label: string;
  sub?: string;
}
interface Hit {
  href: string;
  label: string;
  sub?: string;
  group: string;
  glyph: GlyphName;
}

// Ctrl/Cmd+K (or /): jump to a page, builder or project. Pages are searched here and always work. Builders and projects come from
// /api/search; when that is absent (a 404, an HTML error page, a network failure) the palette stops asking for the rest of the session
// and says it is searching pages only. The desk's shortcut list and the approval celebration are mounted from here because this is the one
// client component the layout already renders.
export default function CommandPalette({ nav }: { nav: NavModel }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [builders, setBuilders] = useState<BuilderHit[]>([]);
  const [projects, setProjects] = useState<ProjectHit[]>([]);
  const [cursor, setCursor] = useState(0);
  // False once /api/search has failed in a way that means it is not there; the rest of the palette keeps working on page names.
  const [remote, setRemote] = useState(true);

  function open() {
    dialog.current?.showModal();
  }
  function close() {
    dialog.current?.close();
    setQ("");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
      }
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

  useEffect(() => {
    const term = q.trim();
    setCursor(0);
    if (term.length < 2 || !remote) {
      setBuilders([]);
      setProjects([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        // 401, 403 and 404 all mean this desk cannot answer; so does a body that is not JSON (the 404 page is HTML).
        if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) {
          if (searchIsAbsent({ ok: res.ok, status: res.status, contentType: res.headers.get("content-type") })) setRemote(false);
          return;
        }
        // The endpoint's key is still "players" (Pixl's name); "builders" is read first so the endpoint can be renamed.
        const d = (await res.json()) as { builders?: BuilderHit[]; players?: BuilderHit[]; projects?: ProjectHit[] };
        setBuilders(d.builders ?? d.players ?? []);
        setProjects(d.projects ?? []);
      } catch (err) {
        if ((err as { name?: string } | null)?.name !== "AbortError") setRemote(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, remote]);

  const ql = q.trim().toLowerCase();
  const pages: Hit[] = [
    ...nav.primary.map((item) => ({ ...item, group: "Pages" })),
    ...nav.groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label }))),
  ]
    .filter((item) => !ql || item.label.toLowerCase().includes(ql))
    .map(({ href, label, group, glyph }) => ({ href, label, group, glyph }));
  const hits: Hit[] = [
    ...pages,
    ...builders.map((p) => ({ href: `/players/${p.id}`, label: p.label, sub: p.sub, group: "Builders", glyph: "person" as const })),
    ...projects.map((p) => ({ href: `/projects/${p.id}`, label: p.label, sub: p.sub, group: "Projects", glyph: "rep" as const })),
  ];

  function go(href: string) {
    close();
    router.push(href);
  }

  return (
    <>
      <button type="button" className="hc-search-trigger" onClick={open}>
        <Icon glyph="search" size={18} aria-hidden />
        <span className="flex-1 truncate text-left">{remote ? "Search pages, builders, projects..." : "Search pages..."}</span>
        <span className="flex shrink-0 gap-1">
          <kbd className="hc-kbd">Ctrl</kbd>
          <kbd className="hc-kbd">K</kbd>
        </span>
      </button>

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
            placeholder={remote ? "Search pages, builders, projects..." : "Search pages..."}
            aria-label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, hits.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter" && hits[cursor]) {
                e.preventDefault();
                go(hits[cursor].href);
              }
            }}
          />
          <button type="button" className="hc-kbd" onClick={close}>
            Esc
          </button>
        </div>
        <p className="rv-search-note" aria-live="polite">
          {remote ? "" : "Pages only. Builder and project search is not connected."}
        </p>
        <ul className="hc-search-results">
          {hits.length === 0 && <li className="hc-caption p-6 text-center text-sm">No results found.</li>}
          {hits.map((hit, i) => (
            <li key={`${hit.group}:${hit.href}`}>
              {(i === 0 || hits[i - 1].group !== hit.group) && <p className="hc-search-group">{hit.group}</p>}
              <button
                type="button"
                className="hc-search-item"
                aria-pressed={i === cursor}
                ref={i === cursor ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                onMouseMove={() => setCursor(i)}
                onClick={() => go(hit.href)}
              >
                <Icon glyph={hit.glyph} size={18} style={glyphStyle(hit.glyph)} aria-hidden />
                <span className="truncate">{hit.label}</span>
                {hit.sub && <span className="hc-muted ml-auto truncate text-xs">{hit.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="hc-search-footer">
          <span>
            <kbd className="hc-kbd">↑</kbd> <kbd className="hc-kbd">↓</kbd> to move
          </span>
          <span>
            <kbd className="hc-kbd">Enter</kbd> to open
          </span>
          <span>
            <kbd className="hc-kbd">Esc</kbd> to close
          </span>
          <button
            type="button"
            className="hc-kbd"
            onClick={() => {
              close();
              window.dispatchEvent(new Event(OPEN_SHORTCUTS_EVENT));
            }}
          >
            ? shortcuts
          </button>
        </div>
      </dialog>
      <Shortcuts nav={nav} />
      <ReviewCheer />
    </>
  );
}
