import type { ReactNode } from "react";
import { oreChipTitle } from "@/lib/platform/ledger-view";
import { AccessibilityTab } from "@/app/_components/Accessibility";
import { PlatformBackdrop } from "./PlatformBackdrop";
import { PlatformFrame } from "./PlatformFrame";
import { PlatformSidebar } from "./PlatformSidebar";
import "./ledger.css";
import "./shell.css";
import "./minimal.css";

// `ore` is the confirmed balance and `orePending` the Ore still waiting for review, both from the Ore ledger.
// `docsSide` replaces the participant links in the sidebar (the documentation pages pass their own section list).
export function PlatformShell({ children, ore, orePending, handle, docsSide }: { children: ReactNode; ore: number; orePending: number; handle: string | null; docsSide?: ReactNode }) {
  return (
    <div className="pf">
      <PlatformBackdrop />
      <a className="pf-skip" href="#platform-main">Skip to content</a>
      <AccessibilityTab />
      <PlatformFrame side={<PlatformSidebar ore={ore} oreTitle={oreChipTitle(orePending)} handle={handle} docs={docsSide} />}>{children}</PlatformFrame>
    </div>
  );
}
