import { requirePage, requireGuidelinesAck } from "@/reviewer-dash/lib/guard";
import { staffName } from "@/reviewer-dash/lib/staffName";
import { db, type ReviewAuditRow } from "@/reviewer-dash/lib/db";
import { ReviewVerdictChart, type VerdictWindow } from "@/reviewer-dash/app/_components/ReviewVerdictChart";
import { WEEKLY_REVIEW_MINIMUM, countReviewsSince, reviewWeekStartMs, slackIdFromLabel, summarizeWindow } from "@/reviewer-dash/lib/reviewStats";
import { Badge, Card, CardHeader, EmptyRow, Flash, Muted, Table, TextLink, formatDate } from "@/reviewer-dash/app/_ui/ui";
import { reviewerPlayerId, reviewerPlayerIds } from "../reviewerLinks";

export const metadata = { title: "Review stats" };
export const dynamic = "force-dynamic";

interface ReviewerStats {
  reviewer: string;
  total: number;
  /** Outcome reviews since Saturday 00:00 UTC, against WEEKLY_REVIEW_MINIMUM. */
  thisWeek: number;
  approved: number;
  firstPass: number;
  changes: number;
  reverted: number;
  hoursCredited: number;
  avgSeconds: number;
  lastActive: string;
}

function fmtDur(secs: number): string {
  if (secs <= 0) return "-";
  if (secs < 60) return `${Math.round(secs)}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${(secs / 3600).toFixed(1)}h`;
}

