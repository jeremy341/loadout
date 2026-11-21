import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";
import { LevelStrip } from "@/app/_components/platform/LevelStrip";
import { sampleTrackHours, TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";
import { trackBySlug, trackSlug } from "@/lib/platform/tracks";

export const metadata: Metadata = { title: "Track - LOADOUT" };

// One track (Paper file "LOADOUT participant platform", page "E - Projects", artboard E6): the name and what it is, a row to
// switch to another track, one wide level strip (the level, the hours to the next, the discount earned and the twenty levels sideways), then
// two links to the docs. The builder's projects are not repeated here: they live on the Projects page. The hours are sample figures until approved hours exist.
export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  await requireViewer();
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) notFound();

  const hours = sampleTrackHours(track);
  const build = TRACK_BUILDS.find((item) => item.name === track);

  return (
    <div className="pf-track-page pf-flat" data-track={trackSlug(track)}>
      <Link className="pf-back" href="/dashboard/projects">
        <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
        </svg>
        Back to projects
      </Link>

      <div className="pf-track-head">
        <div className="pf-track-name">
          <span className="pf-swatch" aria-hidden="true" />
          <h1>{track}</h1>
        </div>
        <p className="pf-project-lead">{build?.text}</p>
      </div>

      <nav className="pf-explore-filters" aria-label="Switch track">
        {TRACKS.map((item) => (
          <Link key={item} href={`/dashboard/tracks/${trackSlug(item)}`} aria-current={item === track ? "page" : undefined}>
            {item}
          </Link>
        ))}
      </nav>

      <LevelStrip track={track} hours={hours} />

      <div className="pf-track-lower">
        <ul className="pf-track-links">
          <li>
            <Link className="pf-link-tile" href="/docs/progress#levels">
              <span className="pf-link-title">How levels work</span>
              <span className="pf-link-text">Hours, levels and discounts</span>
              <span className="pf-link-arrow" aria-hidden="true">→</span>
            </Link>
          </li>
          <li>
            <Link className="pf-link-tile" href="/docs/tracks">
              <span className="pf-link-title">What counts in {track}</span>
              <span className="pf-link-text">Which projects raise this track</span>
              <span className="pf-link-arrow" aria-hidden="true">→</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
