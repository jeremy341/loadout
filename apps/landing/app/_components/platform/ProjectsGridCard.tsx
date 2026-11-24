import Link from "next/link";
import { cardFoot } from "@/lib/platform/project-card";
import { profileProjectHref } from "@/lib/platform/profile-view";
import { projectStatusLabel } from "@/lib/platform/projects";
import { projectHours } from "@/lib/platform/progress";
import { PinGlyph } from "./PinGlyph";
import { ProjectCover } from "./ProjectCover";
import "./projects-grid.css";

export type ProjectsGridCardData = { id: string; title: string; description: string | null; track: string | null; status: string; pinned?: boolean };

// The card on the Projects page, built after the Stasis project card (app/components/projects/ProjectCard.tsx): one link, the cover
// with the stage tag at the top left and the track at the top right, then the title, one hours line and two lines of description.
// The description line is left out when there is none, as in Stasis. The whole card is one link named by the title. On a phone the
// cover and description are hidden and a text line (track, then status) takes the badges' place, so the row stays compact.
export function ProjectsGridCard({ project }: Readonly<{ project: ProjectsGridCardData }>) {
  const hours = projectHours(project.id);
  const titleId = `pf-sg-title-${project.id}`;
  const footId = `pf-sg-foot-${project.id}`;
  return (
    <Link className="pf-sg-card" data-track={project.track ? project.track.toLowerCase() : undefined} href={profileProjectHref(true, project.id)} aria-labelledby={titleId} aria-describedby={footId}>
      <ProjectCover status={project.status} track={project.track} hours={hours} depth={false} badges initial={Array.from(project.title.trim())[0]?.toUpperCase() ?? ""} />
      <span className="pf-sg-body">
        <span className="pf-sg-top">
          <span className="pf-sg-title" id={titleId}>
            {project.pinned ? (
              <span className="pf-sg-pin" aria-hidden="true">
                <PinGlyph size={14} />
              </span>
            ) : null}
            <span className="pf-sg-title-text">{project.title}</span>
          </span>
          <span className="pf-sg-hours" aria-hidden="true">{(Math.round(hours.approved * 10) / 10).toFixed(1)}h</span>
        </span>
        <span className="pf-sg-meta">
          {project.track ?? "Track not picked"}
          <span aria-hidden="true"> / </span>
          {projectStatusLabel(project.status)}
        </span>
        <span className="pf-sr" id={footId}>
          {cardFoot(hours)}
        </span>
        {project.description ? <span className="pf-sg-desc">{project.description}</span> : null}
      </span>
    </Link>
  );
}
