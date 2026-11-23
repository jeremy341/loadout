"use client";

import Icon from "@hackclub/icons";
import { glyphStyle } from "./glyphs";
import { startsGroup, type Hit } from "./paletteSearch";

const SEARCH_ALL = "Search pages, builders, projects...";
const SEARCH_PAGES = "Search pages...";

export function searchPlaceholder(remote: boolean): string {
  return remote ? SEARCH_ALL : SEARCH_PAGES;
}

function HitRow({
  hit,
  active,
  onHover,
  onOpen,
}: {
  hit: Hit;
  active: boolean;
  onHover: () => void;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="hc-search-item"
      aria-pressed={active}
      ref={active ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
      onMouseMove={onHover}
      onClick={onOpen}
    >
      <Icon glyph={hit.glyph} size={18} style={glyphStyle(hit.glyph)} aria-hidden />
      <span className="truncate">{hit.label}</span>
      {hit.sub && <span className="hc-muted ml-auto truncate text-xs">{hit.sub}</span>}
    </button>
  );
}

export function PaletteResults({
  hits,
  cursor,
  onCursor,
  onOpen,
}: {
  hits: Hit[];
  cursor: number;
  onCursor: (index: number) => void;
  onOpen: (href: string) => void;
}) {
  return (
    <ul className="hc-search-results">
      {hits.length === 0 && <li className="hc-caption p-6 text-center text-sm">No results found.</li>}
      {hits.map((hit, i) => (
        <li key={`${hit.group}:${hit.href}`}>
          {startsGroup(hits, i) && <p className="hc-search-group">{hit.group}</p>}
          <HitRow hit={hit} active={i === cursor} onHover={() => onCursor(i)} onOpen={() => onOpen(hit.href)} />
        </li>
      ))}
    </ul>
  );
}

export function PaletteTrigger({ remote, onOpen }: { remote: boolean; onOpen: () => void }) {
  return (
    <button type="button" className="hc-search-trigger" onClick={onOpen}>
      <Icon glyph="search" size={18} aria-hidden />
      <span className="flex-1 truncate text-left">{searchPlaceholder(remote)}</span>
      <span className="flex shrink-0 gap-1">
        <kbd className="hc-kbd">Ctrl</kbd>
        <kbd className="hc-kbd">K</kbd>
      </span>
    </button>
  );
}

export function PaletteFooter({ onShortcuts }: { onShortcuts: () => void }) {
  return (
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
      <button type="button" className="hc-kbd" onClick={onShortcuts}>
        ? shortcuts
      </button>
    </div>
  );
}
