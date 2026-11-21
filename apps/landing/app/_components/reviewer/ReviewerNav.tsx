"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { PlatformThemeToggle } from "@/app/_components/platform/PlatformThemeToggle";
import { publicPath } from "@/lib/reviewer/host";
import { activeNavHref, type NavLink, type NavModel } from "@/lib/reviewer/nav";

// The reviewer site's top bar, after Pixl's TopNav: a few primary links, then one More menu holding a labelled section per group.
// Counts show as small badges where there is work waiting. Root-relative links (the review host serves them at "/", "/review").
// It reuses the platform's top-bar token styles (pf-nav) and adds the menu in reviewer.css (rs-). Phones: a labelled button opens
// the list and More is a section inside it.

function Item({ item, count, active, onNavigate }: { item: NavLink; count?: number; active: boolean; onNavigate?: () => void }) {
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} onClick={onNavigate}>
      {item.label}
      {count !== undefined && count > 0 ? <span className="rs-count">{count}</span> : null}
    </Link>
  );
}

// Everything that is not an everyday link, one section per group. A <details>, closed on navigation, on a click outside it
// and on Escape (focus then returns to the button, so a keyboard user is not dropped at the top of the page).
function MoreMenu({
  groups,
  counts,
  activeHref,
  onNavigate,
}: {
  groups: NavModel["groups"];
  counts: Record<string, number>;
  activeHref: string | null;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  const items = groups.flatMap((group) => group.items);
  const active = items.some((item) => item.href === activeHref);
  const total = items.reduce((sum, item) => sum + (counts[item.href] ?? 0), 0);

  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      const menu = ref.current;
      if (menu && menu.open && !menu.contains(event.target as Node)) menu.removeAttribute("open");
    }
    function onKey(event: KeyboardEvent) {
      const menu = ref.current;
      if (event.key !== "Escape" || !menu?.open) return;
      menu.removeAttribute("open");
      menu.querySelector("summary")?.focus();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className="rs-more" data-active={active ? "true" : undefined}>
      <summary>
        More
        {total > 0 ? <span className="rs-count">{total}</span> : null}
        <span className="rs-caret" aria-hidden="true" />
      </summary>
      <div className="rs-more-panel">
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`rs-more-${group.key}`}>
            <h2 id={`rs-more-${group.key}`}>{group.label}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Item item={item} count={counts[item.href]} active={item.href === activeHref} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}

export function ReviewerNav({ name, nav, counts }: Readonly<{ name: string; nav: NavModel; counts: Record<string, number> }>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const activeHref = activeNavHref(pathname, nav);

  return (
    <>
      <button type="button" className="pf-btn pf-nav-toggle" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((value) => !value)}>
        {open ? "Close" : "Menu"}
      </button>
      <nav aria-label="Reviewer site" className="pf-nav rs-nav" id={listId} data-open={open}>
        <ul className="rs-bar">
          {nav.primary.map((item) => (
            <li key={item.href}>
              <Item item={item} count={counts[item.href]} active={item.href === activeHref} onNavigate={() => setOpen(false)} />
            </li>
          ))}
          {nav.groups.length > 0 ? (
            <li className="rs-more-item">
              <MoreMenu groups={nav.groups} counts={counts} activeHref={activeHref} onNavigate={() => setOpen(false)} />
            </li>
          ) : null}
        </ul>
        {/* On phones the signed-in name and the theme switch sit in the menu; from 900px they are in the top bar. */}
        <p className="rs-nav-who">
          Signed in as <strong>{name}</strong>
        </p>
        <Link className="rs-nav-settings" href="/settings" aria-current={activeHref === null && publicPath(pathname) === "/settings" ? "page" : undefined} onClick={() => setOpen(false)}>
          Settings
        </Link>
        <div className="pf-nav-theme">
          <PlatformThemeToggle showLabel />
        </div>
      </nav>
    </>
  );
}
