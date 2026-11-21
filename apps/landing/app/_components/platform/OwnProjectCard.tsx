import Link from "next/link";
import { projectCardModel } from "@/lib/platform/project-card";
import { projectHours } from "@/lib/platform/progress";
import { PinGlyph } from "./PinGlyph";
import { ProjectCover } from "./ProjectCover";
import "./project-card.css";
import "./projects.css";

export type OwnProjectCardData = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  status: string;
  pinned?: boolean;
  loggedHours?: number;
  usedBy?: number;
};

// One of your own projects, laid out as the Stasis project card: the cover, the title, two lines of description, then the same
// tags as the profile card (the track, and the stage only when not approved) and one hours line. The whole card is one link named
// by the title and opens the workspace page. Every project is public, drafts included, so the card carries no privacy line.
export function OwnProjectCard({ project }: Readonly<{ project: OwnProjectCardData }>) {
  const hours = projectHours(project.id);
  const card = projectCardModel({ id: project.id, track: project.track, status: project.status, hours, own: true });
  const titleId = `pf-own-title-${project.id}`;
  const footId = `pf-own-foot-${project.id}`;
  return (
    <Link className="pf-card pf-project-card pf-projects-card" href={card.href} aria-labelledby={titleId} aria-describedby={footId}>
      <ProjectCover status={project.status} track={project.track} hours={hours} depth={false} badges={false} />
      <span className="pf-project-body">
        <span className="pf-projects-title" id={titleId}>
          {project.pinned ? (
            <span className="pf-sp-pin" aria-hidden="true">
              <PinGlyph size={14} />
            </span>
          ) : null}
          {project.title}
        </span>
        <span className={project.description ? "pf-card-text pf-clamp" : "pf-card-text pf-muted"}>
          {project.description ?? "No description yet."}
        </span>
        {card.tags.length > 0 ? (
          <span className="pf-sp-tags">
            {card.tags.map((tag) => (
              <span key={tag} className="pf-sp-tag">
                {tag}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <span className="pf-project-foot pf-projects-foot" id={footId}>
        <span>{card.foot}</span>
      </span>
    </Link>
  );
}
