import { requirePage, requireGuidelinesAck } from "@/reviewer-dash/lib/guard";
import { listIntegrityFlags } from "@/reviewer-dash/lib/sample/integrity";
import { Badge, Card, CardHeader, EmptyState, Mono, Muted, StatusBadge, Table, TextLink } from "@/reviewer-dash/app/_ui/ui";

export const metadata = { title: "Integrity reviews" };
export const dynamic = "force-dynamic";

const KIND_LABEL = { ai: "AI usage", "double-dip": "Double dip" } as const;

// The status a ship has in the review pipeline, in the words the Status badge uses.
const STATUS_OF: Record<string, string> = {
  waiting: "shipped",
  claimed: "shipped",
  "second-pass": "second_review",
  "proposed-ban": "second_review",
  approved: "approved",
  "needs-changes": "needs_changes",
  banned: "banned",
};

// Integrity reviews (Pixl's Fraud reviews tab, without its outside fraud reviewer): ships that carry an AI-usage or a double-dip flag.
// It is read-only. A flag is a question for the reviewer; the verdict is still given on the ship's own page.
export default async function IntegrityReviewsPage() {
  // Final reviewers, owners and integrity reviewers (the `{ review: "fraud" }` marker).
  const access = await requirePage({ review: "fraud" });
  // The guidelines gate is for people who review; an integrity-only reviewer can't.
  if (access.isReviewer) await requireGuidelinesAck(access);
  const rows = listIntegrityFlags();

  return (
    <div className="flex flex-col gap-6">
      <p className="hc-caption max-w-2xl text-sm">
        Ships with an AI-usage or double-dip flag. A flag is a question for the reviewer, not a verdict: nothing is banned
        automatically. Open the ship to see the evidence and decide.
      </p>
      <Card padding="flush">
        <CardHeader title="Integrity reviews" icon="private" count={rows.length} />
        <Table headers={["Project", "Flag", "What was found", "Status"]}>
          {rows.map((row, index) => (
            <tr key={`${row.projectId}-${index}`} className="align-top">
              <td>
                <TextLink href={`/review/${row.projectId}`} className="font-bold">
                  {row.title}
                </TextLink>
                <div className="hc-caption mt-1 text-xs">
                  <Mono>#{row.projectId}</Mono> by {row.builder}
                </div>
              </td>
              <td>
                <Badge tone={row.kind === "double-dip" ? "danger" : "warning"}>{KIND_LABEL[row.kind]}</Badge>
              </td>
              <td className="max-w-md whitespace-normal">
                <div className="font-bold">{row.headline}</div>
                <Muted className="text-xs">{row.detail}</Muted>
              </td>
              <td>
                <StatusBadge status={STATUS_OF[row.status] ?? row.status} />
              </td>
            </tr>
          ))}
        </Table>
        {rows.length === 0 && <EmptyState title="No integrity flags" icon="private" />}
      </Card>
      <p className="hc-caption text-xs">
        This tab is a stub. It reads the sample checks and shows nothing live; the review service will send flags here when it opens.
      </p>
    </div>
  );
}
