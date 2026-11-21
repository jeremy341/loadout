import Link from "next/link";
import { requirePage, requireGuidelinesAck } from "@/reviewer-dash/lib/guard";
import { canSeeBuilderPII } from "@/reviewer-dash/lib/reviewAccess";
import { countPendingByKind, listShippedProjects, listReviewAudits } from "@/reviewer-dash/lib/db";
import { slackHandles, warmSlackHandles } from "@/reviewer-dash/lib/slack";
import { ReviewTable } from "@/reviewer-dash/app/_components/ReviewTable";
import {
  assigneeOf,
  assignmentDeadlineMs,
  openableQueueIds,
  type QueueLock,
} from "@/reviewer-dash/lib/reviewAssignment";
import { LiveReview } from "@/reviewer-dash/app/_components/LiveReview";
import { reviewErrorCopy } from "@/reviewer-dash/lib/reviewError";
import {
  REVIEW_TYPE_FILTERS,
  filterReviewType,
  parseReviewTypeFilter,
  type ReviewTypeFilter,
} from "@/reviewer-dash/lib/reviewTypeFilter";
import {
  Badge,
  Callout,
  Card,
  CardHeader,
  CountBadge,
  Muted,
  Pagination,
  Table,
  TextLink,
  formatDateTime,
} from "@/reviewer-dash/app/_ui/ui";

export const metadata = { title: "Needs review" };
export const dynamic = "force-dynamic";

const PER = 15;
// Cold lookup cap
const HANDLE_WAIT_MS = 600;

