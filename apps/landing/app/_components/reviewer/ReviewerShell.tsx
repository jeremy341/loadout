import Link from "next/link";
import type { ReactNode } from "react";
import { PlatformThemeToggle } from "@/app/_components/platform/PlatformThemeToggle";
import type { Viewer } from "@/lib/platform/session";
import type { ReviewerAccess } from "@/lib/reviewer/access";
import { navCounts } from "@/lib/reviewer/counts";
import { buildNav } from "@/lib/reviewer/nav";
import { paletteEntries } from "@/lib/reviewer/palette";
import { CommandPalette } from "./CommandPalette";
import { ReviewerNav } from "./ReviewerNav";
import { reviewerMono, reviewerSans } from "./reviewer-fonts";
import "./reviewer.css";
import "./reviewer-layout.css";
// The Egg look. Every rule in it starts with .pf.rvx.rs, so it wins over the sheets above and the area sheets that pages load
// later, and it never touches the participant platform. Keep it the last import here.
import "./reviewer-theme.css";

// The frame of the reviewer site: its own header, nav and landmarks. It is not the participant shell. It shares the platform's
// --pf-* tokens and top-bar styles (loaded globally by the root layout) and adds the staff-side marks in reviewer.css:
// the "Reviewer site" tag beside the wordmark and a thin accent rule above the header. The bar follows Pixl's: a few
// role-filtered links with count badges, one More menu, a wide search that opens the command palette, the theme switch and
// who is signed in. Settings is on the name, because Pixl keeps it beside the name too.
function Brand() {
  return (
    <Link className="pf-brand rs-brand" href="/">
      <span className="rs-mark">
        <span className="lg-text">LOADOUT</span>
        <span className="rs-word">Review</span>
      </span>
      <span className="rs-tag">Reviewer site</span>
    </Link>
  );
}

export function ReviewerShell({ viewer, children }: { viewer: Viewer & { access: ReviewerAccess }; children: ReactNode }) {
  const nav = buildNav(viewer.access);
  return (
    <div className={`pf rs rvx ${reviewerSans.variable} ${reviewerMono.variable}`}>
      <a className="pf-skip" href="#reviewer-main">Skip to content</a>
      <div className="pf-frame">
        <header className="pf-top rs-top">
          <Brand />
          <ReviewerNav name={viewer.displayName} nav={nav} counts={navCounts(viewer.access)} />
          <CommandPalette entries={paletteEntries(viewer.access)} />
          <div className="pf-top-end">
            {/* The homepage's light and dark switch. On phones it moves into the menu. */}
            <PlatformThemeToggle className="pf-theme-top" />
            <Link className="rs-who" href="/settings" aria-label={`Settings, signed in as ${viewer.displayName}`}>
              <span className="rs-who-name" aria-hidden="true">{viewer.displayName}</span>
            </Link>
          </div>
        </header>
        <main id="reviewer-main" className="pf-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

// The same frame without the nav, for the notices: no database, or nobody signed in yet.
export function ReviewerNotice({ title, children }: { title: string; children: string }) {
  return (
    <div className={`pf rs rvx ${reviewerSans.variable} ${reviewerMono.variable}`}>
      <a className="pf-skip" href="#reviewer-main">Skip to content</a>
      <div className="pf-plain">
        <header className="pf-top rs-top">
          <Brand />
        </header>
        <main id="reviewer-main" className="pf-main" tabIndex={-1}>
          <h1>{title}</h1>
          <p className="pf-lead">{children}</p>
        </main>
      </div>
    </div>
  );
}
