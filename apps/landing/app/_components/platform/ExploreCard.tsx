import Link from "next/link";
import { projectHours } from "@/lib/platform/progress";
import { ProjectCover } from "./ProjectCover";

export type ExploreProject = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  status: string;
  owner: { displayName: string };
};

// One public project in the Explore grid: the same cover as a builder's own card, then the title, the description and
// who built it. It opens the read-only project page.
export function ExploreCard({ project }: Readonly<{ project: ExploreProject }>) {
  const hours = projectHours(project.id);
  return (
    <Link className="pf-card pf-project-card" href={`/dashboard/explore/${project.id}`}>
      <ProjectCover status={project.status} track={project.track} hours={hours} />
      <div className="pf-project-body">
        <h3>{project.title}</h3>
        <p className={project.description ? "pf-card-text pf-clamp" : "pf-card-text pf-muted"}>
          {project.description ?? "No description."}
        </p>
      </div>
      <span className="pf-project-foot">
        <span>by {project.owner.displayName}</span>
        <span>{hours.approved} H</span>
      </span>
    </Link>
  );
}
