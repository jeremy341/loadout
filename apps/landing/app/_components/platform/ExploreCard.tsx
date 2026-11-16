import Link from "next/link";
import { handleLabel } from "@/lib/platform/profile-view";
import { projectHours } from "@/lib/platform/progress";
import { trackSlugOf } from "@/lib/platform/search-view";
import { SaveButton } from "./SaveButton";
import "./explore.css";

export type ExploreProject = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  status?: string;
  owner: { handle: string | null };
  // Confirmed Toolbelt uses, shown only for an open-source project (a source address is set).
  usedBy?: number;
  openSource?: boolean;
};

// One public project in Explore, compact: a short dithered cover in the track colours with the track name, the title, two lines
// of description and a foot line (by handle on the left, Used by or hours on the right). No depth chip and no status badge: every
// project here is approved, and depth is 0 M everywhere until hours are real. The whole card is one link. The Save star is a
// sibling of that link (a button inside a link is not allowed), placed over the cover corner by CSS.
export function ExploreCard({ project, saved }: Readonly<{ project: ExploreProject; saved: boolean }>) {
  const hours = projectHours(project.id);
  return (
    <div className="pf-explore-card" data-track={trackSlugOf(project.track)}>
      <Link className="pf-explore-card-link" href={`/dashboard/explore/${project.id}`}>
        <span className="pf-explore-cover" aria-hidden="true" />
        <span className="pf-explore-track">
          <span className="pf-swatch" aria-hidden="true" />
          {project.track ?? "No track"}
        </span>
        <span className="pf-explore-card-body">
          <span className="pf-explore-card-title">{project.title}</span>
          <span className={project.description ? "pf-explore-card-text" : "pf-explore-card-text pf-muted"}>{project.description ?? "No description."}</span>
        </span>
        <span className="pf-explore-foot">
          <span className="pf-foot-by">by {handleLabel(project.owner.handle)}</span>
          {project.openSource ? <span>Used by {project.usedBy ?? 0}</span> : <span>{hours.approved} H</span>}
        </span>
      </Link>
      <span className="pf-explore-star">
        <SaveButton projectId={project.id} saved={saved} title={project.title} variant="card" />
      </span>
    </div>
  );
}
