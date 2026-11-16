import {
  requirePage,
  EDIT_SUBMISSION,
  ownerSlackIds,
  secondPassSlackIds,
  NO_REVIEW,
  SECOND_PASS,
} from "@/reviewer-dash/lib/guard";
import { listAdmins, reviewerStatsBySlackId, displayNamesBySlackId, type ReviewerStats } from "@/reviewer-dash/lib/db";
import { addReviewer } from "@/reviewer-dash/app/actions";
import { slackHandles } from "@/reviewer-dash/lib/slack";
import { TeamLog } from "@/reviewer-dash/app/_components/TeamLog";
import {
  ActionButton,
  Badge,
  Card,
  CardHeader,
  EmptyRow,
  Field,
  FilterBar,
  Input,
  Mono,
  Muted,
  PageHeader,
  Pagination,
  Stat,
  StatGrid,
  Table,
  TextLink,
  formatDate,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

const PER = 15;

const EMPTY_STATS: ReviewerStats = {
  reviews: 0,
  approved: 0,
  firstPass: 0,
  needsChanges: 0,
  hoursApproved: 0,
  avgSeconds: 0,
  repoOpenRate: 0,
  flagged: 0,
  lastReview: null,
};

export default async function ReviewersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requirePage("owner");
  const { q, page } = await searchParams;

  const [admins, stats] = await Promise.all([listAdmins(), reviewerStatsBySlackId()]);
  const tableReviewers = admins.filter((a) => a.permissions.includes("review"));
  const inTable = new Set(tableReviewers.map((r) => r.slack_id));
  const blocked = new Set(admins.filter((a) => a.permissions.includes(NO_REVIEW)).map((a) => a.slack_id));
  // Owners review whether or not they have a team row.
  const owners = new Set(ownerSlackIds());
  const secondPassIds = secondPassSlackIds();
  const isFinalReviewer = (id: string, perms: string[]) =>
    perms.includes(SECOND_PASS) || (secondPassIds.length > 0 ? secondPassIds.includes(id) : owners.has(id));
  const implicit = [...owners].filter((id) => !inTable.has(id) && !blocked.has(id));
  const allReviewers = [
    ...implicit.map((id) => ({ slack_id: id, name: "", permissions: [] as string[] })),
    ...tableReviewers.map((r) => ({ slack_id: r.slack_id, name: r.name, permissions: r.permissions })),
  ];
  const ids = allReviewers.map((r) => r.slack_id);
  const [handles, playerNames] = await Promise.all([slackHandles(ids), displayNamesBySlackId(ids)]);
  const displayFor = (r: { slack_id: string; name: string }) =>
    r.name || handles.get(r.slack_id) || playerNames.get(r.slack_id) || r.slack_id;

  const needle = (q ?? "").trim().toLowerCase();
  const filtered = needle
    ? allReviewers.filter((r) => {
        const handle = handles.get(r.slack_id) ?? "";
        return (
          displayFor(r).toLowerCase().includes(needle) ||
          r.slack_id.toLowerCase().includes(needle) ||
          handle.toLowerCase().includes(needle)
        );
      })
    : allReviewers;

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PER));
  const cur = Math.min(Math.max(parseInt(page ?? "1", 10) || 1, 1), pages);
  const reviewers = filtered.slice((cur - 1) * PER, cur * PER);
  const qp = (n: number) => `/reviewers?page=${n}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  const totals = [...stats.values()].reduce(
    (acc, s) => {
      acc.reviews += s.reviews;
      acc.approved += s.approved;
      acc.hours += s.hoursApproved;
      return acc;
    },
    { reviews: 0, approved: 0, hours: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reviewers"
        count={allReviewers.length}
        description="Everyone who can work the ship queue. Open a reviewer for their full stats and review history."
      />

      <StatGrid>
        <Stat label="Reviews all-time" value={totals.reviews} icon="checkmark" />
        <Stat label="Final approvals" value={totals.approved} icon="checkmark-all" tone="success" />
        <Stat label="Hours credited" value={Math.round(totals.hours * 10) / 10} icon="clock" />
      </StatGrid>

      <Card>
        <CardHeader title="Add a reviewer" icon="member-add" />
        <form action={addReviewer} className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Display name">
            <Input name="name" placeholder="Optional" />
          </Field>
          <Field label="Handle">
            <Input name="slackId" required placeholder="e.g. lanternfly" className="hc-mono" />
          </Field>
          <ActionButton icon="member-add" pendingLabel="Adding...">
            Add reviewer
          </ActionButton>
        </form>
        <p className="hc-caption mt-3 text-xs">
          Use the handle they sign in with. If they&apos;re already on the team, this just grants them review access
          on top.
        </p>
      </Card>

      <div>
        <FilterBar q={q} placeholder="Search reviewers by name or handle" />
        <Card padding="flush">
          <CardHeader title={needle ? `Matching "${q}"` : "Team"} icon="leaders" count={total} />
          <Table headers={["Reviewer", "Reviews", "Approved", "Hours credited", "Flags", "Last review"]}>
            {reviewers.map((r) => {
              const handle = handles.get(r.slack_id) ?? r.slack_id;
              const s = stats.get(r.slack_id) ?? EMPTY_STATS;
              return (
                <tr key={r.slack_id}>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <TextLink href={`/reviewers/${r.slack_id}`} className="font-bold">
                        {displayFor(r)}
                      </TextLink>
                      {owners.has(r.slack_id) && <Badge tone="danger">Owner</Badge>}
                      {isFinalReviewer(r.slack_id, r.permissions) && <Badge tone="success">Final reviewer</Badge>}
                      {r.permissions.includes(EDIT_SUBMISSION) && <Badge tone="info">Edits submissions</Badge>}
                    </div>
                    <Muted className="text-xs">
                      <Mono>{handle}</Mono>
                    </Muted>
                  </td>
                  <td className="hc-mono">{s.reviews}</td>
                  <td className="hc-mono">{s.approved}</td>
                  <td className="hc-mono">{Math.round(s.hoursApproved * 10) / 10}</td>
                  <td>
                    {s.flagged > 0 ? (
                      <Badge tone="danger" icon="flag">
                        {s.flagged}
                      </Badge>
                    ) : (
                      <span className="hc-mono">0</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <Muted>{s.lastReview ? formatDate(s.lastReview) : "never"}</Muted>
                  </td>
                </tr>
              );
            })}
            {reviewers.length === 0 && (
              <EmptyRow colSpan={6} title={needle ? "No reviewers match that search" : "No reviewers yet"} icon="leaders">
                {needle ? undefined : "Add someone above to start clearing the queue."}
              </EmptyRow>
            )}
          </Table>
        </Card>
        <Pagination page={cur} totalPages={pages} hrefFor={qp} />
      </div>

      <TeamLog />
    </div>
  );
}
