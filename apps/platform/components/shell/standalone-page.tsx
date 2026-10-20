import type { ReactNode } from "react";
import { Logo } from "./logo";

/** A one-screen page without the shell, for the 404 and the error page. */
export function StandalonePage({ tag, title, children }: { tag: string; title: string; children: ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="standalone">
      <div className="standalone-card">
        <p className="standalone-logo">
          <Logo />
        </p>
        <p className="eyebrow">{tag}</p>
        <h1>{title}</h1>
        {children}
      </div>
    </main>
  );
}
