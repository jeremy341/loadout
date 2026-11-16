import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";
import { DeleteProject } from "@/app/_components/platform/DeleteProject";
import { DepthValue } from "@/app/_components/platform/DepthValue";
import { EditProjectDialog } from "@/app/_components/platform/EditProjectDialog";
import { HackatimePanel } from "@/app/_components/platform/HackatimePanel";
import { ProjectCover } from "@/app/_components/platform/ProjectCover";
import { StageProgress } from "@/app/_components/platform/StageProgress";
import { ToolbeltSection } from "@/app/_components/platform/ToolbeltSection";
import { ToolbeltUsers } from "@/app/_components/platform/ToolbeltUsers";
import { db } from "@/lib/platform/db";
import { listUsersOfTool, listUsesForProject, searchEquippableTools, usedByCounts } from "@/lib/platform/profile-data";
import { normalizeStatus } from "@/lib/platform/profile";
import { TOOLBELT_USERS_MAX } from "@/lib/platform/toolbelt-ui";
import { activeUses, EQUIP_STATUSES, TOOLBELT_MAX_PER_PROJECT } from "@/lib/platform/toolbelt";
import { projectHours } from "@/lib/platform/progress";
import { projectStatusLabel, trackLocked } from "@/lib/platform/projects";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Project - LOADOUT" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// One project, laid out as the Stasis project page and drawn in LOADOUT's style (Paper file "LOADOUT participant
// platform", page "E - Projects", artboard E4): breadcrumb, header with cover and track card, stage strip, Hackatime
// and requirements, then the timeline. Only its owner can open it; any other id is a plain 404.
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const project = await db().project.findFirst({ where: { id, ownerId: viewer.id } });
  if (!project) notFound();

  const hours = projectHours(project.id);
  // Toolbelt: the uses this project equips, the tools it could still equip, and (for a maker) who equipped it.
  const uses = await listUsesForProject(project.id);
  const canEquipMore = EQUIP_STATUSES.includes(normalizeStatus(project.status)) && activeUses(uses).length < TOOLBELT_MAX_PER_PROJECT;
  const tools = canEquipMore ? await searchEquippableTools(viewer.id, "") : [];
  const users = await listUsersOfTool(project.id, viewer.id);
  const blocked = new Set((await db().toolbeltBlock.findMany({ where: { makerId: viewer.id }, select: { blockedId: true } })).map((row) => row.blockedId));
  const showMakerView = (normalizeStatus(project.status) === "approved" && Boolean(project.repoUrl)) || users.length > 0;
  const usedBy = (await usedByCounts([project.id]))[project.id] ?? 0;
  const slotsUsed = activeUses(uses).length;
  const build = TRACK_BUILDS.find((item) => item.name === project.track);
  const hardware = project.track === "Hardware";
  // Each requirement is read from the project. Nothing is linked and no journal exists yet, so those stay open.
  const requirements = [
    { label: "Description written", done: Boolean(project.description?.trim()) },
    { label: "Track picked", done: Boolean(project.track) },
    { label: hardware ? "Lapse recording linked" : "Hackatime linked", done: false },
    { label: "At least one journal entry", done: false },
    ...(hardware ? [{ label: "Bill of materials added", done: false }] : []),
  ];

  return (
    <>
      <div className="pf-crumbs">
        <Link className="pf-back" href="/dashboard/projects">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to projects
        </Link>
        <EditProjectDialog project={{ id: project.id, title: project.title, description: project.description, track: project.track, status: project.status, repoUrl: project.repoUrl, demoUrl: project.demoUrl }} />
      </div>

      <div className="pf-project-head">
        <div className="pf-project-head-main">
          <h1>{project.title}</h1>
          <p className={project.description ? "pf-project-lead" : "pf-project-lead pf-muted"}>
            {project.description ?? "No description yet."}
          </p>
          <dl className="pf-meta-box">
            <div>
              <dt>Status</dt>
              <dd>{projectStatusLabel(project.status)}</dd>
            </div>
            <div>
              <dt>Entries</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>Depth</dt>
              <dd>
                <DepthValue hours={hours} />
              </dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>{hours.approved} H</dd>
            </div>
          </dl>
          <p className="pf-hint pf-depth-note">Depth is your approved hours in metres: 1 M for every approved hour.</p>
          <p className="pf-hint pf-belt-summary">
            <a href="#toolbelt-heading">Toolbelt</a>: {slotsUsed} of {TOOLBELT_MAX_PER_PROJECT} slots in use. Used by {usedBy} {usedBy === 1 ? "builder" : "builders"}.
          </p>
          <div className="pf-actions">
            <div className="pf-actions-row">
              <button type="button" className="pf-btn pri" disabled>+ New journal entry</button>
              <a className="pf-btn" href="https://lapse.hackclub.com/timelapse/create" target="_blank" rel="noopener noreferrer">
                Start timelapse
              </a>
            </div>
            <p className="pf-hint">
              Journal entries open in a later release. Hardware ships need a Lapse recording. Planning 7+ hours? Record the session.
            </p>
          </div>
        </div>

        <div className="pf-project-head-side">
          <ProjectCover status={project.status} track={project.track} hours={hours} large />
          <div className="pf-side-track" data-track={project.track ? project.track.toLowerCase() : undefined}>
            <span className="pf-side-label">Track</span>
            <span className="pf-side-name">{project.track ?? "Not picked"}</span>
            {trackLocked(project.status) ? (
              <span className="pf-tag" title="Locked on submit">
                Locked
              </span>
            ) : null}
            <span className="pf-side-text">{build?.text ?? "No track yet."}</span>
          </div>
        </div>
      </div>

      <StageProgress status={project.status} />

      <div className="pf-split">
        <section className="pf-box" aria-labelledby="hackatime-heading">
          <h2 id="hackatime-heading">Hackatime</h2>
          <HackatimePanel hardware={hardware} />
        </section>

        <section className="pf-box" aria-labelledby="requirements-heading">
          <h2 id="requirements-heading">Ship requirements</h2>
          <ul className="pf-checks">
            {requirements.map((item) => (
              <li key={item.label} data-done={item.done ? "true" : "false"}>
                <span className="pf-check-box" aria-hidden="true">
                  {item.done ? (
                    <svg viewBox="0 0 12 12" width="12" height="12" shapeRendering="crispEdges" focusable="false">
                      <path d="M1 6h2v2h2v2H3V8H1zM5 8h2V6h2V4h2v2H9v2H7v2H5z" />
                    </svg>
                  ) : null}
                </span>
                <span>
                  {item.label}
                  <span className="pf-sr">{item.done ? ", done" : ", not done"}</span>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="pf-btn pf-wide" disabled>Submit for review</button>
          <p className="pf-hint pf-box-note">Ship opens in a later release.</p>
        </section>
      </div>

      <ToolbeltSection
        projectId={project.id}
        projectStatus={project.status}
        uses={uses.map((use) => ({ id: use.id, status: use.status, note: use.note, tool: use.tool }))}
        tools={tools.map((tool) => ({ id: tool.id, title: tool.title, description: tool.description, track: tool.track, ownerHandle: tool.ownerHandle, usedBy: tool.usedBy }))}
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

      <section className="pf-box" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading">Timeline</h2>
        <ol className="pf-timeline">
          <li className="pf-timeline-empty">
            <span>No journal entries yet. Journals open in a later release.</span>
          </li>
          <li>
            <svg className="pf-timeline-plus" viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
              <rect x="5" y="1" width="2" height="10" />
              <rect x="1" y="5" width="10" height="2" />
            </svg>
            <span>Project created</span>
            <time dateTime={project.createdAt.toISOString()}>{dateFormat.format(project.createdAt)}</time>
          </li>
        </ol>
      </section>

      <DeleteProject id={project.id} title={project.title} />
    </>
  );
}
