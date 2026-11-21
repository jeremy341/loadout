import { redirect } from "next/navigation";
import { requirePage, requireGuidelinesAck } from "@/reviewer-dash/lib/guard";
import { listProposedBanProjects } from "@/reviewer-dash/lib/db";
import { slackHandles } from "@/reviewer-dash/lib/slack";
import { ReviewTable } from "@/reviewer-dash/app/_components/ReviewTable";
import { Card, CardHeader } from "@/reviewer-dash/app/_ui/ui";

export const metadata = { title: "Proposed bans" };
export const dynamic = "force-dynamic";

// Owner-only view of ships where a first-pass reviewer's verdict was "ban". A first-pass ban is only a proposal: the ship waits
// for a final reviewer to confirm or overturn it. This makes those easy to find; the decision still happens on the ship's own
// review page, with the same audit-note fields as any other final verdict.
export default async function ProposedBansPage() {
  const access = await requirePage("reviewer");
  await requireGuidelinesAck(access);
  if (!access.isOwner) redirect("/review");

  const rows = await listProposedBanProjects();
  const handles = await slackHandles(rows.map((p) => p.users?.slack_id));

  return (
    <div className="flex flex-col gap-6">
      <p className="hc-caption max-w-2xl text-sm">
        Ships a first-pass reviewer proposed banning, waiting on a final reviewer to confirm or
        overturn it, oldest first. Either way still needs the same audit notes as any other final
        verdict.
      </p>
      <Card padding="flush">
        <CardHeader title="Proposed bans" icon="flag" count={rows.length} />
        <ReviewTable makerLinks={access.isOwner} rows={rows} handles={handles} emptyLabel="Nothing waiting on a ban decision right now." />
      </Card>
    </div>
  );
}
