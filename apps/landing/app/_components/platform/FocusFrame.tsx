import type { ReactNode } from "react";
import { AccessibilityTab } from "../Accessibility";
import { NoiseGrain } from "../NoiseGrain";
import "./minimal.css";
import "./focus.css";

// A focused task page for a signed-in builder, such as the project wizard (brief .ulpi/design/wizard-focus-layout.md): the
// LOADOUT grid and film grain and one centred column. No sidebar, no topbar and no koi. The accessibility tab stays on the left
// edge, as everywhere else. minimal.css is imported here too, because it holds the wizard's card and bar styles and the shell,
// which used to load it, is not part of this route. focus.css comes after it so its layout rules win.
export function FocusFrame({ children }: { children: ReactNode }) {
  return (
    <div className="pf pf-focus">
      <NoiseGrain />
      <a className="pf-skip" href="#platform-main">Skip to content</a>
      <AccessibilityTab />
      <main id="platform-main" className="pf-focus-main" tabIndex={-1}>
        <div className="pf-focus-card">{children}</div>
      </main>
    </div>
  );
}
