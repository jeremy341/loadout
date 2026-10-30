"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import type { NavGroup } from "@/lib/platform/nav";

// Phone: a labelled button opens a vertical list. Desktop: the pages sit in the top bar as tokens, the current one
// in brackets, and the staff group follows after a divider (CSS). The group headings stay for screen readers.
export function PlatformNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <>
      <button
        type="button"
        className="pf-btn pf-nav-toggle"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <nav aria-label="Participant" className="pf-nav" id={listId} data-open={open}>
        {groups.map((group) => (
          <div className="pf-nav-group" data-group={group.label.toLowerCase()} key={group.label}>
            <h2>{group.label}</h2>
            <ul>
              {group.items.map((item) => {
                const current = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
