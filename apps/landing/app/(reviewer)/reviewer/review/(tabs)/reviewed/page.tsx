import { requirePage, requireGuidelinesAck } from "@/reviewer-dash/lib/guard";
import { listReviewedProjects } from "@/reviewer-dash/lib/db";
import { slackHandles } from "@/reviewer-dash/lib/slack";
import { ReviewTable } from "@/reviewer-dash/app/_components/ReviewTable";
import { Card, CardHeader } from "@/reviewer-dash/app/_ui/ui";

export const metadata = { title: "Reviewed" };
export const dynamic = "force-dynamic";

export default async function ReviewedPage() {
  const access = await requirePage("reviewer");
  await requireGuidelinesAck(access);
  const rows = await listReviewedProjects();
  const handles = await slackHandles(rows.map((p) => p.users?.slack_id));

  return (
    <Card padding="flush">
      <CardHeader title="Reviewed" icon="history" count={rows.length} />
      <ReviewTable makerLinks={access.isOwner} rows={rows} handles={handles} emptyLabel="No projects reviewed yet." />
    </Card>
  );
}
