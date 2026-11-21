import { redirect } from "next/navigation";
import { requirePage, requireGuidelinesAck } from "@/reviewer-dash/lib/guard";
import { listSecondPassProjects } from "@/reviewer-dash/lib/db";
import { slackHandles } from "@/reviewer-dash/lib/slack";
import { Card, CardHeader } from "@/reviewer-dash/app/_ui/ui";
import { ReviewTable } from "@/reviewer-dash/app/_components/ReviewTable";

export const metadata = { title: "Second pass" };
export const dynamic = "force-dynamic";

// Final-verdict queue (owners and final reviewers): ships a first-pass reviewer passed, waiting on the approve /
// request changes / ban decision. Each row's ship page shows the first-pass note alongside the review form. Oldest first.
export default async function SecondPassPage() {
  const access = await requirePage("reviewer");
  await requireGuidelinesAck(access);
  if (!access.isOwner && !access.canSecondPass) redirect("/review");

  // includeClaimed: a project another reviewer has open stays listed (tagged), like /review.
  const rows = await listSecondPassProjects(access.session.slackId, undefined, { includeClaimed: true });
  const handles = await slackHandles(rows.flatMap((p) => [p.users?.slack_id, p.claimedBy]));

  return (
    <div className="flex flex-col gap-6">
      <p className="hc-caption max-w-2xl text-sm">
        Ships a first-pass reviewer already passed, waiting on your verdict, oldest first. Open one to see their note and
        hours call before deciding.
      </p>
      <Card padding="flush">
        <CardHeader title="Second pass" icon="checkmark" count={rows.length} />
        <ReviewTable makerLinks={access.isOwner}
          rows={rows}
          handles={handles}
          emptyLabel="Nothing waiting on a second pass right now."
        />
      </Card>
    </div>
  );
}
