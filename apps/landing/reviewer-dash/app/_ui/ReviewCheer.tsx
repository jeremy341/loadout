"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { takeReviewCheer } from "./cheerFlag";

// A short celebration after an approval is sent: one status line and, unless the reader asked for less motion, ten small squares that
// fly out once for 900 ms. It never loops, never takes focus and never catches clicks. The status line is the message; the squares are
// decoration, so under prefers-reduced-motion they are not rendered at all. See .ulpi/design/reviewer-desk-staging-honesty.md section 7.
const SQUARES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return { dx: Math.round(Math.cos(angle) * 64), dy: Math.round(Math.sin(angle) * 40 - 12), delay: (i % 3) * 40 };
});

const SHOW_MS = 4000;

export default function ReviewCheer() {
  const pathname = usePathname();
  const [shown, setShown] = useState<{ id: number; still: boolean } | null>(null);

  // The layout stays mounted across the redirect, so the pathname changing is the cue to look for the flag.
  useEffect(() => {
    if (!takeReviewCheer()) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShown({ id: Date.now(), still });
    const t = setTimeout(() => setShown(null), SHOW_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!shown) return null;
  return (
    <div className="rv-cheer" role="status">
      {!shown.still && (
        <span className="rv-cheer-burst" aria-hidden="true">
          {SQUARES.map((s, i) => (
            <span
              key={`${shown.id}-${i}`}
              className="rv-cheer-square"
              style={{ "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, animationDelay: `${s.delay}ms` } as React.CSSProperties}
            />
          ))}
        </span>
      )}
      <span className="rv-cheer-text">Verdict sent. Thank you.</span>
    </div>
  );
}
