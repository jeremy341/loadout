import { notFound } from "next/navigation";
import { requirePage } from "@/reviewer-dash/lib/guard";
import { banIsActive, getPlayer, listReportsAgainst } from "@/reviewer-dash/lib/db";
import { creditFor } from "@/lib/platform/review";
import { banLength } from "@/reviewer-dash/lib/sample/moderation-data";
import { isSafeUrl } from "@/reviewer-dash/lib/safeUrl";
import {
  BanForm,
  DeleteAccountForm,
  EditInfoForm,
  LiftBanForm,
  NotifyForm,
  WarnForm,
} from "@/reviewer-dash/app/_components/Moderate";
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  Flash,
  Mono,
  Muted,
  PageHeader,
  Stat,
  StatGrid,
  StatusBadge,
  TextLink,
  formatDate,
  formatDateTime,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

const ROW = "border-b border-[var(--border)] px-4 py-3 last:border-b-0";

function fmt(n: number): string {
  return Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1);
}

// The builder page. The route is /players/<id> (Pixl's path); the id is u-<handle>.
export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const access = await requirePage("owner");
  // Every builder action (warn, propose a ban, notify, edit, delete) is owner-only.
  const owner = access.isOwner;
  const { id } = await params;
  const { ok, error } = await searchParams;
  const data = await getPlayer(id);
  if (!data) notFound();
  const { user, projects, violations, bans, actions, proposals } = data;
  const activeBan = bans.find(banIsActive) ?? null;
  const reports = owner ? await listReportsAgainst(id) : [];
  const openReports = reports.filter((r) => r.status === "open").length;

  const approvedHours =
    Math.round(
      projects.filter((p) => p.status === "approved").reduce((s, p) => s + (Number(p.approved_hours) || 0), 0) * 10,
    ) / 10;
  // Ore comes from approved hours at the one rate in lib/platform/review.ts (10 Ore an hour).
  const credit = creditFor(approvedHours * 60);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <ButtonLink href="/players" variant="ghost" size="sm" icon="view-back">
          Builders
        </ButtonLink>
      </div>

      <PageHeader
        title={
          <>
            <span className="break-words">{user.display_name}</span>
            {activeBan && (
              <Badge tone="danger" icon="private">
                Banned {activeBan.expires_at ? `until ${formatDate(activeBan.expires_at)}` : "permanently"}
              </Badge>
            )}
            {!activeBan && proposals.length > 0 && (
              <Badge tone="warning" icon="private">
                Ban proposed
              </Badge>
            )}
          </>
        }
        description={
          <>
            Handle <Mono>{user.display_name}</Mono>, joined {formatDate(user.created_at)}
          </>
        }
      />

      <Flash error={error} ok={ok} />

      <StatGrid>
        <Stat label="Ore" value={fmt(credit.ore)} icon="purse-fill" tone="warning" hint={`$${credit.usd.toFixed(2)}`} />
        <Stat label="Approved hours" value={`${fmt(approvedHours)}h`} icon="clock" />
        <Stat label="Projects" value={projects.length} icon="rep" />
        <Stat label="Violations" value={violations.length} icon="important" tone={violations.length > 0 ? "warning" : undefined} />
        {owner && (
          <Stat
            label="Reports"
            value={reports.length}
            icon="flag-fill"
            tone={openReports > 0 ? "danger" : undefined}
            href="/reports"
            hint={openReports > 0 ? `${openReports} open` : undefined}
          />
        )}
      </StatGrid>

      {owner && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Moderate" icon="admin-badge" />
            <div className="flex flex-col gap-3">
              <WarnForm userId={user.id} />
              <BanForm userId={user.id} isBanned={!!activeBan} isProposed={proposals.length > 0} />
              {activeBan && <LiftBanForm userId={user.id} />}
              <NotifyForm userId={user.id} />
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader title="Builder info" icon="person-card" />
              <EditInfoForm userId={user.id} displayName={user.display_name} email={user.email ?? ""} />
            </Card>
            <Card>
              <CardHeader title="Danger zone" icon="delete" />
              <p className="hc-caption mb-3 text-sm">
                For data removal requests: erases the account and everything we hold about them, including journals,
                projects, orders, notifications and tickets. This can&apos;t be undone.
              </p>
              <DeleteAccountForm userId={user.id} />
            </Card>
          </div>
        </div>
      )}

      <Card padding="flush">
        <CardHeader title="Projects" icon="rep" count={projects.length} />
        {projects.length === 0 ? (
          <EmptyState title="No projects yet" icon="rep" />
        ) : (
          <ul>
            {projects.map((p) => (
              <li key={p.id} className={ROW}>
                <div className="flex flex-wrap items-center gap-2">
                  <TextLink href={`/projects/${p.id}`} className="font-bold">
                    {p.name}
                  </TextLink>
                  <StatusBadge status={p.status} />
                  {p.status === "approved" && p.approved_hours != null && (
                    <Badge tone="warning">{fmt(Number(p.approved_hours))}h credited</Badge>
                  )}
                </div>
                {p.description && <div className="mt-1 break-words text-sm hc-muted">{p.description}</div>}
                <div className="mt-1 flex flex-wrap gap-3 text-xs hc-muted">
                  {isSafeUrl(p.repo_url) && (
                    <TextLink href={p.repo_url} external>
                      Repo
                    </TextLink>
                  )}
                  {isSafeUrl(p.demo_url) && (
                    <TextLink href={p.demo_url} external>
                      Demo
                    </TextLink>
                  )}
                  {p.hackatime_projects.length > 0 && <span>Hackatime: {p.hackatime_projects.join(", ")}</span>}
                  <span>Created {formatDate(p.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {owner && (
        <Card padding="flush">
          <CardHeader title="Reports" icon="flag-fill" count={reports.length} />
          {reports.length === 0 ? (
            <EmptyState title="No reports filed against this builder" icon="checkmark-all" />
          ) : (
            <ul>
              {reports.map((r) => (
                <li key={r.id} className={ROW}>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <Badge tone={r.status === "open" ? "warning" : "neutral"}>{r.status}</Badge>
                    <span className="min-w-0 flex-1 break-words text-sm">
                      {r.reason || <Muted>No reason given</Muted>}
                    </span>
                    <Muted className="shrink-0 text-xs">
                      by {r.reporter_name}, <Mono>{formatDateTime(r.created_at)}</Mono>
                    </Muted>
                  </div>
                  <div className="mt-1 text-xs hc-muted">
                    {r.rule}. {r.subject}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="flush">
          <CardHeader title="Violations" icon="important" count={violations.length} />
          {violations.length === 0 ? (
            <EmptyState title="Clean record" icon="checkmark-all" />
          ) : (
            <ul>
              {violations.map((v) => (
                <li key={v.id} className={`${ROW} flex items-baseline gap-3`}>
                  <Badge tone="warning">{v.kind}</Badge>
                  <span className="flex-1 break-words text-sm">{v.content}</span>
                  <Muted className="shrink-0 text-xs">
                    <Mono>{formatDateTime(v.created_at)}</Mono>
                  </Muted>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="flush">
          <CardHeader title="Bans" icon="private" count={bans.length + proposals.length} />
          {bans.length === 0 && proposals.length === 0 ? (
            <EmptyState title="Never banned" icon="checkmark-all" />
          ) : (
            <ul>
              {proposals.map((p) => (
                <li key={`p-${p.id}`} className={`${ROW} flex flex-wrap items-baseline gap-3 text-sm`}>
                  <Badge tone="warning">Proposed</Badge>
                  <span className="flex-1">
                    {banLength(p.days)}, {p.reason}, by {p.proposed_by}. A different owner confirms it on Bans.
                  </span>
                  <Muted className="text-xs">
                    <Mono>{formatDateTime(p.created_at)}</Mono>
                  </Muted>
                </li>
              ))}
              {bans.map((b) => (
                <li key={b.id} className={`${ROW} flex flex-wrap items-baseline gap-3 text-sm`}>
                  {banIsActive(b) ? (
                    <Badge tone="danger">Active</Badge>
                  ) : (
                    <Badge>{b.lifted_at ? "Lifted" : "Expired"}</Badge>
                  )}
                  <span className="flex-1">
                    {b.reason || "(no reason)"}, by {b.banned_by || "?"}
                  </span>
                  <Muted className="text-xs">
                    <Mono>
                      {formatDateTime(b.created_at)} to {b.expires_at ? formatDateTime(b.expires_at) : "permanent"}
                    </Mono>
                  </Muted>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card padding="flush">
        <CardHeader title="Moderation log" icon="history" count={actions.length} />
        {actions.length === 0 ? (
          <EmptyState title="No moderation actions yet" icon="history" />
        ) : (
          <ul>
            {actions.map((a) => (
              <li key={a.id} className={`${ROW} flex flex-wrap items-baseline gap-3 text-sm`}>
                <Badge>{a.action}</Badge>
                <span className="flex-1 break-words">{a.detail}</span>
                <Muted className="text-xs">
                  {a.actor}, <Mono>{formatDateTime(a.created_at)}</Mono>
                </Muted>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
