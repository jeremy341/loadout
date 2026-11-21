"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Icon from "@hackclub/icons";
import { glyphStyle } from "./glyphs";
import { activeNavHref, type NavGroup, type NavItem, type NavModel } from "./nav";

// A count says what it counts: the label is the tooltip, the words a screen reader hears, and (inside a menu, where there is room and
// no hover on a phone) a line of small text under the link.
function NavLink({ item, count, label, active }: { item: NavItem; count?: number; label?: string; active: boolean }) {
  const shown = count !== undefined && count > 0;
  return (
    <Link href={item.href} className="hc-nav-link" data-active={active ? true : undefined}>
      <Icon glyph={item.glyph} size={20} style={glyphStyle(item.glyph)} aria-hidden />
      {item.label}
      {shown && <span className="hc-nav-count" title={label} aria-hidden={label ? true : undefined}>{count}</span>}
      {shown && label && <span className="sr-only">{label}</span>}
      {shown && label && <span className="hc-nav-count-note" aria-hidden>{label}</span>}
    </Link>
  );
}

// Everything that isn't an everyday link, one section per group.
function MoreMenu({
  groups,
  counts,
  countLabels,
  activeHref,
  label = "More",
  className = "",
}: {
  groups: NavGroup[];
  counts: Record<string, number>;
  countLabels: Record<string, string>;
  activeHref: string | null;
  label?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLDetailsElement>(null);
  const items = groups.flatMap((g) => g.items);
  const active = items.some((item) => item.href === activeHref);
  const total = items.reduce((sum, item) => sum + (counts[item.href] ?? 0), 0);

  // Close on navigation, outside click and Escape.
  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) ref.current.removeAttribute("open");
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") ref.current?.removeAttribute("open");
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className={`hc-nav-menu ${className}`} data-active={active ? true : undefined}>
      <summary className="hc-nav-link">
        <Icon glyph="menu" size={20} aria-hidden />
        {label}
        {total > 0 && (
          <span className="hc-nav-count" title={items.filter((item) => counts[item.href]).map((item) => countLabels[item.href]).filter(Boolean).join(". ") || undefined}>
            {total}
          </span>
        )}
        <Icon glyph="down-caret" size={16} aria-hidden />
      </summary>
      <div className="hc-nav-menu-panel hc-nav-mega">
        {groups.map((group) => (
          <section key={group.label}>
            <p className="hc-eyebrow px-2 pt-1 pb-1">{group.label}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} count={counts[item.href]} label={countLabels[item.href]} active={item.href === activeHref} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}

export default function TopNav({ nav, counts, countLabels = {} }: { nav: NavModel; counts: Record<string, number>; countLabels?: Record<string, string> }) {
  const activeHref = activeNavHref(usePathname(), nav);
  // Wide screens: the everyday links in the bar and the rest under More. Narrow screens: one Menu with everything in it, so the bar
  // never grows wider than the screen.
  const everything: NavGroup[] = [{ label: "Main", glyph: "list", items: nav.primary }, ...nav.groups];
  return (
    <nav className="flex items-center gap-1">
      <div className="hidden items-center gap-1 lg:flex">
        {nav.primary.map((item) => (
          <NavLink key={item.href} item={item} count={counts[item.href]} label={countLabels[item.href]} active={item.href === activeHref} />
        ))}
        {nav.groups.length > 0 && <MoreMenu groups={nav.groups} counts={counts} countLabels={countLabels} activeHref={activeHref} />}
      </div>
      <MoreMenu groups={everything} counts={counts} countLabels={countLabels} activeHref={activeHref} label="Menu" className="lg:hidden" />
    </nav>
  );
}
