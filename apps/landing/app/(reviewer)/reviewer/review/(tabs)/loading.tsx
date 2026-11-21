import { CardSkeleton } from "@/reviewer-dash/app/_components/Loading";

// Covers every /review/* tab except [id] (which has its own skeleton). Scoped
// under the layout, so only this content area swaps while the tab bar stays.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only" role="status">Loading…</span>
      <CardSkeleton lines={5} />
      <CardSkeleton lines={5} />
    </div>
  );
}
