import { projectStatusLabel } from "@/lib/platform/projects";
import type { Hours } from "@/lib/platform/progress";
import { DepthValue } from "./DepthValue";

// The cover of a project: a dithered core in the track's colours, a status badge, a track badge and the depth chip.
// Depth is the project's approved hours in metres, 1 M per hour. Used on the card and on the project page.
export function ProjectCover({
  status,
  track,
  hours,
  large = false,
}: Readonly<{ status: string; track: string | null; hours: Hours; large?: boolean }>) {
  return (
    <div className={large ? "pf-project-cover pf-project-cover-lg" : "pf-project-cover"} data-track={track ? track.toLowerCase() : undefined}>
      <span className="pf-badge pf-badge-status">{projectStatusLabel(status)}</span>
      {track ? <span className="pf-badge pf-badge-track">{track}</span> : null}
      <span className="pf-core-depth">
        <DepthValue hours={hours} />
      </span>
    </div>
  );
}