export default async function ReviewStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const access = await requirePage("reviewer");
  await requireGuidelinesAck(access);
  const { error: flashError, ok: flashOk } = await searchParams;
  const { data, error } = await db.from("review_audits").select("*").order("created_at", { ascending: false }).limit(2000);
  if (error) console.error("review stats", error.message);
  const audits = (data ?? []) as ReviewAuditRow[];
  // The board is open to anyone who can reach /review. Avg time stays
  // owner-only: it's a moderation signal about a reviewer, not a scoreboard
  // stat, and reading it as a ranking gets it wrong.
  const showAuditColumns = access.isOwner;

  // Calendar windows in UTC (packages/config's convention). "This week" is the
  // review week: Saturday 00:00 to Friday 23:59, not a rolling 7 days.
  const now = new Date();
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const weekStart = reviewWeekStartMs(now.getTime());
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const windowDefs: { key: string; label: string; since: number | null }[] = [
    { key: "all", label: "All time", since: null },
    { key: "day", label: "Today", since: dayStart },
    { key: "week", label: "This week", since: weekStart },
    { key: "month", label: "This month", since: monthStart },
  ];
  const verdictWindows: VerdictWindow[] = windowDefs.map((w) => ({
    key: w.key,
    label: w.label,
    ...summarizeWindow(audits, w.since, staffName),
  }));

  // Owners can open a reviewer's own builder page (the builders pages are
  // owner-only).
  const reviewerIds = access.isOwner ? await reviewerPlayerIds(audits.map((a) => a.reviewer)) : new Map<string, string>();
  const reviewerLink = (label: string) => reviewerPlayerId(reviewerIds, label);

  const byReviewer = new Map<string, ReviewAuditRow[]>();
  for (const a of audits) {
    const list = byReviewer.get(a.reviewer) ?? [];
    list.push(a);
    byReviewer.set(a.reviewer, list);
  }
  const stats: ReviewerStats[] = [...byReviewer.entries()].map(([reviewer, rows]) => {
    const approved = rows.filter((r) => r.verdict === "approved");
    const timed = rows.filter((r) => (r.total_seconds ?? 0) > 0);
    return {
      reviewer,
      total: rows.length,
      thisWeek: countReviewsSince(rows, weekStart),
      approved: approved.length,
      firstPass: rows.filter((r) => r.verdict === "first_pass_approved").length,
      changes: rows.filter((r) => r.verdict === "needs_changes").length,
      reverted: rows.filter((r) => r.verdict === "reverted").length,
      hoursCredited: Math.round(approved.reduce((s, r) => s + (Number(r.approved_hours) || 0), 0) * 10) / 10,
      avgSeconds: timed.length > 0 ? timed.reduce((s, r) => s + r.total_seconds, 0) / timed.length : 0,
      lastActive: rows[0]?.created_at ?? "",
    };
  });
  stats.sort((a, b) => b.total - a.total);

  // The viewer's own week against the minimum. A new week starts Saturday 00:00 UTC.
  const myWeek = stats.find((s) => slackIdFromLabel(s.reviewer) === access.session.slackId)?.thisWeek ?? 0;
  const myWeekPct = Math.min(100, Math.round((myWeek / WEEKLY_REVIEW_MINIMUM) * 100));
  const daysLeftInWeek = Math.max(1, Math.ceil((weekStart + 7 * 86_400_000 - now.getTime()) / 86_400_000));

  const headers = [
    "Reviewer",
    "Reviews",
    "This week",
    "Approved",
    "First pass",
    "Changes",
    "Hours credited",
    ...(showAuditColumns ? ["Avg time"] : []),
    "Last active",
  ];

  return (
    <div className="flex flex-col gap-6">
      <Flash error={flashError} ok={flashOk} />
      <Card>
        <CardHeader title="Your week" icon="clock" />
        <p className="hc-caption mb-3 text-sm">
          Every reviewer is expected to do at least {WEEKLY_REVIEW_MINIMUM} reviews a week. A week runs from Saturday
          00:00 UTC to Friday 23:59 UTC.
        </p>
        <div
          className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]"
          role="progressbar"
          aria-valuenow={myWeekPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-[var(--hc-green)]" style={{ width: `${myWeekPct}%` }} />
        </div>
        <p className="text-sm font-bold">
          {myWeek >= WEEKLY_REVIEW_MINIMUM
            ? `${myWeek} reviews this week, minimum reached.`
            : `${myWeek} of ${WEEKLY_REVIEW_MINIMUM} reviews this week, ${WEEKLY_REVIEW_MINIMUM - myWeek} to go (${daysLeftInWeek} day${daysLeftInWeek === 1 ? "" : "s"} left).`}
        </p>
      </Card>
      <Card>
        <CardHeader title="Verdicts over time" icon="analytics" />
        <p className="hc-caption mb-4 text-sm">Every review verdict across the whole team, by outcome.</p>
        <ReviewVerdictChart windows={verdictWindows} />
      </Card>

      <Card padding="flush">
        <CardHeader title="Reviewers" icon="leaders" count={stats.length} />
        <p className="hc-caption px-4 py-3 text-sm">
          From the review audit log: verdicts and hours credited per reviewer
          {showAuditColumns ? ", plus time spent per review." : "."} Reviewer pay and perks are not set yet (owner decision pending).
        </p>
        <Table headers={headers}>
          {stats.map((s) => {
            const rushed = s.avgSeconds > 0 && s.avgSeconds < 60;
            return (
              <tr key={s.reviewer}>
                <td className="font-bold break-words">
                  {reviewerLink(s.reviewer) ? (
                    <TextLink href={`/players/${reviewerLink(s.reviewer)}`}>{staffName(s.reviewer)}</TextLink>
                  ) : (
                    staffName(s.reviewer)
                  )}
                </td>
                <td className="hc-mono">{s.total}</td>
                <td
                  className={`hc-mono ${s.thisWeek >= WEEKLY_REVIEW_MINIMUM ? "font-bold text-[var(--hc-green)]" : ""}`}
                  title={`Minimum is ${WEEKLY_REVIEW_MINIMUM} reviews a week`}
                >
                  {s.thisWeek} / {WEEKLY_REVIEW_MINIMUM}
                </td>
                <td className="hc-mono font-bold text-[var(--hc-green)]">{s.approved}</td>
                <td className="hc-mono">{s.firstPass}</td>
                <td className="hc-mono">{s.changes}</td>
                <td className="hc-mono">{s.hoursCredited}h</td>
                {showAuditColumns && (
                  <td>
                    {rushed ? (
                      <span title="Under a minute per review. Rubber-stamping?">
                        <Badge tone="danger" icon="important">
                          {fmtDur(s.avgSeconds)}
                        </Badge>
                      </span>
                    ) : (
                      <span className="hc-mono">{fmtDur(s.avgSeconds)}</span>
                    )}
                  </td>
                )}
                <td className="whitespace-nowrap">
                  <Muted>{s.lastActive ? formatDate(s.lastActive) : "-"}</Muted>
                </td>
              </tr>
            );
          })}
          {stats.length === 0 && <EmptyRow colSpan={headers.length} title="No reviews logged yet" icon="history" />}
        </Table>
      </Card>
    </div>
  );
}
