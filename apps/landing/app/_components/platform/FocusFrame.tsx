import type { ReactNode } from "react";
import { PlatformBackdrop } from "./PlatformBackdrop";
import "./focus.css";

// A focused task page for a signed-in builder, such as the project wizard: the LOADOUT background and one centred column. No
// sidebar, no topbar, and no accessibility tab. The shell's sidebar and topbar are not drawn here.
export function FocusFrame({ children }: { children: ReactNode }) {
  return (
    <div className="pf pf-focus">
      <PlatformBackdrop sidebar={false} />
      <a className="pf-skip" href="#platform-main">Skip to content</a>
      <main id="platform-main" className="pf-focus-main" tabIndex={-1}>
        <div className="pf-focus-card">{children}</div>
      </main>
    </div>
  );
}
