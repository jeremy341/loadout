import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PARTICIPANT_NAV } from "@/lib/platform/nav";
import { oreBalance } from "@/lib/platform/progress";
import { PlatformAccountMenu } from "./PlatformAccountMenu";
import { PlatformNav } from "./PlatformNav";
import { PlatformThemeToggle } from "./PlatformThemeToggle";
import { PlatformBackdrop } from "./PlatformBackdrop";

export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <div className="pf">
      <PlatformBackdrop />
      <a className="pf-skip" href="#platform-main">Skip to content</a>
      <div className="pf-frame">
        <header className="pf-top">
          <Link className="pf-brand" href="/"><span className="lg-text">LOADOUT</span></Link>
          <PlatformNav groups={PARTICIPANT_NAV} />
          <div className="pf-top-end">
            {/* The homepage's light and dark switch. On phones it moves into the menu, where there is room for it. */}
            <PlatformThemeToggle className="pf-theme-top" />
            {/* Ore is shown on every page, as Pixl and Stardance show their balance. It stays at zero until approved hours exist. */}
            <span className="pf-ore">
              <Image className="pf-ore-icon" src="/loadout/sprites/ore.png" alt="" width={32} height={32} unoptimized />
              <span className="pf-ore-label">Ore</span>
              <span className="pf-ore-value">{oreBalance().toLocaleString("en-GB")}</span>
            </span>
            {/* The account control: Profile and Settings behind one square icon. */}
            <PlatformAccountMenu />
          </div>
        </header>
        <main id="platform-main" className="pf-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
