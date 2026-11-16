import Link from "next/link";
import type { Hours } from "@/lib/platform/progress";
import { projectStatusLabel } from "@/lib/platform/projects";
import { repoHost } from "@/lib/platform/search-view";
import { DepthValue } from "./DepthValue";
import { StatsRow } from "./StatsRow";
import "./project-page.css";

// The top of an owner's project page (stardance-layout.md D.1): a wide dithered core in the track's colours with the status and
// track badges and the depth chip, then an identity plate joined to it with no gap. The plate says whose project it is, what it is,
// and what it has done. Actions sit in one row under the description; the one filled button is the one that can be used.
export function ProjectHero({
  title,
  description,
  status,
  track,
  locked,
  handle,
  hours,
  usedBy,
  repoUrl,
  demoUrl,
}: Readonly<{
  title: string;
  description: string | null;
  status: string;
  track: string | null;
  locked: boolean;
  handle: string | null;
  hours: Hours;
  // null for a project without a source address: it cannot be equipped, so "Used by" gives way to pending hours.
  usedBy: number | null;
  repoUrl: string | null;
  demoUrl: string | null;
}>) {
  const slug = track ? track.toLowerCase() : undefined;
  const source = repoHost(repoUrl);
  const demo = repoHost(demoUrl);
  return (
    <header className="pf-proj-hero" data-track={slug}>
      <div className="pf-proj-cover">
        <span className="pf-badge pf-badge-status">{projectStatusLabel(status)}</span>
        {track ? <span className="pf-badge pf-badge-track">{track}</span> : null}
        <span className="pf-core-depth" aria-hidden="true">
          <DepthValue hours={hours} />
        </span>
      </div>
      <div className="pf-proj-plate">
        <div className="pf-proj-id">
          <h1>{title}</h1>
          <p className="pf-proj-tags">
            <span className="pf-proj-track">
              {track ? <span className="pf-swatch" aria-hidden="true" /> : null}
              {track ?? "Track not picked"}
            </span>
            {locked ? (
              <span className="pf-tag" title="Locked on submit">
                Locked
              </span>
            ) : null}
            <span className="pf-proj-by">{handle ? <>By <Link href="/dashboard/profile">{handle}</Link></> : "By a builder"}</span>
          </p>
          <p className={description ? "pf-project-lead" : "pf-project-lead pf-muted"}>{description ?? "No description yet."}</p>
          <div className="pf-proj-actions">
            <div className="pf-proj-actions-row">
              <button type="button" className="pf-btn pri" disabled aria-describedby="proj-actions-reason">
                New journal entry
              </button>
              <a className="pf-btn" href="https://lapse.hackclub.com/timelapse/create" target="_blank" rel="noopener noreferrer">
                Start timelapse
              </a>
              {repoUrl ? (
                <a className="pf-btn" href={repoUrl} target="_blank" rel="noopener noreferrer">
                  Source
                  {source ? <span className="pf-proj-host">{source.split("/")[0]}</span> : null}
                </a>
              ) : null}
              {demoUrl ? (
                <a className="pf-btn" href={demoUrl} target="_blank" rel="noopener noreferrer">
                  Demo
                  {demo ? <span className="pf-proj-host">{demo.split("/")[0]}</span> : null}
                </a>
              ) : null}
            </div>
            <p className="pf-hint" id="proj-actions-reason">
              Journal entries open in a later release. Hardware ships need a Lapse recording. Planning 7+ hours? Record the session.
            </p>
          </div>
        </div>
        <StatsRow hours={hours} entries={0} usedBy={usedBy} />
      </div>
    </header>
  );
}
