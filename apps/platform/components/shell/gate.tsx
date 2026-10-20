// Adapted from Pixl's participant shell (references/pixl/apps/web-shell, MIT, Copyright (c) 2026 Pixl). Notice kept in docs/source-audit/ATTRIBUTION.md.

import Link from "next/link";
import { HOME_SLUG } from "./nav-data";

/**
 * Shown in place of a page that needs a signed-in participant. Sign-in is not open yet, so it offers no
 * login link and reads no token or query string. The Hack Club identity adapter (Phase 2) turns this into
 * the real sign-in entry point.
 */
export function Gate() {
  return (
    <section className="gate" aria-labelledby="gate-title">
      <h1 id="gate-title">Sign-in is not open yet</h1>
      <p>This page needs a LOADOUT account. Accounts use Hack Club verification, which is not connected in this preview.</p>
      <Link className="btn" href={`/${HOME_SLUG}`}>
        Back to Overview
      </Link>
    </section>
  );
}
