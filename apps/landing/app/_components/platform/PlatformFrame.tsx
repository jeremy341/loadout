"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isBarePath } from "@/lib/platform/nav";
import { isDocsPath } from "@/lib/platform/docs-layout";

// The frame around every participant page. Most pages get the sidebar, the top bar and the page beside them. The creation wizard
// is a focus task, so it opens bare: no sidebar, no top bar, no Ore chip, only the page with its own Close control back to Projects.
// The sidebar arrives as a slot so the server still renders it.
export function PlatformFrame({ side, children }: Readonly<{ side: ReactNode; children: ReactNode }>) {
  const pathname = usePathname() ?? "";
  const bare = isBarePath(pathname);
  // The documentation fills the page beside the sidebar and scrolls inside its own panes.
  const docs = isDocsPath(pathname);
  if (bare) {
    return (
      <div className="pf-frame pf-bare" data-bare="true">
        <main id="platform-main" className="pf-main pf-main-bare" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }
  return (
    <div className={docs ? "pf-frame pf-has-side pf-frame-docs" : "pf-frame pf-has-side"}>
      {side}
      <main id="platform-main" className={docs ? "pf-main pf-main-docs" : "pf-main"} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
