"use client";

// Adapted from Pixl's participant shell (references/pixl/apps/web-shell, MIT, Copyright (c) 2026 Pixl). Notice kept in docs/source-audit/ATTRIBUTION.md.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon } from "./icons";
import { Logo } from "./logo";
import { HOME_SLUG } from "./nav-data";
import { ThemeToggle } from "./theme-toggle";
import { landingHref } from "../../lib/landing";
import { sectionLabelFromPathname } from "../../lib/navigation";
import { useOre } from "../../lib/ore-ledger";

/**
 * The strip above the page: the section name on wide screens, the logo on phones (the dock has no room for
 * it), a plain statement of what this preview is, the sample Ore balance from the preview ledger, and the
 * display controls.
 */
export function TopRail() {
  const pathname = usePathname();
  const section = sectionLabelFromPathname(pathname);
  const { balance } = useOre();

  return (
    <header className="toprail">
      <Link className="rail-logo" href={`/${HOME_SLUG}`} aria-label="LOADOUT, Overview">
        <Logo />
      </Link>
      {section ? <p className="rail-section">{section}</p> : null}
      <div className="rail-end">
        <div className="rail-status" role="group" aria-label="Preview status">
          <p className="chip chip-status">Preview: sample data</p>
          <p className="chip chip-ore" title="Sample Ore balance, saved in this browser.">
            <PixelIcon name="ore" />
            <span>Ore</span>
            <span>{balance.toLocaleString("en-GB")}</span>
            <span className="sr-only">sample balance</span>
          </p>
        </div>
        <div className="rail-actions">
          <a className="rail-btn" href={landingHref("/accessibility")}>
            <PixelIcon name="accessibility" />
            <span className="rail-btn-text">Accessibility settings</span>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
