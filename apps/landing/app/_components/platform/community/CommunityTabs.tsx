"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMMUNITY_TABS, isCommunityTabCurrent } from "@/lib/platform/community";

// The row of Community pages. It needs the current address to mark the open tab, which is the only reason this is a client
// component, as with the main navigation.
export function CommunityTabs() {
  const pathname = usePathname();
  return (
    <nav className="cm-tabs" aria-label="Community">
      <ul>
        {COMMUNITY_TABS.map((tab) => (
          <li key={tab.href}>
            <Link href={tab.href} aria-current={isCommunityTabCurrent(pathname, tab.href) ? "page" : undefined}>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
