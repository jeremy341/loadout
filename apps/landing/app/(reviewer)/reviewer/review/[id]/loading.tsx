import { Bar, CardSkeleton } from "@/reviewer-dash/app/_components/Loading";
import { Card } from "@/reviewer-dash/app/_ui/ui";

// Shown while the review page's database reads run. The slow external
// lookups (GitHub, Hackatime, YSWS) stream in afterwards behind their own
// Suspense boundaries, so this only covers the first paint.
export default function Loading() {
  return (
    <div className="hc-review flex flex-col gap-6">
      <Bar w="120px" />
      <div className="hc-review-split">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Bar w="260px" />
            <span className="block h-8 w-2/3 animate-pulse rounded bg-[var(--sunken)]" />
            <Bar w="200px" />
          </div>
          <span className="block h-56 w-full animate-pulse rounded-lg bg-[var(--sunken)]" />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
        <div className="flex flex-col gap-4">
          <Card padding="compact">
            <Bar w="100%" />
          </Card>
          <CardSkeleton lines={6} />
        </div>
      </div>
    </div>
  );
}
