import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";
import { DepthValue } from "@/app/_components/platform/DepthValue";
import { ProjectCover } from "@/app/_components/platform/ProjectCover";
import { db } from "@/lib/platform/db";
import { EXPLORE_STATUS } from "@/lib/platform/explore";
import { projectHours } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Project - LOADOUT" };

// A public project, read only: who built it, its track and its depth. Only an approved project opens; a draft, a project
// in review or an unknown id is a plain 404, so a link cannot reveal work that has not been published.
export default async function ExploreProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  const project = await db().project.findFirst({
    where: { id, status: EXPLORE_STATUS },
    select: { id: true, title: true, description: true, track: true, status: true, owner: { select: { displayName: true } } },
  });
  if (!project) notFound();

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
              <dd>{project.owner.displayName}</dd>
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
    </>
  );
}
