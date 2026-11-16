import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/_components/platform/profile.css";
import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";
import { DepthValue } from "@/app/_components/platform/DepthValue";
import { ProjectCover } from "@/app/_components/platform/ProjectCover";
import { db } from "@/lib/platform/db";
import { EXPLORE_STATUS } from "@/lib/platform/explore";
import { listToolsUsedBy, listUsersOfTool, usedByCounts } from "@/lib/platform/profile-data";
import { handleLabel, summariseHandles } from "@/lib/platform/profile-view";
import { projectHours } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Project - LOADOUT" };

// A public project, read only: who built it, its track and its depth. Only an approved project opens; a draft, a project
// in review or an unknown id is a plain 404, so a link cannot reveal work that has not been published.
export default async function ExploreProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const project = await db().project.findFirst({
    // Hidden projects and banned builders are as good as unknown.
    where: { id, status: EXPLORE_STATUS, hidden: false, owner: { bannedAt: null } },
    select: {
      id: true, title: true, description: true, track: true, status: true, repoUrl: true, demoUrl: true,
      owner: { select: { id: true, handle: true } },
    },
  });
  if (!project) notFound();

  // Who uses this project (confirmed only) and which tools it equips (confirmed, public). Handles only.
  const [used, users, equippedByOwner] = await Promise.all([
    usedByCounts([project.id]),
    listUsersOfTool(project.id, viewer.id),
    listToolsUsedBy(project.owner.id),
  ]);
  const usedCount = used[project.id] ?? 0;
  const confirmedUsers = users.filter((use) => use.status === "confirmed");
  const { shown: shownUsers, more: moreUsers } = summariseHandles(confirmedUsers);
  const equipped = equippedByOwner.filter((use) => use.project.id === project.id);
  const openSource = Boolean(project.repoUrl);

  const hours = projectHours(project.id);
  const build = TRACK_BUILDS.find((item) => item.name === project.track);

  return (
    <>
      <div className="pf-crumbs">
        <Link className="pf-back" href="/dashboard/explore">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to Explore
        </Link>
      </div>

      <div className="pf-project-head">
        <div className="pf-project-head-main">
          <h1>{project.title}</h1>
          <p className={project.description ? "pf-project-lead" : "pf-project-lead pf-muted"}>{project.description ?? "No description."}</p>
          <dl className="pf-meta-box">
            <div>
              <dt>Builder</dt>
              <dd>
                {project.owner.handle ? <Link className="pf-meta-link" href={`/dashboard/builders/${project.owner.handle}`}>{project.owner.handle}</Link> : handleLabel(null)}
              </dd>
            </div>
            <div>
              <dt>Track</dt>
              <dd>{project.track ?? "None"}</dd>
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
            {openSource ? (
              <div>
                <dt>Used by</dt>
                <dd>{usedCount}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="pf-project-head-side">
          <ProjectCover status={project.status} track={project.track} hours={hours} large />
          <div className="pf-side-track" data-track={project.track ? project.track.toLowerCase() : undefined}>
            <span className="pf-side-label">Track</span>
            <span className="pf-side-name">{project.track ?? "None"}</span>
            <span className="pf-side-text">{build?.text ?? "No track."}</span>
          </div>
        </div>
      </div>

      <div className="pf-split">
        {project.repoUrl || project.demoUrl ? (
          <section className="pf-box" aria-labelledby="links-heading">
            <h2 id="links-heading">Links</h2>
            <ul className="pf-prof-links">
              {project.repoUrl ? (
                <li>
                  <span className="pf-prof-link-label">Source code</span> <ExternalLink url={project.repoUrl} />
                </li>
              ) : null}
              {project.demoUrl ? (
                <li>
                  <span className="pf-prof-link-label">Demo</span> <ExternalLink url={project.demoUrl} />
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}
        <section className="pf-box" aria-labelledby="used-by-heading">
          <h2 id="used-by-heading">Used by</h2>
          {confirmedUsers.length === 0 ? (
            <p className="pf-muted">No one has equipped this project yet.</p>
          ) : (
            <p className="pf-prof-handles">
              {shownUsers.map((use) =>
                use.userHandle ? (
                  <Link key={use.id} className="pf-prof-handle" href={`/dashboard/builders/${use.userHandle}`}>{use.userHandle}</Link>
                ) : (
                  <span key={use.id} className="pf-muted">a builder</span>
                ),
              )}
              {moreUsers > 0 ? <span className="pf-muted">and {moreUsers} more</span> : null}
            </p>
          )}
        </section>
      </div>

      <section className="pf-box" aria-labelledby="tools-heading">
        <h2 id="tools-heading">Tools in this project</h2>
        {equipped.length === 0 ? (
          <p className="pf-muted">This project does not equip any tools.</p>
        ) : (
          <ul className="pf-prof-tools">
            {equipped.map((row) => (
              <li key={row.id}>
                <Link className="pf-prof-tool-title" href={`/dashboard/explore/${row.tool.id}`}>{row.tool.title}</Link>{" "}
                <span className="pf-muted">
                  by {row.tool.ownerHandle ? <Link href={`/dashboard/builders/${row.tool.ownerHandle}`}>{row.tool.ownerHandle}</Link> : handleLabel(null)}
                </span>
                <p className="pf-prof-note-line">{row.note}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// Only an https address becomes a link; anything else is shown as plain text. The host and path are the visible text.
function ExternalLink({ url }: { url: string }) {
  let shown = url;
  let safe = false;
  try {
    const parsed = new URL(url);
    safe = parsed.protocol === "https:";
    shown = `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    safe = false;
  }
  return safe ? (
    <a href={url} target="_blank" rel="noopener noreferrer">{shown}</a>
  ) : (
    <span>{shown}</span>
  );
}
