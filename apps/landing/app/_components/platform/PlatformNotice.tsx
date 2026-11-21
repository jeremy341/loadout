import Link from "next/link";
import type { ReactNode } from "react";
import { AccessibilityTab } from "../Accessibility";
import { PlatformBackdrop } from "./PlatformBackdrop";

// The frame for pages that have no sidebar: sign-in and the notices. Same grid, grain, depth layer and header as the shell.
export function PlatformPlain({ children, headerActions, accessibility }: { children: ReactNode; headerActions?: ReactNode; accessibility?: ReactNode }) {
  return (
    <div className="pf">
      <PlatformBackdrop />
      <a className="pf-skip" href="#platform-main">Skip to content</a>
      {accessibility}
      <div className="pf-plain">
        <header className="pf-top">
          <Link className="pf-brand" href="/"><span className="lg-text">LOADOUT</span></Link>
          {headerActions}
        </header>
        <main id="platform-main" className="pf-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

// A plain page used when the platform cannot serve a request in this environment.
export function PlatformNotice({ title, children }: { title: string; children: string }) {
  return (
    <PlatformPlain accessibility={<AccessibilityTab />}>
      <h1>{title}</h1>
      <p className="pf-lead">{children}</p>
    </PlatformPlain>
  );
}
