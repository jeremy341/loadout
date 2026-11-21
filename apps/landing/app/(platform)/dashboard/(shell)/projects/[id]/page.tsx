import { reviewQueueHref } from "@/lib/platform/nav";
import type { Metadata } from "next";
import { fetchGithubReadme } from "@/lib/platform/readme-source";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollaboratorsBlock } from "@/app/_components/platform/CollaboratorsBlock";
import { DeleteProject } from "@/app/_components/platform/DeleteProject";
import { LapsePanel } from "@/app/_components/platform/LapsePanel";
import { HardwareFunding } from "@/app/_components/platform/HardwareFunding";
import { CoverUpload } from "@/app/_components/platform/CoverUpload";
import { ProjectJournal } from "@/app/_components/platform/ProjectJournal";
import { PinSetting } from "@/app/_components/platform/ProjectVisibilityControls";
import { ProfileTabs, TabLink, type ProfileTabItem } from "@/app/_components/platform/ProfileTabs";
import { ProjectCover } from "@/app/_components/platform/ProjectCover";
import { ProjectSettingsForm } from "@/app/_components/platform/ProjectSettingsForm";
import { HandleMark } from "@/app/_components/platform/ProjectTimeline";
import { ShipPanel } from "@/app/_components/platform/ShipPanel";
import { StageProgress } from "@/app/_components/platform/StageProgress";
import { ToolbeltSection } from "@/app/_components/platform/ToolbeltSection";
import { ToolbeltUsers } from "@/app/_components/platform/ToolbeltUsers";
import "@/app/_components/platform/project-column.css";
import "@/app/_components/platform/project-stasis.css";
import { db } from "@/lib/platform/db";
import { searchEquippableTools } from "@/lib/platform/discover-data";
import { eligibilityRefusal } from "@/lib/platform/eligibility-gate";
import { journalOpen } from "@/lib/platform/journal";
import { journalStats, listJournal } from "@/lib/platform/journal-data";
import { coverOf, photosByEntry, shipJournals } from "@/lib/platform/media-data";
import { uploadsEnabled } from "@/lib/platform/uploads";
import { listUsersOfTool, listUsesForProject, usedByCounts } from "@/lib/platform/profile-data";
import { normalizeStatus } from "@/lib/platform/profile";
import { projectHours } from "@/lib/platform/progress";
import { dueHint } from "@/lib/platform/project-page";
import { listCollaborators } from "@/lib/platform/collaborators-data";
import { parseProjectTab, projectTabHref, shipChecksLeft, shipChecksLine, type ProjectTabKey } from "@/lib/platform/project-tabs";
import { MAX_PINNED } from "@/lib/platform/profile";
import { projectStatusLabel } from "@/lib/platform/projects";
import { relativeTime } from "@/lib/platform/explore-feed";
import { formatHours } from "@/lib/platform/journal";
import { repoHost } from "@/lib/platform/search-view";
import { requireViewer } from "@/lib/platform/session";
import { checkShip, firstTriggerBlocker, needsChangeNote } from "@/lib/platform/ship-gate";
import { TOOLBELT_USERS_MAX } from "@/lib/platform/toolbelt-ui";
import { activeUses, EQUIP_STATUSES, TOOLBELT_MAX_PER_PROJECT } from "@/lib/platform/toolbelt";

export const metadata: Metadata = { title: "Project - LOADOUT" };

