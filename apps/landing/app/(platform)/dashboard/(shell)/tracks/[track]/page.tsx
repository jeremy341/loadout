import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";
import { CoreLog } from "@/app/_components/platform/CoreLog";
import { db } from "@/lib/platform/db";
import {
  formatDepth,
  hoursForLevel,
  hoursToNextLevel,
  LEVEL_CAP,
  LEVEL_HOURS,
  levelForHours,
  projectHours,
  sampleTrackHours,
  TRACKS,
} from "@/lib/platform/progress";
import { projectStatusLabel } from "@/lib/platform/projects";
import { requireViewer } from "@/lib/platform/session";
import { TRACK_ABOUT, trackBySlug, trackSlug } from "@/lib/platform/tracks";

export const metadata: Metadata = { title: "Track - LOADOUT" };

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// One track, drawn as a core log (Paper file "LOADOUT participant platform", page "E - Projects", artboard E6): the
// fifteen levels with the hours each one needs, how many hours are missing for the next, and what counts toward it. The
// hours are sample figures until approved hours exist.
export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const viewer = await requireViewer();
  const { track: slug } = await params;
  const track = trackBySlug(slug);
  if (!track) notFound();

  const hours = sampleTrackHours(track);
  const level = levelForHours(hours.approved);
  const next = level < LEVEL_CAP ? level + 1 : null;
  const missing = hoursToNextLevel(hours.approved);
  const from = hoursForLevel(level);
  const to = next ? LEVEL_HOURS[next - 1] : from;
  const span = to - from;
  const approvedPct = next && span > 0 ? clamp(((hours.approved - from) / span) * 100) : 100;
  const pendingPct = next && span > 0 ? Math.min(clamp((Math.min(hours.pending, to - hours.approved) / span) * 100), 100 - approvedPct) : 0;
  const build = TRACK_BUILDS.find((item) => item.name === track);
  const about = TRACK_ABOUT[track];
  const projects = await db().project.findMany({ where: { ownerId: viewer.id, track }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div className="pf-track-page" data-track={trackSlug(track)}>
      <Link className="pf-back" href="/dashboard">
        <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
        </svg>
        Back to overview
      </Link>

      <div className="pf-track-head">
        <div className="pf-track-title">
          <div className="pf-track-name">
            <span className="pf-swatch" aria-hidden="true" />
            <h1>{track}</h1>
            <span className="pf-tag">Track 0{TRACKS.indexOf(track) + 1}</span>
          </div>
          <p className="pf-project-lead">{build?.text}</p>
        </div>
        <div className="pf-track-depth">
          <span
            className="pf-track-depth-value"
            role="img"
            aria-label={`Depth ${formatDepth(hours.approved)}, from ${hours.approved} approved hours in ${track}`}
          >
            {formatDepth(hours.approved)}
          </span>
          <span className="pf-track-depth-note">
            Depth in {track} / {hours.approved} approved hours
          </span>
        </div>
      </div>

      <div className="pf-track-columns">
        <CoreLog hours={hours} />

        <div className="pf-track-side">
          <dl className="pf-tiles">
            <div>
              <dt>Approved</dt>
              <dd>{hours.approved} H</dd>
              <dd className="pf-tile-note">signed off by a reviewer</dd>
            </div>
            <div className="pf-tile-pending">
              <dt>Pending</dt>
              <dd>+{hours.pending} H</dd>
              <dd className="pf-tile-note">waiting for review</dd>
            </div>
            <div className="pf-tile-next">
              <dt>{next ? `To LV.${next}` : "Level"}</dt>
              <dd>{missing === null ? `LV.${LEVEL_CAP}` : `${missing} H`}</dd>
              <dd className="pf-tile-note">{missing === null ? "max level reached" : "missing for the next level"}</dd>
            </div>
          </dl>

          <section className="pf-box" aria-labelledby="progress-heading">
            <h2 id="progress-heading">{next ? `Progress to LV.${next}` : "Max level"}</h2>
            <p className="pf-panel-lead">
              {next ? (
                <>
                  Earn <strong className="pf-accent">{missing} more approved hours</strong> in {track} to reach LV.{next}.
                  {hours.pending > 0 ? ` ${hours.pending} hours are waiting for review.` : ""}
                </>
              ) : (
                `You have reached LV.${LEVEL_CAP} in ${track}.`
              )}
            </p>
            <div className="pf-meter" role="img" aria-label={`${hours.approved} of ${to} hours toward the next level, ${hours.pending} more pending`}>
              <div className="pf-meter-fill" style={{ width: `${approvedPct}%` }} aria-hidden="true" />
              {pendingPct > 0 ? (
                <div className="pf-meter-pending" style={{ left: `${approvedPct}%`, width: `${pendingPct}%` }} aria-hidden="true" />
              ) : null}
            </div>
            <div className="pf-meter-ends">
              <span>{from} H {level > 0 ? `(LV.${level})` : "(start)"}</span>
              {next ? <span>{to} H (LV.{next})</span> : null}
            </div>
          </section>

          <section className="pf-box" aria-labelledby="about-heading">
            <h2 id="about-heading">What counts in {track}</h2>
            <p className="pf-panel-lead pf-about-lead">{about.summary}</p>
            <ul className="pf-counts">
              {about.counts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="pf-box" aria-labelledby="track-projects-heading">
            <div className="pf-box-head">
              <h2 id="track-projects-heading">{track} projects</h2>
              <Link href="/dashboard/projects">+ Start one</Link>
            </div>
            {projects.length === 0 ? (
              <p className="pf-hint">No {track} projects yet.</p>
            ) : (
              <ul className="pf-track-projects">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link href={`/dashboard/projects/${project.id}`}>{project.title}</Link>
                    <span>
                      {projectStatusLabel(project.status)} / {projectHours(project.id).approved} H approved
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
