import type { ReactNode } from "react";
import { PlatformBackdrop } from "./PlatformBackdrop";
import "./signin.css";

// The sign-in frame: only the LOADOUT background and one centred column. No topbar, no sidebar and no accessibility tab on this
// screen. The wordmark sits above the form as part of the content, so the page reads as a gate rather than an app screen.
export function SignInFrame({ children }: { children: ReactNode }) {
  return (
    <div className="pf pf-signin">
      <PlatformBackdrop sidebar={false} />
      <a className="pf-skip" href="#platform-main">Skip to content</a>
      <main id="platform-main" className="pf-signin-main" tabIndex={-1}>
        <div className="pf-signin-card">
          <p className="pf-signin-brand">
            <span className="lg-text">LOADOUT</span>
          </p>
          {children}
        </div>
      </main>
    </div>
  );
}