// One project as a single centred column: back link, header, cover beside the track card, quick actions, then a tab row
// (Journal, Ship, Toolbelt, Settings; the open tab is ?tab=; the visitor view is the public page on /dashboard/explore/[id]). The ship checklist lives in the Ship tab only, and
// Pin and Delete live in Settings. Only its owner can open it; any other id is a plain 404. The owner check is the first thing the
// page does, before any other read. Other builders see the project on /dashboard/explore/[id].
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireViewer();
  const { id } = await params;
  // The creation wizard sends the builder here with ?created=1 once, for one welcome line.
  const query = await searchParams;
  const justCreated = query.created === "1";
  const tab = parseProjectTab(query.tab);
  const project = await db().project.findFirst({ where: { id, ownerId: viewer.id }, include: { owner: { select: { handle: true } } } });
  if (!project) notFound();

  const hours = projectHours(project.id);
  const status = normalizeStatus(project.status);
  const hardware = project.track === "Hardware";
  const open = journalOpen(status);
  const entries = await listJournal(project.id);
  const stats = await journalStats(project.id);
  const photos = await photosByEntry(entries.map((entry) => entry.id));
  const cover = await coverOf(project.id);
  const collaborators = await listCollaborators(project.id, viewer.id);
  const uploadsOn = uploadsEnabled();
  // The 8 hour rule is a warning while the builder works and a blocker only at submit (checkShip).
  const due = open ? dueHint(stats.due, stats.owed) : null;
  const ship = checkShip(project, await shipJournals(entries), new Date(), {
    uploadsOn,
    eligibilityRefusal: await eligibilityRefusal(viewer),
    priorApprovedMinutes: project.approvedMinutes,
    readmeText: await fetchGithubReadme(project.repoUrl),
  });
  const triggerReason = firstTriggerBlocker(ship)?.message ?? null;

  // Toolbelt: the uses this project equips, the saved tools it could equip next, and (for a maker) who equipped it.
  const uses = await listUsesForProject(project.id);
  const canEquipMore = EQUIP_STATUSES.includes(status) && activeUses(uses).length < TOOLBELT_MAX_PER_PROJECT;
  const savedTools = canEquipMore
    ? (await searchEquippableTools(viewer.id, project.id, "", { limit: 30 })).rows
        .filter((row) => row.saved)
        .slice(0, 3)
        .map(({ equip, ...row }) => {
          void equip;
          return row;
        })
    : [];
  const users = await listUsersOfTool(project.id, viewer.id);
  const blocked = new Set((await db().toolbeltBlock.findMany({ where: { makerId: viewer.id }, select: { blockedId: true } })).map((row) => row.blockedId));
  const showMakerView = (status === "approved" && Boolean(project.repoUrl)) || users.length > 0;
  const usedBy = (await usedByCounts([project.id]))[project.id] ?? 0;

  const pinnedCount = await db().project.count({ where: { ownerId: viewer.id, pinned: true } });
  const shipLeft = shipChecksLeft(ship.items);
  const shipLine = shipChecksLine(shipLeft);
  // The one text link beside the title that points at Ship. It only restates the status and the checks the Ship tab already shows.
  const shipHint = status === "needs-changes" ? "Read the changes requested" : !open ? "See where it stands" : triggerReason === null ? "Ready to ship" : null;
  const base =`/dashboard/projects/${project.id}`;
  const source = repoHost(project.repoUrl);
  const demo = repoHost(project.demoUrl);

  const items: ProfileTabItem<ProjectTabKey>[] = [
    {
      key: "journal",
      label: "Journal",
      panel: (
        <>
          <ProjectJournal projectId={project.id} entries={entries} photos={photos} totalHours={stats.hours} open={open} dueHint={due} handle={project.owner.handle} startedAt={project.createdAt} />
          {shipLine ? (
            <p className="pf-column-ship-left" data-testid="ship-left">
              {shipLine} <TabLink tab="ship" href={projectTabHref(base, "ship")}>See the Ship tab</TabLink>
            </p>
          ) : null}
        </>
      ),
    },
    {
      key: "ship",
      label: "Ship",
      panel: (
        <>
          <StageProgress status={project.status} />
          <section className="pf-box" aria-labelledby="requirements-heading" id="ship">
            <h2 id="requirements-heading">Ship requirements</h2>
            <ShipPanel
              projectId={project.id}
              status={status}
              items={ship.items}
              triggerReason={triggerReason}
              needsNote={needsChangeNote(project)}
              reviewNote={project.reviewNote}
              reviewReason={project.reviewReason}
              approvedMinutes={project.approvedMinutes}
              isUpdate={project.isUpdate}
            />
            {["submitted", "in-review", "second-pass"].includes(status) ? (
              <Link className="pf-btn" href={reviewQueueHref(project.seq, hardware)}>View in Review Queue</Link>
            ) : null}
          </section>
          {hardware ? (
            <>
              <section className="pf-box" aria-labelledby="lapse-heading" id="lapse">
                <h2 id="lapse-heading">Lapse</h2>
                <LapsePanel />
              </section>
              <section className="pf-box" aria-labelledby="funding-heading" id="funding">
                <h2 id="funding-heading">Hardware funding</h2>
                <HardwareFunding />
              </section>
            </>
          ) : null}
        </>
      ),
    },
    {
      key: "toolbelt",
      label: "Toolbelt",
      panel: (
        <>
          <ToolbeltSection
            projectId={project.id}
            projectStatus={project.status}
            uses={uses.map((use) => ({ id: use.id, status: use.status, note: use.note, tool: use.tool }))}
            savedTools={savedTools}
            hours={hours}
          />
          {showMakerView ? (
            <ToolbeltUsers
              total={users.length}
              rows={users.slice(0, TOOLBELT_USERS_MAX).map((row) => ({
                id: row.id,
                userId: row.userId,
                userHandle: row.userHandle,
                status: row.status,
                note: row.note,
                blocked: blocked.has(row.userId),
                project: row.project,
              }))}
            />
          ) : null}
        </>
      ),
    },
    {
      key: "settings",
      label: "Settings",
      panel: (
        <>
          <ProjectSettingsForm project={{ id: project.id, title: project.title, description: project.description, track: project.track, status: project.status, repoUrl: project.repoUrl, demoUrl: project.demoUrl }} />
          <CollaboratorsBlock projectId={project.id} collaborators={collaborators} />
          <PinSetting id={project.id} title={project.title} status={status} pinned={project.pinned} pinnedCount={pinnedCount} max={MAX_PINNED} />
          <DeleteProject id={project.id} title={project.title} />
        </>
      ),
    },
  ];

  return (
    <div className="pf-column">
      <Link className="pf-back" href="/dashboard/projects">
        <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
        </svg>
        Back to projects
      </Link>

      {justCreated ? (
        <p className="pf-saved" role="status">
          Project created. It is public. Write your first journal entry when you start work.
        </p>
      ) : null}

      <section className="pf-spp-head" aria-labelledby="owner-title" data-track={project.track ? project.track.toLowerCase() : undefined}>
        <div className="pf-spp-cover" data-cover={cover ? "image" : "none"}>
          <ProjectCover status={project.status} track={project.track} hours={hours} large depth={false} badges={false} cover={cover} title={project.title} />
          <CoverUpload projectId={project.id} title={project.title} enabled={uploadsOn} cover={cover} locked={!journalOpen(project.status)} />
        </div>
        <div className="pf-spp-top">
          <div className="pf-spp-id">
            <h1 id="owner-title" className="pf-spp-title">{project.title}</h1>
            <p className="pf-spp-by">
              <HandleMark handle={project.owner.handle} />
              {project.owner.handle ? <Link className="pf-meta-link" href="/dashboard/profile">{project.owner.handle}</Link> : <span>a builder</span>}
              <span className="pf-spp-dot" aria-hidden="true">&bull;</span>
              <span className="pf-spp-muted">{entries.length} journal {entries.length === 1 ? "entry" : "entries"}</span>
              <span className="pf-spp-dot" aria-hidden="true">&bull;</span>
              <span className="pf-spp-muted">Started {relativeTime(project.createdAt)}</span>
              <span className="pf-column-pill" data-status={status}>{projectStatusLabel(project.status)}</span>
              <span className="pf-column-tag">
                {project.track ? <span className="pf-swatch" aria-hidden="true" /> : null}
                {project.track ?? "Track not picked"}
              </span>
            </p>
          </div>
          <div className="pf-spp-tools">
            {open ? <Link className="pf-btn pri" href={`${base}/journal/new`}>New journal entry</Link> : null}
            {shipHint ? <TabLink tab="ship" href={projectTabHref(base, "ship")}>{shipHint}</TabLink> : null}
          </div>
        </div>

        <p className={project.description ? "pf-spp-desc pf-project-lead" : "pf-spp-desc pf-project-lead pf-muted"}>{project.description ?? "No description yet."}</p>

        <dl className="pf-spp-facts">
          <div>
            <dt>Approved hours</dt>
            <dd>{hours.approved} H</dd>
          </div>
          <div>
            <dt>Logged by you</dt>
            <dd>{formatHours(stats.hours)}</dd>
          </div>
          {project.repoUrl ? (
            <div>
              <dt>Used by</dt>
              <dd>{usedBy}</dd>
            </div>
          ) : null}
        </dl>

        <div className="pf-spp-links">
          {project.repoUrl ? (
            <a className="pf-spp-link" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
              <span>Source</span>
              {source ? <span className="pf-spp-link-host">{source.split("/")[0]}</span> : null}
            </a>
          ) : null}
          {project.demoUrl ? (
            <a className="pf-spp-link" href={project.demoUrl} target="_blank" rel="noopener noreferrer">
              <span>Demo</span>
              {demo ? <span className="pf-spp-link-host">{demo.split("/")[0]}</span> : null}
            </a>
          ) : null}
          {hardware ? (
            <a className="pf-spp-link" href="https://lapse.hackclub.com/timelapse/create" target="_blank" rel="noopener noreferrer">
              <span>Start timelapse</span>
            </a>
          ) : null}
        </div>
      </section>

      <ProfileTabs<ProjectTabKey> items={items} initial={tab} base={base} defaultKey="journal" label="Project sections" idPrefix="pf-project" line />
    </div>
  );
}
