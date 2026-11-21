import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requirePage, landingFor } from "@/reviewer-dash/lib/guard";
import { countPendingByKind, countReviewTabs } from "@/reviewer-dash/lib/db";
import { ReviewTabs } from "@/reviewer-dash/app/_components/ReviewTabs";
import { PageHeader } from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

type TabProps = React.ComponentProps<typeof ReviewTabs>;

// Streams badges
async function ReviewTabsWithCounts({
  wants,
  access,
  ...tabProps
}: Omit<TabProps, "pending" | "secondPassCount" | "proposedBanCount" | "queues" | "queueScope"> & {
  wants: { pending: boolean; secondPass: boolean; proposedBans: boolean } | null;
  access: { reviewQueues: "software" | "hardware" | "both" };
}) {
  // A reviewer limited to one queue is counted that queue only. One who can open both also gets the split, so the badge can follow the
  // queue the page lists instead of adding software and hardware together.
  const counts = wants ? await countReviewTabs(access.reviewQueues === "both" ? undefined : access.reviewQueues) : null;
  const queues = wants?.pending && access.reviewQueues === "both" ? await countPendingByKind() : undefined;
  return (
    <ReviewTabs
      {...tabProps}
      queues={queues}
      queueScope={access.reviewQueues}
      pending={wants?.pending ? counts?.pending : undefined}
      secondPassCount={wants?.secondPass ? counts?.secondPass : undefined}
      proposedBanCount={wants?.proposedBans ? counts?.proposedBans : undefined}
    />
  );
}

// Shared chrome for every /review/* tab. Keeping the tab bar (and its badge
// count queries) in the layout means it stays mounted across tab clicks, and
// loading.tsx only swaps the content below it.
export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
  // Integrity reviewers get in too, but only to the Integrity reviews tab: every
  // other tab page re-checks requirePage("reviewer") and bounces them.
  const access = await requirePage("staff");
  if (!access.isReviewer && !access.canFraudReview) redirect(landingFor(access));
  const fraudOnly = !access.isReviewer && !access.isOwner;
  // Second pass is worked by owners and final reviewers (second_pass).
  const canSecondPass = access.isOwner || access.canSecondPass;
  const tabProps = {
    isSuper: access.isOwner,
    canSecondPass,
    canFraudReview: access.canFraudReview,
    fraudOnly,
  };
  const countsNeeded = !fraudOnly || canSecondPass || access.isOwner;
  const wants = { pending: !fraudOnly, secondPass: canSecondPass, proposedBans: access.isOwner };

  return (
    <div>
      <PageHeader
        title="Review"
        description={fraudOnly ? "AI-usage and double-dip flags." : "Ship queue, verdict history and reviewer stats."}
      />
      <Suspense fallback={<ReviewTabs {...tabProps} />}>
        <ReviewTabsWithCounts {...tabProps} access={access} wants={countsNeeded ? wants : null} />
      </Suspense>
      {children}
    </div>
  );
}
