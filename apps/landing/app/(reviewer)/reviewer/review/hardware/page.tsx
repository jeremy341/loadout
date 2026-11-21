import { redirect } from "next/navigation";
import { requirePage } from "@/reviewer-dash/lib/guard";

// The hardware review queue is the /review page filtered to kind=hardware. This
// gives it a clean, bookmarkable URL of its own.
export default async function HardwareReviewPage() {
  // Added for the role matrix: a reviewer limited to the software queue has no hardware queue, and the queue page shows the one they may open.
  const access = await requirePage("reviewer");
  redirect(access.reviewQueues === "software" ? "/review" : "/review?kind=hardware");
}
