"use client";

// Adapted from Pixl's participant shell (references/pixl/apps/web-shell, MIT, Copyright (c) 2026 Pixl). Notice kept in docs/source-audit/ATTRIBUTION.md.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "./icons";
import { Logo } from "./logo";
import { HOME_SLUG, MOBILE_PRIMARY, NAV_GROUPS, type NavItem } from "./nav-data";
import { landingHref } from "../../lib/landing";
import { activeSlugFromPathname, groupId } from "../../lib/navigation";

/** At and below this width the sidebar becomes the bottom dock. Keep in step with globals.css. */
const DOCK_QUERY = "(max-width: 900px)";
const SHEET_ID = "more-sheet";
const FOCUSABLE = "a[href], button:not([disabled])";

function NavEntry({ item, active, secondary }: { item: NavItem; active: boolean; secondary: boolean }) {
  const className = `nav-link${secondary ? " secondary" : ""}`;
  const inner = (
    <>
      <span className="nav-ic">
        <PixelIcon name={item.slug} />
      </span>
      <span className="nav-text">{item.label}</span>
      {item.external ? (
        <>
          <span className="nav-ext">
            <PixelIcon name="external" />
          </span>
          <span className="sr-only"> (public Docs, leaves the platform)</span>
        </>
      ) : null}
    </>
  );

  // Docs lives on the public site: an ordinary anchor, not a client-side route.
  if (item.external) {
    return (
      <a className={className} href={landingHref(`/${item.slug}`)}>
        {inner}
      </a>
    );
  }
  return (
    <Link className={className} href={`/${item.slug}`} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  );
}

export function ShellNav() {
  const pathname = usePathname();
  const activeSlug = activeSlugFromPathname(pathname);

  // The sheet is open for the page it was opened on, so it closes by itself on any navigation.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  const moreRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Everything the sheet adds while open: focus moves in, the page behind is inert, Escape closes and
  // returns focus to MORE, Tab wraps between MORE and the sheet, and a switch to the wide layout closes it.
  useEffect(() => {
    if (!open) return;
    const page = document.querySelector<HTMLElement>(".shell-main");
    if (page) page.inert = true;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenAt(null);
        moreRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const stops = [moreRef.current, ...Array.from(sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
        (element): element is HTMLElement => element !== null,
      );
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) return;
      const current = document.activeElement;
      const inside = current instanceof HTMLElement && stops.includes(current);
      if (event.shiftKey && (current === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    }

    const dock = window.matchMedia(DOCK_QUERY);
    function onLayoutChange(event: MediaQueryListEvent) {
      if (!event.matches) setOpenAt(null);
    }

    document.addEventListener("keydown", onKeyDown);
    dock.addEventListener("change", onLayoutChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      dock.removeEventListener("change", onLayoutChange);
      if (page) page.inert = false;
    };
  }, [open]);

  function closeAndRestoreFocus() {
    setOpenAt(null);
    moreRef.current?.focus();
  }

  return (
    <aside className="sidebar" aria-label="LOADOUT platform">
      <Link className="sb-logo" href={`/${HOME_SLUG}`} aria-label="LOADOUT, Overview">
        <Logo />
      </Link>
      <nav className="nav" aria-label="Platform sections">
        {NAV_GROUPS.map((group) => {
          const id = groupId(group.label);
          return (
            <div className="nav-group" role="group" aria-labelledby={`nav-label-${id}`} key={group.label} inert={open}>
              <div className="nav-label" id={`nav-label-${id}`}>
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavEntry
                  key={item.slug}
                  item={item}
                  active={item.slug === activeSlug}
                  secondary={!MOBILE_PRIMARY.includes(item.slug)}
                />
              ))}
            </div>
          );
        })}
        <button
          ref={moreRef}
          type="button"
          className="nav-more"
          aria-expanded={open}
          aria-controls={SHEET_ID}
          aria-haspopup="dialog"
          onClick={() => setOpenAt(open ? null : pathname)}
        >
          <span className="nav-ic">
            <PixelIcon name="more" />
          </span>
          <span className="nav-text">More</span>
        </button>
      </nav>

      <div className="nav-scrim" hidden={!open} aria-hidden="true" onClick={() => setOpenAt(null)} />
      <div
        id={SHEET_ID}
        ref={sheetRef}
        className="nav-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="more-sheet-title"
        hidden={!open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpenAt(null);
        }}
      >
        <div className="sheet-head">
          <h2 id="more-sheet-title">More sections</h2>
          <button ref={closeRef} type="button" className="sheet-close" onClick={closeAndRestoreFocus}>
            Close
          </button>
        </div>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !MOBILE_PRIMARY.includes(item.slug));
          if (items.length === 0) return null;
          const id = groupId(group.label);
          return (
            <div className="sheet-group" role="group" aria-labelledby={`sheet-label-${id}`} key={group.label}>
              <div className="nav-label" id={`sheet-label-${id}`}>
                {group.label}
              </div>
              <div className="sheet-grid">
                {items.map((item) => (
                  <NavEntry key={item.slug} item={item} active={item.slug === activeSlug} secondary={false} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
