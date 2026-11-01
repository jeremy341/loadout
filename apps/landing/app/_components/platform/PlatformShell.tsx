import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { navFor } from "@/lib/platform/nav";
import { oreBalance } from "@/lib/platform/progress";
import type { Viewer } from "@/lib/platform/session";
import { PlatformNav } from "./PlatformNav";
import { PlatformThemeToggle } from "./PlatformThemeToggle";
import { PlatformBackdrop } from "./PlatformBackdrop";

export function PlatformShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  return (
    <div className="pf">
      <PlatformBackdrop />
      <a className="pf-skip" href="#platform-main">Skip to content</a>
      <div className="pf-frame">
        <header className="pf-top">
          <Link className="pf-brand" href="/"><span className="lg-text">LOADOUT</span></Link>
          <PlatformNav groups={navFor(viewer.isStaff)} />
          <div className="pf-top-end">
            {/* The homepage's light and dark switch. On phones it moves into the menu, where there is room for it. */}
            <PlatformThemeToggle className="pf-theme-top" />
            {/* Ore is shown on every page, as Pixl and Stardance show their balance. It stays at zero until approved hours exist. */}
            <span className="pf-ore">
              <Image className="pf-ore-icon" src="/loadout/sprites/ore.png" alt="" width={32} height={32} unoptimized />
              <span className="pf-ore-label">Ore</span>
              <span className="pf-ore-value">{oreBalance().toLocaleString("en-GB")}</span>
            </span>
            {/* The user icon is the only control here. Settings and sign out live on the Settings page until the profile menu is built. */}
            <Link className="pf-profile-slot" href="/dashboard/settings" aria-label="Profile, placeholder until the profile menu is built">
              <svg viewBox="0 0 16 16" width="24" height="24" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
                <rect x="5" y="2" width="6" height="6" />
                <rect x="3" y="9" width="10" height="5" />
              </svg>
            </Link>
          </div>
        </header>
        <main id="platform-main" className="pf-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
