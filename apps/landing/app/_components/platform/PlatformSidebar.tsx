"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { SIDEBAR_GROUPS } from "@/lib/platform/nav";
import { PlatformAccountMenu } from "./PlatformAccountMenu";
import { PlatformNav } from "./PlatformNav";
import { PlatformThemeToggle } from "./PlatformThemeToggle";

const DESKTOP = "(min-width: 900px)";

// The participant navigation. From 900px up it is a sidebar that is always there: the wordmark, the grouped links and the theme switch.
// The top bar over the page holds the Ore chip and the account menu at the right. Below 900px the sidebar is a drawer: the top bar
// also holds a Menu button on the left, and the button opens the same sidebar over the page. While the drawer is open the page behind it is inert, Tab stays inside,
// Escape or the Close button or a press on the scrim closes it, and focus goes back to the Menu button.
export function PlatformSidebar({ ore, oreTitle, handle, docs }: Readonly<{ ore: number; oreTitle: string; handle: string | null; docs?: ReactNode }>) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const side = useRef<HTMLElement>(null);
  const id = useId();
  // The visible chip names only the confirmed balance; the pending amount must be in the link's accessible name too.
  const pending = oreTitle.match(/([\d,]+) pending/)?.[1];
  const oreLabel = `${ore.toLocaleString("en-GB")} Ore confirmed, ${pending ? `${pending} pending` : "none pending"}.`;

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    // The strip is inert while the drawer is open, and an inert button cannot take focus, so release it first.
    document.getElementById("platform-main")?.removeAttribute("inert");
    document.querySelector(".pf-strip")?.removeAttribute("inert");
    if (restoreFocus) menuButton.current?.focus();
  }, []);

  // Open: the page behind is inert and focus moves into the drawer. A wide window never has an open drawer.
  useEffect(() => {
    if (!open) return;
    const main = document.getElementById("platform-main");
    const strip = document.querySelector<HTMLElement>(".pf-strip");
    main?.setAttribute("inert", "");
    strip?.setAttribute("inert", "");
    side.current?.querySelector<HTMLElement>(".pf-side-close")?.focus();
    const media = window.matchMedia(DESKTOP);
    const widen = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", widen);
    return () => {
      main?.removeAttribute("inert");
      strip?.removeAttribute("inert");
      media.removeEventListener("change", widen);
    };
  }, [open]);

  const keys = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key !== "Tab") return;
    const items = Array.from(side.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)") ?? []).filter((item) => item.offsetParent !== null);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div className="pf-strip">
        <button
          ref={menuButton}
          type="button"
          className="pf-btn pf-strip-menu"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(true)}
        >
          Menu
        </button>
        <Link className="pf-brand pf-strip-brand" href="/dashboard/projects"><span className="lg-text">LOADOUT</span></Link>
        <div className="pf-strip-end">
          {/* Ore is shown on every page: the confirmed amount, linking to the ledger. The title says what is still pending. */}
          <Link
            className="pf-ore"
            href="/dashboard/ledger"
            title={oreTitle}
            aria-label={oreLabel}
          >
            <Image className="pf-ore-icon" src="/loadout/sprites/ore.png" alt="" width={32} height={32} unoptimized />
            <span className="pf-ore-label">Ore</span>
            <span className="pf-ore-value">{ore.toLocaleString("en-GB")}</span>
          </Link>
          <PlatformAccountMenu handle={handle} />
        </div>
      </div>
      <div className="pf-scrim" data-open={open} aria-hidden="true" onClick={() => close(true)} />
      <aside ref={side} id={id} className="pf-side" data-open={open} aria-label="Site" onKeyDown={keys}>
        <div className="pf-side-head">
          <Link className="pf-brand" href="/dashboard/projects" onClick={() => close(false)}><span className="lg-text">LOADOUT</span></Link>
          <button type="button" className="pf-btn pf-side-close" onClick={() => close(true)}>Close</button>
        </div>
        {docs ? (
          // On the documentation pages the docs sections take the place of the participant links. A link followed in here closes the drawer.
          <div className="pf-side-docs" onClick={(event) => { if ((event.target as HTMLElement).closest("a[href]")) close(false); }}>{docs}</div>
        ) : (
          <PlatformNav groups={SIDEBAR_GROUPS} onNavigate={() => close(false)} />
        )}
        <div className="pf-side-foot">
          <PlatformThemeToggle className="pf-side-theme" showLabel />
        </div>
      </aside>
    </>
  );
}
