"use client";

import Link from "next/link";
import { RockBottom } from "./_components/home/RockBottom";

// A render failed: the cave-in page. `reset` asks Next.js to try the page again.
export default function CaveIn({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RockBottom
      variant="cave-in"
      lead="That one is on us. Try again, or head back up to the surface."
      actions={
        <>
          <button type="button" className="btn pri hero-btn" onClick={reset}>TRY AGAIN ↻</button>
          <Link className="btn hero-btn" href="/">BACK TO THE SURFACE ↑</Link>
        </>
      }
    />
  );
}
