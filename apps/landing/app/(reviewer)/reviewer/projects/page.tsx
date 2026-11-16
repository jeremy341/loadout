import { requirePage, can } from "@/reviewer-dash/lib/guard";
import { listProjects, collaboratorsByProject } from "@/reviewer-dash/lib/db";
import { builderNameFor, canReadReviewEvidence, redactBuilderUser } from "@/reviewer-dash/lib/reviewAccess";
import { isSafeUrl } from "@/reviewer-dash/lib/safeUrl";
import { BeaconBadge, TrackBadge } from "@/reviewer-dash/app/_components/ProjectBadges";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyRow,
  FilterBar,
  Flash,
  Icon,
  Mono,
  Muted,
  PageHeader,
  StatusBadge,
  Table,
  TextLink,
  buttonClass,
  formatDate,
} from "@/reviewer-dash/app/_ui/ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; ok?: string; error?: string }>;
}) {
  const access = await requirePage("reviewer");
  // Admins see archived projects mixed into the main list; plain reviewers
  // only see active ones.
  const isAdmin = can(access, "owner");
  const { q, view, ok, error } = await searchParams;
  const archived = view === "archived";
  // Legal names are for owners/final reviewers only (lib/reviewAccess.ts),
  // stripped here before anything renders.
  const projects = (
    await listProjects(q, {
      archived,
      includeArchived: !archived && isAdmin,
    })
  )
    // Added for the role model (R roles): the list shows what the detail page would open (the viewer's queue).
    .filter((p) => canReadReviewEvidence(access, p))
    .map((p) => ({ ...p, users: redactBuilderUser(access, p.users) }));
  const collaborators = await collaboratorsByProject(projects.map((p) => p.id));

  const headers = ["Project", "Status", "Builder", "Links", "Hackatime", "Created"];

  return (
    <div>
      <PageHeader
        title={archived ? "Archived projects" : "Projects"}
        count={projects.length}
        actions={
          <>
            {access.isOwner && (
              <>
              {/* A file download, not a page: next/link would try to render it. */}
              <a href="/api/projects/export" download className={buttonClass("outline", "sm")}>
                <Icon glyph="download" size={18} />
                Export approved (CSV)
              </a>
              </>
            )}
            <ButtonLink
              href={archived ? "/projects" : "/projects?view=archived"}
              variant="outline"
              size="sm"
              icon={archived ? "view-back" : "archive"}
            >
              {archived ? "Active projects" : "View archive"}
            </ButtonLink>
          </>
        }
      />

      <Flash error={error} ok={ok} />

      <FilterBar q={q} placeholder="Search by name or project number">
        {archived && <input type="hidden" name="view" value="archived" />}
      </FilterBar>

      <Card padding="flush">
        <Table headers={headers}>
          {projects.map((p) => {
            const collabCount = collaborators.get(p.id)?.length ?? 0;
            return (
              <tr key={p.id}>
                <td className="max-w-72">
                  <TextLink href={`/projects/${p.id}`} className="font-bold">
                    {p.name}
                  </TextLink>
                  {p.description && <div className="truncate text-xs hc-muted">{p.description}</div>}
                </td>
                <td>
                  <div className="flex flex-wrap items-center gap-1">
                    <StatusBadge status={p.status} />
                    <TrackBadge projectId={p.id} />
                    {p.is_peak && <BeaconBadge />}
                    {p.archived_at && <Badge>Archived</Badge>}
                  </div>
                </td>
                <td>
                  {p.users ? (
                    <TextLink href={`/players/${p.user_id}`} className="font-bold">
                      {builderNameFor(access, p.users)}
                    </TextLink>
                  ) : (
                    <Muted>{p.user_id}</Muted>
                  )}
                  {collabCount > 0 && (
                    <div className="text-xs hc-muted">
                      +{collabCount} teammate{collabCount === 1 ? "" : "s"}
                    </div>
                  )}
                </td>
                <td>
                  <div className="flex gap-3">
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
                    {!isSafeUrl(p.repo_url) && !isSafeUrl(p.demo_url) && <Muted>-</Muted>}
                  </div>
                </td>
                <td className="text-sm">
                  {p.hackatime_projects?.length ? p.hackatime_projects.join(", ") : <Muted>-</Muted>}
                </td>
                <td>
                  <Muted>
                    <Mono>{formatDate(p.created_at)}</Mono>
                  </Muted>
                </td>
              </tr>
            );
          })}
          {projects.length === 0 && (
            <EmptyRow colSpan={headers.length} title="No projects found" icon="search">
              Try a different search.
            </EmptyRow>
          )}
        </Table>
      </Card>
    </div>
  );
}
