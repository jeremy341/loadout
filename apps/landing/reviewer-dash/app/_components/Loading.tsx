// Shared loading UI. Rendered by Next.js loading.tsx boundaries the instant a
// navigation starts, so slow server components (the review page fetches
// GitHub / Hackatime / YSWS) show feedback immediately instead of a frozen tab.

import { Card } from "@/reviewer-dash/app/_ui/ui";

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="hc-muted flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-1.5 w-56 max-w-[70vw] overflow-hidden rounded-full bg-[var(--sunken)]">
        <div className="h-full w-1/3 animate-[indeterminate_1.15s_ease-in-out_infinite] rounded-full bg-[var(--primary)]" />
      </div>
      <span className="hc-mono text-sm">{label}</span>
    </div>
  );
}

export function Bar({ w = "100%" }: { w?: string }) {
  return <span className="block h-4 animate-pulse rounded bg-[var(--sunken)]" style={{ width: w }} />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Bar key={i} w={`${90 - i * 15}%`} />
        ))}
      </div>
    </Card>
  );
}
