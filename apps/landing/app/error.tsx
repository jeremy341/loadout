"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RockBottom } from "./_components/home/RockBottom";

// A render failed: the cave-in page. `reset` asks Next.js to try the page again. The error is logged from a leaf client
// component so the page itself stays a pure element tree (its unit test renders the function directly, outside React).
function ErrorLogger({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return null;
}

export default function CaveIn({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RockBottom
      variant="cave-in"
      lead="That one is on us. Try again, or head back up to the surface."
      actions={
        <>
          <ErrorLogger error={error} />
          <button type="button" className="btn pri hero-btn" onClick={reset}>TRY AGAIN ↻</button>
          <Link className="btn hero-btn" href="/">BACK TO THE SURFACE ↑</Link>
        </>
      }
    />
  );
}
