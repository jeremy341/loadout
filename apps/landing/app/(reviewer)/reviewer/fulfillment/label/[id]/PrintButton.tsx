"use client";

import { Button, TextLink } from "@/reviewer-dash/app/_ui/ui";

// A Client Component only for the window.print() call; the label itself
// (page.tsx) stays a Server Component. Wrapped in .no-print so it only shows
// on screen, never in the printout.
export function PrintButton() {
  return (
    <div className="no-print mb-4 flex items-center gap-3">
      <Button onClick={() => window.print()} icon="post">
        Print label
      </Button>
      <TextLink href="/fulfillment" className="text-sm">
        Back to fulfilment
      </TextLink>
    </div>
  );
}
