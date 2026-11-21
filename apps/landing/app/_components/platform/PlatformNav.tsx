"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLinkCurrent, type NavGroup } from "@/lib/platform/nav";

// The sidebar links in small groups, each with a plain heading. The current link has aria-current, a square marker and a bar. Under
// 900px the drawer shows the same groups as one list. Following a link tells the drawer to close.
export function PlatformNav({ groups, onNavigate }: Readonly<{ groups: readonly NavGroup[]; onNavigate?: () => void }>) {
  const pathname = usePathname();
  return (
    <nav aria-label="Participant" className="pf-tabs">
      {groups.map((group) => (
        <div key={group.label} className="pf-tab-group">
          <p className="pf-tab-heading" aria-hidden="true">{group.label}</p>
          <ul aria-label={group.label}>
            {group.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} aria-current={isLinkCurrent(pathname, link.href) ? "page" : undefined} onClick={onNavigate}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
