import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/_components/platform/explore.css";
import "@/app/_components/platform/profile.css";
import { DepthValue } from "@/app/_components/platform/DepthValue";
import { SaveButton, SavedStatus } from "@/app/_components/platform/SaveButton";
import { ProjectCover } from "@/app/_components/platform/ProjectCover";
import { db } from "@/lib/platform/db";
import { isBookmarked } from "@/lib/platform/discover-data";
import { EXPLORE_STATUS } from "@/lib/platform/explore";
import { listToolsUsedBy, listUsersOfTool, usedByCounts } from "@/lib/platform/profile-data";
import { handleLabel, summariseHandles } from "@/lib/platform/profile-view";
import { projectHours } from "@/lib/platform/progress";
import { trackSlugOf } from "@/lib/platform/search-view";
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
  const saved = await isBookmarked(viewer.id, project.id);
  const trackSlug = trackSlugOf(project.track);

  return (
    <>
      <div className="pf-crumbs">
        <Link className="pf-back" href="/dashboard/explore">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to Explore
        </Link>
        <SaveButton projectId={project.id} saved={saved} title={project.title} variant="button" />
      </div>
      <SavedStatus className="pf-explore-saved-status" />

      <div className="pf-explore-hero">
        <ProjectCover status={project.status} track={project.track} hours={hours} large />
        <div className="pf-explore-plate">
          <div className="pf-explore-plate-main">
            <h1>{project.title}</h1>
            <p className={project.description ? "pf-explore-lead" : "pf-explore-lead pf-muted"}>{project.description ?? "No description yet."}</p>
            <p className="pf-explore-byline">
              <span>
                By{" "}
                {project.owner.handle ? (
                  <Link className="pf-meta-link" href={`/dashboard/builders/${project.owner.handle}`}>
                    {project.owner.handle}
                  </Link>
                ) : (
                  handleLabel(null)
                )}
              </span>
              <span className="pf-explore-tag" data-track={trackSlug}>
                <span className="pf-swatch" aria-hidden="true" />
                {project.track ?? "Track not picked"}
              </span>
            </p>
            {project.repoUrl || project.demoUrl ? (
              <div className="pf-explore-actions">
                {project.repoUrl ? <ExternalButton label="Source" url={project.repoUrl} /> : null}
                {project.demoUrl ? <ExternalButton label="Demo" url={project.demoUrl} /> : null}
              </div>
            ) : null}
          </div>
          <dl className="pf-explore-stats">
            <div>
              <dt>Approved hours</dt>
              <dd>{hours.approved} H</dd>
            </div>
            <div>
              <dt>Depth</dt>
              <dd>
                <DepthValue hours={hours} />
              </dd>
            </div>
            <div>
              <dt>Journal entries</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>{openSource ? "Used by" : "Pending hours"}</dt>
              <dd>{openSource ? usedCount : `${hours.pending} H`}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="pf-split">
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
      </div>

      <section className="pf-box" aria-labelledby="journal-heading">
        <h2 id="journal-heading">Journal</h2>
        <ul className="pf-timeline">
          <li className="pf-timeline-empty">No journal entries yet. Journals open in a later release.</li>
        </ul>
      </section>

      {project.repoUrl ? (
        <section className="pf-box" aria-labelledby="readme-heading">
          <h2 id="readme-heading">README</h2>
          <p className="pf-muted pf-box-note">The README shows here once the source address is set and readable.</p>
        </section>
      ) : null}
    </>
  );
}

// Only an https address becomes a link; anything else is shown as plain text. The label is the button text and the host and
// path follow it, so the destination is always visible.
function ExternalButton({ label, url }: { label: string; url: string }) {
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
    <a className="pf-btn pf-explore-action" href={url} target="_blank" rel="noopener noreferrer">
      <span>{label}</span>
      <span className="pf-explore-action-host">{shown}</span>
    </a>
  ) : (
    <span className="pf-explore-action pf-explore-action-plain">
      <span>{label}</span> <span className="pf-explore-action-host">{shown}</span>
    </span>
  );
}
