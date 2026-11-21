import Link from "next/link";
import type { ProfileProjectRow } from "@/lib/platform/profile-data";
import { EXPLORE_PAGE_SIZE } from "@/lib/platform/explore";
import { projectCardModel } from "@/lib/platform/project-card";
import { projectHours } from "@/lib/platform/progress";
import { PinGlyph } from "./PinGlyph";
import { ProjectCover } from "./ProjectCover";
import { ProjectsCarousel } from "./ProjectsCarousel";
import "./profile.css";
import "./project-card.css";

// After Stasis's Projects card: a heading, then a grid of one, two or three columns. The whole card is one link whose name is
// the project title: the owner opens the workspace page, a visitor the public page. One tag per fact (lib/platform/project-card.ts):
// the track, and the stage only when the project is not approved. The foot is one line of hours (visitors see approved and pending
// hours, never Ore). A pinned project sorts first and carries one pin mark beside its title.
export function ProfileProjects({ rows, own }: Readonly<{ rows: ProfileProjectRow[]; own: boolean }>) {
  const shown = rows.slice(0, EXPLORE_PAGE_SIZE);
  return (
    <section className="pf-sp-card" aria-labelledby="projects-heading">
      {rows.length === 0 ? (
        <>
          <h2 id="projects-heading">Projects</h2>
        <p className="pf-sp-empty">
          No projects yet
          {own ? (
            <>
              . <Link href="/dashboard/projects/new">Start a project</Link>
            </>
          ) : null}
        </p>
        </>
      ) : (
        <ProjectsCarousel count={rows.length}>
          {shown.map((row) => {
            const hours = projectHours(row.id);
            const card = projectCardModel({ id: row.id, track: row.track, status: row.status, hours, own });
            const titleId = `pf-sp-title-${row.id}`;
            const footId = `pf-sp-foot-${row.id}`;
            return (
              <li key={row.id}>
                <Link className="pf-sp-project" href={card.href} aria-labelledby={titleId} aria-describedby={footId}>
                  <ProjectCover status={row.status} track={row.track} hours={hours} depth={false} badges={false} />
                  <span className="pf-sp-project-body">
                    <span className="pf-sp-project-title" id={titleId}>
                      {row.pinned ? (
                        <span className="pf-sp-pin" data-testid="pinned-tag" aria-hidden="true">
                          <PinGlyph size={14} />
                        </span>
                      ) : null}
                      {row.title}
                    </span>
                    {row.description ? <span className="pf-sp-project-text">{row.description}</span> : null}
                    {card.tags.length > 0 ? (
                      <span className="pf-sp-tags">
                        {card.tags.map((tag) => (
                          <span key={tag} className="pf-sp-tag">
                            {tag}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    <span className="pf-sp-foot" id={footId}>{card.foot}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ProjectsCarousel>
      )}
    </section>
  );
}
