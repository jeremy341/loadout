import { notFound } from "next/navigation";
import {
  requirePage,
  ownerSlackIds,
  secondPassSlackIds,
  reviewQueueScopeFor,
  NO_REVIEW,
  SECOND_PASS,
  EDIT_SUBMISSION,
  AI_DRAFT,
} from "@/reviewer-dash/lib/guard";
import {
  getAdmin,
  listReviewAudits,
  reviewerStatsBySlackId,
  displayNamesBySlackId,
  auditFlags,
  type ReviewerStats,
} from "@/reviewer-dash/lib/db";
import {
  removeReviewer,
  setSecondPass,
  setEditSubmission,
  setReviewQueueAccess,
  setAiDraft,
  setFullQueue,
  messageReviewer,
} from "@/reviewer-dash/app/actions";
import { slackHandle } from "@/reviewer-dash/lib/slack";
import {
  ActionButton,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  DescriptionList,
  EmptyRow,
  Field,
  Flash,
  Input,
  Mono,
  Muted,
  PageHeader,
  Stat,
  StatGrid,
  Table,
  Textarea,
  TextLink,
  formatDate,
  formatDateTime,
  type Tone,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

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

function fmtDuration(seconds: number): string {
  if (seconds <= 0) return "-";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${seconds % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const VERDICT_BADGE: Record<string, { label: string; tone: Tone }> = {
  approved: { label: "approved", tone: "success" },
  first_pass_approved: { label: "first pass", tone: "neutral" },
  needs_changes: { label: "needs changes", tone: "warning" },
  reverted: { label: "reverted", tone: "danger" },
};

const QUEUE_SCOPES = [
  { key: "software", label: "Software only" },
  { key: "hardware", label: "Hardware only" },
  { key: "both", label: "Both" },
] as const;

export default async function ReviewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requirePage("owner");
  const { id } = await params;
  const { error: flashError, ok: flashOk } = await searchParams;
  let slackId: string;
  try {
    slackId = decodeURIComponent(id);
  } catch {
    // A malformed percent escape in the address is a bad request, not a server error.
    notFound();
  }

  const admin = await getAdmin(slackId);
  const isSuper = ownerSlackIds().includes(slackId);
  const inTable = !!admin?.permissions.includes("review");
  const blocked = !!admin?.permissions.includes(NO_REVIEW);
  const implied = isSuper && !blocked;
  if (!inTable && !implied) notFound();

  const [stats, audits, handle, playerNames] = await Promise.all([
    reviewerStatsBySlackId(),
    listReviewAudits(100, slackId, { realNames: true }),
    slackHandle(slackId),
    displayNamesBySlackId([slackId]),
  ]);
  const s = stats.get(slackId) ?? EMPTY_STATS;
  const display = admin?.name || handle || playerNames.get(slackId) || slackId;
  // Mirrors isSecondPassReviewer's env fallback: with SECOND_PASS_SLACK_IDS
  // unset, owners qualify automatically, so the toggle below must agree with
  // that or it contradicts the "second pass" badge.
  const secondPassIds = secondPassSlackIds();
  const envGrantsSecondPass = secondPassIds.length === 0 ? isSuper : secondPassIds.includes(slackId);
  const hasSecondPass = !!admin?.permissions.includes(SECOND_PASS);
  const queueScope = reviewQueueScopeFor(admin?.permissions);
  const hasAiDraft = !!admin?.permissions.includes(AI_DRAFT);
  const hasFullQueue = !!admin?.permissions.includes("full_queue");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <ButtonLink href="/reviewers" variant="ghost" size="sm" icon="view-back">
          Reviewers
        </ButtonLink>
      </div>

      <PageHeader
        title={display}
        description={
          <>
            <Mono>{handle ?? slackId}</Mono>, last review {s.lastReview ? formatDate(s.lastReview) : "never"}
          </>
        }
        actions={
          <>
            {isSuper && <Badge tone="danger">Owner</Badge>}
            {(hasSecondPass || envGrantsSecondPass) && <Badge tone="success">Final reviewer</Badge>}
            {admin?.permissions.includes(EDIT_SUBMISSION) && <Badge tone="info">Edits submissions</Badge>}
            {(hasAiDraft || isSuper) && <Badge tone="info">Prepared draft note</Badge>}
          </>
        }
      />

      <Flash error={flashError} ok={flashOk} />

      <StatGrid>
        <Stat label="Reviews all-time" value={s.reviews} />
        <Stat label="Final approvals" value={s.approved} tone="success" />
        <Stat label="First passes" value={s.firstPass} />
        <Stat label="Needs changes" value={s.needsChanges} />
        <Stat label="Hours credited" value={Math.round(s.hoursApproved * 10) / 10} />
        <Stat label="Avg review time" value={fmtDuration(s.avgSeconds)} />
        <Stat label="Repo opened" value={`${Math.round(s.repoOpenRate * 100)}%`} />
        <Stat
          label="Flagged reviews"
          value={s.flagged}
          icon={s.flagged > 0 ? "flag" : undefined}
          tone={s.flagged > 0 ? "danger" : undefined}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card padding="flush">
          <CardHeader
            title={audits.length === 100 ? "Review history (last 100)" : "Review history"}
            icon="history"
            count={audits.length}
          />
          <Table headers={["Project", "Verdict", "Hours", "Time", "Checked", "When"]}>
            {audits.map((a) => {
              const badge = VERDICT_BADGE[a.verdict] ?? { label: a.verdict, tone: "neutral" as const };
              const flags = auditFlags(a);
              return (
                <tr key={a.id} className="align-top">
                  <td>
                    <TextLink href={`/projects/${a.project_id}`} className="font-bold">
                      {a.project_name}
                    </TextLink>
                    <div className="hc-caption text-xs">
                      by <TextLink href={`/players/${a.user_id}`}>{a.player_name}</TextLink>
                    </div>
                    {a.note && (
                      <div className="hc-caption max-w-72 truncate text-xs" title={a.note}>
                        {a.note}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      {flags.map((f) => (
                        <Badge key={f} tone="danger" icon="important">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="hc-mono whitespace-nowrap">
                    {a.claimed_hours}
                    {a.approved_hours != null ? ` to ${a.approved_hours}` : ""}
                  </td>
                  <td className="hc-mono whitespace-nowrap">{fmtDuration(a.total_seconds)}</td>
                  <td className="whitespace-nowrap">
                    <Muted className="text-xs">
                      {[a.repo_opened ? "repo" : null, a.demo_opened ? "demo" : null].filter(Boolean).join(", ") ||
                        "-"}
                    </Muted>
                  </td>
                  <td className="whitespace-nowrap">
                    <Muted>{formatDateTime(a.created_at)}</Muted>
                  </td>
                </tr>
              );
            })}
            {audits.length === 0 && <EmptyRow colSpan={6} title="No reviews yet" icon="history" />}
          </Table>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Profile" icon="person" />
            <DescriptionList
              items={[
                ["Handle", <Mono key="id">{handle ?? slackId}</Mono>],
                ["Added by", admin?.added_by],
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Message" icon="send" />
            <form action={messageReviewer} className="flex flex-col gap-3">
              <input type="hidden" name="slackId" value={slackId} />
              <Field label="Direct message" hint={`Sent to ${display} as a LOADOUT notification, from you.`}>
                <Textarea name="message" required maxLength={1500} rows={4} placeholder="Write your message" />
              </Field>
              <div>
                <ActionButton icon="send" pendingLabel="Sending...">
                  Send message
                </ActionButton>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Queue access" icon="list" />
            <p className="hc-caption mb-3 text-sm">
              Which review queue{queueScope === "both" ? "s" : ""} {display} can see and claim from.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUEUE_SCOPES.map((scope) => (
                <form key={scope.key} action={setReviewQueueAccess}>
                  <input type="hidden" name="slackId" value={slackId} />
                  <input type="hidden" name="name" value={display} />
                  <input type="hidden" name="scope" value={scope.key} />
                  <ActionButton
                    variant={queueScope === scope.key ? "primary" : "outline"}
                    size="sm"
                    pendingLabel="Saving..."
                    disabled={queueScope === scope.key}
                  >
                    {scope.label}
                  </ActionButton>
                </form>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Permissions" icon="private" />
            <div className="flex flex-col items-start gap-3">
              {envGrantsSecondPass ? (
                <p className="hc-caption text-sm">
                  {secondPassIds.length === 0
                    ? "Final reviewer: owners qualify by default."
                    : "Final reviewer through the deployment settings. Change it there."}
                </p>
              ) : (
                <form action={setSecondPass}>
                  <input type="hidden" name="slackId" value={slackId} />
                  <input type="hidden" name="name" value={display} />
                  <input type="hidden" name="enable" value={hasSecondPass ? "0" : "1"} />
                  {hasSecondPass ? (
                    <ActionButton variant="ghost" size="sm" pendingLabel="Removing...">
                      Remove final reviewer
                    </ActionButton>
                  ) : (
                    <ActionButton variant="success" size="sm" pendingLabel="Saving...">
                      Make final reviewer
                    </ActionButton>
                  )}
                </form>
              )}
              {/* Narrow grant: editing submission details only, no final-reviewer
                  tools. Final reviewers and supers can already edit, so it is only
                  offered to everyone else. */}
              {!envGrantsSecondPass && !hasSecondPass && admin && (
                <form action={setEditSubmission}>
                  <input type="hidden" name="slackId" value={slackId} />
                  <input type="hidden" name="name" value={display} />
                  <input
                    type="hidden"
                    name="enable"
                    value={admin.permissions.includes(EDIT_SUBMISSION) ? "0" : "1"}
                  />
                  {admin.permissions.includes(EDIT_SUBMISSION) ? (
                    <ActionButton variant="ghost" size="sm" pendingLabel="Removing...">
                      Remove submission editing
                    </ActionButton>
                  ) : (
                    <ActionButton variant="outline" size="sm" pendingLabel="Saving...">
                      Allow editing submission details
                    </ActionButton>
                  )}
                </form>
              )}
              {/* Prepared draft note (Pixl: AI draft): owners always have it, a reviewer needs this grant. */}
              {!isSuper && admin && (
                <form action={setAiDraft}>
                  <input type="hidden" name="slackId" value={slackId} />
                  <input type="hidden" name="name" value={display} />
                  <input type="hidden" name="enable" value={hasAiDraft ? "0" : "1"} />
                  {hasAiDraft ? (
                    <ActionButton variant="ghost" size="sm" pendingLabel="Removing...">
                      Remove prepared draft note access
                    </ActionButton>
                  ) : (
                    <ActionButton variant="outline" size="sm" pendingLabel="Saving...">
                      Allow prepared draft notes
                    </ActionButton>
                  )}
                </form>
              )}
              {/* Added for the role model (R roles): the full-queue marker. Owners always have it; a reviewer needs this grant. */}
              {!isSuper && admin && (
                <form action={setFullQueue}>
                  <input type="hidden" name="slackId" value={slackId} />
                  <input type="hidden" name="enable" value={hasFullQueue ? "0" : "1"} />
                  {hasFullQueue ? (
                    <ActionButton variant="ghost" size="sm" pendingLabel="Removing...">
                      Remove full queue access
                    </ActionButton>
                  ) : (
                    <ActionButton variant="outline" size="sm" pendingLabel="Saving...">
                      Allow opening any ship in the queue
                    </ActionButton>
                  )}
                </form>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Remove reviewer" icon="member-remove" />
            <form action={removeReviewer} className="flex flex-col gap-3">
              <input type="hidden" name="slackId" value={slackId} />
              <Field label="Reason" hint="Sent to them.">
                <Input name="reason" required maxLength={500} />
              </Field>
              <div>
                <ActionButton
                  variant="danger"
                  icon="member-remove"
                  pendingLabel="Removing..."
                  confirm={`Remove ${display} as a reviewer?`}
                >
                  Remove reviewer
                </ActionButton>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
