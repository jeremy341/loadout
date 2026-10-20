"use client";

import Link from "next/link";
import { HOME_SLUG } from "../components/shell/nav-data";
import { StandalonePage } from "../components/shell/standalone-page";

// A render failed. `reset` asks Next.js to try the page again.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StandalonePage tag="Error" title="Something broke">
      <p className="lead">That one is on us. Try again, or go back to Overview.</p>
      <p className="actions">
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
        <Link className="btn btn-quiet" href={`/${HOME_SLUG}`}>
          Back to Overview
        </Link>
      </p>
    </StandalonePage>
  );
}
