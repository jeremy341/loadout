"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocsGroup } from "./docs-data";
import { DocsSearch } from "./DocsSearch";
import { AccessibilityLink } from "../_components/Accessibility";
import { DOCS_BACK } from "@/lib/platform/docs-layout";

// The documentation sections, shown in the platform sidebar in place of the participant links while a signed-in participant reads the docs.
// The platform already supplies the top bar, the theme switch and the accessibility tab, so none of those are repeated here. On a phone
// this list lives in the same drawer the platform uses.
export function DocsGuides({ groups }: { groups: DocsGroup[] }) {
  const pathname = usePathname() ?? "";
  const active = pathname.split("/").filter(Boolean).pop() ?? "start";
  const back = DOCS_BACK.platform;
  return (
    <div className="docs-guides-col docs-side">
      <Link className="docs-back-link" href={back.href}>
        <span aria-hidden="true">← </span>{back.label}
      </Link>
      <DocsSearch key={pathname} />
      <nav className="docs-guides-nav" aria-label="Documentation sections">
        {groups.map((group) => (
          <div className="docs-guides-group" key={group.label} role="group" aria-label={group.label}>
            <p className="docs-guides-label" aria-hidden="true">{group.label}</p>
            {group.items.map((item) => (
              <Link
                className={active === item.slug ? "docs-guides-link active" : "docs-guides-link"}
                href={`/docs/${item.slug}`}
                aria-current={active === item.slug ? "page" : undefined}
                key={item.slug}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
        <AccessibilityLink className="docs-guides-link docs-accessibility-link" />
      </nav>
    </div>
  );
}
