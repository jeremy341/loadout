import Link from "next/link";
import { projectHours } from "@/lib/platform/progress";
import { ProjectCover } from "./ProjectCover";

export type ProjectSummary = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  status: string;
};

// What counts as evidence for the project's track: Hackatime for software, Lapse for Hardware (plans/02). Nothing is
// linked yet, so the footer says so.
function evidenceLabel(track: string | null): string {
  if (track === "Hardware") return "Lapse not linked";
  if (track) return "Hackatime not linked";
  return "Evidence not linked";
}

// One project in the grid, laid out as the Stasis project card: a cover with a status badge and a track badge, then
// the title, the description and the footer.
// The profile variant swaps the evidence footer for what a visitor cares about: approved hours and, for an open-source
// project, how many builders use it.
export function ProjectCard({
  project,
  profile,
}: Readonly<{ project: ProjectSummary; profile?: { usedBy: number; openSource: boolean } }>) {
  return (
    <Link className="pf-card pf-project-card" href={`/dashboard/projects/${project.id}`}>
      <ProjectCover status={project.status} track={project.track} hours={projectHours(project.id)} />
      <div className="pf-project-body">
        <h3>{project.title}</h3>
        <p className={project.description ? "pf-card-text pf-clamp" : "pf-card-text pf-muted"}>
          {project.description ?? "No description yet."}
        </p>
      </div>
      {profile ? (
        <span className="pf-project-foot">
          <span>{projectHours(project.id).approved} H approved</span>
          {profile.openSource ? <span>Used by {profile.usedBy}</span> : null}
        </span>
      ) : (
        <span className="pf-project-foot">
          <span>{evidenceLabel(project.track)}</span>
          <span>0 entries</span>
        </span>
      )}
    </Link>
  );
}
