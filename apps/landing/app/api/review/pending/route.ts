import { reviewApi } from "@/reviewer-dash/lib/apiGuard";
import { countPendingReviews } from "@/reviewer-dash/lib/db";

// Polled by the queue's Live switch (reviewer-dash/app/_components/LiveReview.tsx). Sample data, so the number never changes by itself.
export const GET = reviewApi("api.review.pending", "reviewer", async () =>
  Response.json({ count: await countPendingReviews() }, { headers: { "Cache-Control": "no-store" } }),
);
