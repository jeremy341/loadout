import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteProject } from "@/app/_components/platform/DeleteProject";
import { EditProjectDialog } from "@/app/_components/platform/EditProjectDialog";
import { HackatimePanel } from "@/app/_components/platform/HackatimePanel";
import { ProjectHero } from "@/app/_components/platform/ProjectHero";
import { StageProgress } from "@/app/_components/platform/StageProgress";
import { ToolbeltSection } from "@/app/_components/platform/ToolbeltSection";
import { ToolbeltUsers } from "@/app/_components/platform/ToolbeltUsers";
import { db } from "@/lib/platform/db";
import { searchEquippableTools } from "@/lib/platform/discover-data";
import { listUsersOfTool, listUsesForProject, usedByCounts } from "@/lib/platform/profile-data";
import { normalizeStatus } from "@/lib/platform/profile";
import { TOOLBELT_USERS_MAX } from "@/lib/platform/toolbelt-ui";
import { activeUses, EQUIP_STATUSES, TOOLBELT_MAX_PER_PROJECT } from "@/lib/platform/toolbelt";
import { projectHours } from "@/lib/platform/progress";
import { trackLocked } from "@/lib/platform/projects";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Project - LOADOUT" };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// One project as a core sample sheet (stardance-layout.md D): crumb row, the hero (dithered core, identity plate, four numbers),
// the stage band, then the Toolbelt before Hackatime and Ship, then the journal. Only its owner can open it; any other id is a plain 404.
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const project = await db().project.findFirst({ where: { id, ownerId: viewer.id }, include: { owner: { select: { handle: true } } } });
  if (!project) notFound();

  const hours = projectHours(project.id);
  // Toolbelt: the uses this project equips, the saved tools it could equip next, and (for a maker) who equipped it.
  const uses = await listUsesForProject(project.id);
  const canEquipMore = EQUIP_STATUSES.includes(normalizeStatus(project.status)) && activeUses(uses).length < TOOLBELT_MAX_PER_PROJECT;
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
  const showMakerView = (normalizeStatus(project.status) === "approved" && Boolean(project.repoUrl)) || users.length > 0;
  const usedBy = (await usedByCounts([project.id]))[project.id] ?? 0;
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

      <ProjectHero
        title={project.title}
        description={project.description}
        status={project.status}
        track={project.track}
        locked={trackLocked(project.status)}
        handle={project.owner.handle}
        hours={hours}
        usedBy={project.repoUrl ? usedBy : null}
        repoUrl={project.repoUrl}
        demoUrl={project.demoUrl}
      />

      <nav className="pf-proj-jump" aria-label="On this page">
        <a href="#toolbelt">Toolbelt</a>
        <a href="#hackatime">Hackatime</a>
        <a href="#ship">Ship</a>
        <a href="#journal">Journal</a>
      </nav>

      <div className="pf-proj-flow">
      <StageProgress status={project.status} />

      <ToolbeltSection
        projectId={project.id}
        projectStatus={project.status}
        uses={uses.map((use) => ({ id: use.id, status: use.status, note: use.note, tool: use.tool }))}
        savedTools={savedTools}
        hours={hours}
      />
      </div>

      <div className="pf-split">
        <section className="pf-box" aria-labelledby="hackatime-heading" id="hackatime">
          <h2 id="hackatime-heading">Hackatime</h2>
          <HackatimePanel hardware={hardware} />
        </section>

        <section className="pf-box" aria-labelledby="requirements-heading" id="ship">
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

      <section className="pf-box" aria-labelledby="timeline-heading" id="journal">
        <h2 id="timeline-heading">Journal</h2>
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

      {project.repoUrl ? (
        <section className="pf-box" aria-labelledby="readme-heading">
          <h2 id="readme-heading">README</h2>
          <p className="pf-muted">The README shows here once the source address is set and readable.</p>
        </section>
      ) : null}

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

      <DeleteProject id={project.id} title={project.title} />
    </>
  );
}