export default async function ReviewListPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    kind?: string;
    type?: string;
    error?: string;
  }>;
}) {
  const access = await requirePage("reviewer");
  // Await the gate before any queue data is read or rendered: a fire-and-forget promise could redirect after the page streamed.
  await requireGuidelinesAck(access);
  const viewer = access.session.slackId;
  const { page, kind: rawKind, type: rawType, error } = await searchParams;
  const errorCopy = reviewErrorCopy(error);
  const typeFilter = parseReviewTypeFilter(rawType);
  // Hardware and software have separate review queues. A reviewer restricted
  // to one queue (access.reviewQueues) can't view or query the other, so clamp
  // to their allowed queue regardless of what the URL asks for.
  const requestedKind: "software" | "hardware" = rawKind === "hardware" ? "hardware" : "software";
  const kind: "software" | "hardware" = access.reviewQueues === "both" ? requestedKind : access.reviewQueues;
  const kindQ = kind === "hardware" ? "&kind=hardware" : "";

  // First-pass work only. Second passs are on the Second pass tab.
  // The per-queue split is for a reviewer who can open both queues; a one-queue reviewer is never shown the other queue's number.
  const [myRecent, rowsAll, byKind] = await Promise.all([
    listReviewAudits(5, viewer, { realNames: canSeeBuilderPII(access) }),
    listShippedProjects(viewer, kind, { includeClaimed: true }),
    access.reviewQueues === "both" ? countPendingByKind() : Promise.resolve(null),
  ]);
  const nowMs = Date.now();
  // Everyone can open every row except one reserved for another reviewer.
  // See lib/reviewAssignment.ts.
  const openIds = openableQueueIds(rowsAll, viewer, access.canOpenFullQueue, nowMs);
  // Always oldest first: the queue arrives longest-wait first.
  const baseRows = rowsAll;
  const types = REVIEW_TYPE_FILTERS.map((filter) => ({
    ...filter, count: filterReviewType(baseRows, filter.id).length,
  })).filter((filter) => filter.count > 0 || filter.id === "all" || filter.id === "games" || filter.id === typeFilter);
  const rows = filterReviewType(baseRows, typeFilter);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PER));
  const cur = Math.min(Math.max(parseInt(page ?? "1", 10) || 1, 1), pages);
  const slice = rows.slice((cur - 1) * PER, cur * PER);
  // One handle lookup for every visible row: makers plus the reviewers
  // holding a claim, so the "is reviewing" tag can name them.
  const handleIds = (list: typeof slice) =>
    list.flatMap((p) => [p.users?.slack_id, p.claimedBy, assigneeOf(p) || null]);
  const handles = await slackHandles(handleIds(slice), { maxWaitMs: HANDLE_WAIT_MS });
  warmSlackHandles(handleIds(rows.slice(cur * PER, (cur + 1) * PER)));
  // Rows this viewer can't open: reserved for another reviewer. Owners get none.
  const locks: Record<number, QueueLock> = {};
  for (const p of slice) {
    if (openIds.has(Number(p.id))) continue;
    const assignee = assigneeOf(p);
    const deadline = assignmentDeadlineMs(p);
    locks[Number(p.id)] = {
      reason: "assigned",
      assignee: assignee ? (handles.get(assignee) ?? null) : null,
      until: deadline === null ? null : new Date(deadline).toISOString(),
    };
  }

  const typeQ = typeFilter === "all" ? "" : `&type=${typeFilter}`;
  const qp = (p: number) => `/review?page=${p}${kindQ}${typeQ}`;
  const typeHref = (selected: ReviewTypeFilter) => {
    const params = new URLSearchParams();
    if (kind === "hardware") params.set("kind", "hardware");
    if (selected !== "all") params.set("type", selected);
    const query = params.toString();
    return `/review${query ? `?${query}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {errorCopy && (
        <Callout tone="warning" icon="private">
          {errorCopy}
        </Callout>
      )}
      {access.reviewQueues === "both" && (
        <nav className="hc-segmented self-start" aria-label="Review queue">
          {(["software", "hardware"] as const).map((k) => (
            <Link
              key={k}
              href={k === "hardware" ? "/review?kind=hardware" : "/review"}
              aria-current={kind === k ? "page" : undefined}
              className="hc-segmented-item inline-flex items-center justify-center px-4"
            >
              {k === "software" ? "Software queue" : "Hardware queue"}
              {byKind ? <CountBadge>{byKind[k]}</CountBadge> : null}
            </Link>
          ))}
        </nav>
      )}
      {byKind && (
        <p className="hc-caption text-sm">
          {(byKind.software + byKind.hardware).toLocaleString()} ships wait across both queues. This list is the {kind} queue ({byKind[kind].toLocaleString()}).
        </p>
      )}

      <div>
        <Card padding="flush">
          <CardHeader
            title={kind === "hardware" ? "Hardware queue" : "Software queue"}
            icon="clock"
            count={total}
            action={
              <div className="flex flex-wrap items-center gap-3">
                <LiveReview />
              </div>
            }
          />
          <nav aria-label="Filter projects by type" className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <span className="mr-1 text-xs font-semibold text-[var(--muted)]">Project type</span>
            <span className="order-last w-full text-xs text-[var(--muted)] sm:order-none sm:ml-auto sm:w-auto">
              Showing {total.toLocaleString()} of {baseRows.length.toLocaleString()} in the {kind} queue
            </span>
            {types.map((filter) => (
              <Link
                key={filter.id}
                href={typeHref(filter.id)}
                aria-current={typeFilter === filter.id ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius)] border px-3 py-1.5 text-xs font-semibold transition-colors ${typeFilter === filter.id ? "border-[var(--primary)] bg-[var(--surface-hover)] text-[var(--text)]" : "border-[var(--border)] text-[var(--secondary)] hover:bg-[var(--surface-hover)]"}`}
              >
                {filter.label}
                <span className="font-mono text-[var(--muted)]">{filter.count}</span>
              </Link>
            ))}
          </nav>
          <ReviewTable makerLinks={access.isOwner}
            rows={slice}
            handles={handles}
            locks={locks}
            emptyLabel={typeFilter === "all"
              ? "Queue's clear. Nothing waiting for review."
              : "No submissions of this type are waiting in this queue."}
          />
        </Card>
        <Pagination page={cur} totalPages={pages} hrefFor={qp} />
      </div>

      {myRecent.length > 0 && (
        <Card padding="flush">
          <CardHeader title="Recently reviewed by you" icon="history" />
          <Table headers={["Project", "Verdict", "Builder", "When"]}>
            {myRecent.map((a) => (
              <tr key={a.id}>
                <td>
                  <TextLink href={`/projects/${a.project_id}`} className="font-bold">
                    {a.project_name}
                  </TextLink>
                </td>
                <td>
                  <Badge>{a.verdict.replaceAll("_", " ")}</Badge>
                </td>
                <td>{a.player_name}</td>
                <td className="whitespace-nowrap">
                  <Muted>{formatDateTime(a.created_at)}</Muted>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}
