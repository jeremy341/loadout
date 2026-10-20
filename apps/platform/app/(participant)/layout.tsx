// Adapted from Pixl's participant shell (references/pixl/apps/web-shell, MIT, Copyright (c) 2026 Pixl). Notice kept in docs/source-audit/ATTRIBUTION.md.

import { ShellNav } from "../../components/shell/shell-nav";
import { TopRail } from "../../components/shell/top-rail";

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShellNav />
      <div className="shell-main">
        <TopRail />
        <main id="main" tabIndex={-1} className="wrap">
          {children}
        </main>
      </div>
    </>
  );
}
