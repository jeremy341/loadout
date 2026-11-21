import { projectStatusLabel } from "@/lib/platform/projects";
import type { Hours } from "@/lib/platform/progress";
import { mediaUrl } from "@/lib/platform/media-url";
import { DepthValue } from "./DepthValue";

// The cover of a project: a dithered core in the track's colours, a status badge, a track badge and the depth chip.
// Depth is the project's approved hours in metres, 1 M per hour. Used on the card and on the project page. With a cover (the
// owner's uploaded 16:9 image) the picture fills the box; without one the dither shows.
export function ProjectCover({
  status,
  track,
  hours,
  large = false,
  depth = true,
  badges = true,
  cover = null,
  title = "",
}: Readonly<{ status: string; track: string | null; hours: Hours; large?: boolean; depth?: boolean; badges?: boolean; cover?: { id: string; width: number; height: number } | null; title?: string }>) {
  return (
    <div className={large ? "pf-project-cover pf-project-cover-lg" : "pf-project-cover"} data-track={track ? track.toLowerCase() : undefined}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pf-project-cover-img" src={mediaUrl(cover.id)} alt={title ? `Cover of ${title}` : ""} width={cover.width} height={cover.height} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : null}
      {badges ? <span className="pf-badge pf-badge-status">{projectStatusLabel(status)}</span> : null}
      {badges && track ? <span className="pf-badge pf-badge-track">{track}</span> : null}
      {depth ? (
        <span className="pf-core-depth">
          <DepthValue hours={hours} />
        </span>
      ) : null}
    </div>
  );
}
