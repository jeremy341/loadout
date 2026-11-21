import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requirePage } from "@/reviewer-dash/lib/guard";
import { getReport, reportCounts } from "@/reviewer-dash/lib/db";
import { resolveReport } from "@/reviewer-dash/app/actions";
import { BanForm, WarnForm } from "@/reviewer-dash/app/_components/Moderate";
import {
  ActionButton,
  Badge,
  Card,
  CardHeader,
  DescriptionList,
  Flash,
  Icon,
  Muted,
  PageHeader,
  TextLink,
  formatDateTime,
} from "@/reviewer-dash/app/_ui/ui";
import { REPEAT_THRESHOLD, REPORT_STATUS_TONE } from "../tones";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requirePage("owner");
  const { id } = await params;
  const { ok, error } = await searchParams;
  const report = await getReport(Number(id));
  if (!report) notFound();

  // Reports are owner-only, so whoever is here can warn and propose a ban.
  const counts = await reportCounts(report.target_id, report.reporter_id);

  // Serial reporters get deanonymized to viewers; heavily-reported targets get
  // flagged for a closer look.
  const revealReporter = !report.anonymous || counts.byReporter >= REPEAT_THRESHOLD;
  const targetFlagged = counts.againstTarget >= REPEAT_THRESHOLD;

  let reporterNote: string | null = null;
  if (report.anonymous && revealReporter) {
    reporterNote = `Asked to stay anonymous, revealed because they filed ${counts.byReporter} reports.`;
  } else if (report.anonymous) {
    reporterNote = "Identity hidden by the reporter.";
  } else if (counts.byReporter >= REPEAT_THRESHOLD) {
    reporterNote = `${counts.byReporter} reports filed.`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <TextLink href="/reports" className="inline-flex items-center gap-1 text-sm">
          <Icon glyph="view-back" size={18} />
          All reports
        </TextLink>
      </div>

      <PageHeader
        title={
          <>
            Report on {report.target_name}
            <Badge tone={REPORT_STATUS_TONE[report.status] ?? "neutral"}>
              <span className="capitalize">{report.status}</span>
            </Badge>
            {targetFlagged && (
              <Badge tone="danger" icon="flag">
                Repeat-reported ({counts.againstTarget})
              </Badge>
            )}
          </>
        }
        description={`Filed ${formatDateTime(report.created_at)}`}
      />

      <Flash error={error} ok={ok} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Reason given" icon="message-simple" action={<Badge tone="neutral">{report.rule}</Badge>} />
            {report.reason ? (
              <p className="text-sm break-words whitespace-pre-wrap">{report.reason}</p>
            ) : (
              <Muted className="text-sm">The reporter did not give a reason.</Muted>
            )}
          </Card>

          <Card>
            <CardHeader title="Reported item" icon="docs" />
            <p className="text-sm break-words">{report.subject}</p>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="People" icon="people-2" />
            <DescriptionList
              items={[
                [
                  "Reported",
                  <div key="t">
                    <TextLink href={`/players/${report.target_id}`} className="font-bold">
                      {report.target_name}
                    </TextLink>
                  </div>,
                ],
                [
                  "Reporter",
                  <div key="r">
                    {revealReporter ? (
                      <TextLink href={`/players/${report.reporter_id}`} className="font-bold">
                        {report.reporter_name}
                      </TextLink>
                    ) : (
                      <Muted>Anonymous</Muted>
                    )}
                    {reporterNote && (
                      <div className="text-xs">
                        <Muted>{reporterNote}</Muted>
                      </div>
                    )}
                  </div>,
                ],
                ...(report.status !== "open" && report.handled_by
                  ? ([
                      [
                        <span key="h" className="capitalize">
                          {report.status} by
                        </span>,
                        <div key="hv">
                          {report.handled_by}
                          {report.handled_at && (
                            <div className="text-xs">
                              <Muted>{formatDateTime(report.handled_at)}</Muted>
                            </div>
                          )}
                        </div>,
                      ],
                    ] as [ReactNode, ReactNode][])
                  : []),
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Actions" icon="admin-badge" />
            <div className="flex flex-col gap-4">
              {report.status === "open" && (
                <div className="flex flex-wrap gap-2">
                  <form action={resolveReport}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="action" value="resolve" />
                    <ActionButton variant="success" size="sm" icon="checkmark" pendingLabel="Resolving...">
                      Mark resolved
                    </ActionButton>
                  </form>
                  <form action={resolveReport}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="action" value="dismiss" />
                    <ActionButton variant="ghost" size="sm" pendingLabel="Dismissing...">
                      Dismiss
                    </ActionButton>
                  </form>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="hc-eyebrow">On {report.target_name}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <WarnForm userId={report.target_id} compact />
                  <BanForm userId={report.target_id} compact />
                </div>
              </div>

              {revealReporter && (
                <div className="flex flex-col gap-2">
                  <p className="hc-eyebrow">On the reporter, for false or abusive reports</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <WarnForm userId={report.reporter_id} compact />
                    <BanForm userId={report.reporter_id} compact />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
