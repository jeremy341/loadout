import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/platform/db";
import { nextStep } from "@/lib/platform/next-step";
import {
  discountForHours,
  formatDepth,
  formatDiscount,
  hoursToNextLevel,
  LEVEL_CAP,
  levelCells,
  levelForHours,
  oreBalance,
  sampleTrackHours,
  sumHours,
  TRACKS,
} from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";
import { timeAgo } from "@/lib/platform/time";
import { trackSlug } from "@/lib/platform/tracks";

export const metadata: Metadata = { title: "Overview - LOADOUT" };

// The Overview, kept plain like the Pixl and Stasis dashboards: the one thing to do next, the next event, three numbers,
// the four tracks and what happened lately. Projects live on their own tab. Track hours are sample figures
// until approved hours exist. Ore and the project data are real.
export default async function OverviewPage() {
  const viewer = await requireViewer();
  const projects = await db().project.findMany({
    where: { ownerId: viewer.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, status: true, track: true, createdAt: true },
  });

  const trackHours = TRACKS.map((track) => ({ track, hours: sampleTrackHours(track) }));
  const depth = sumHours(trackHours.map((row) => row.hours));
  const next = nextStep(projects);
  const now = new Date();
  // Recent is built from what really happened: for now, projects being created. Reviews and orders join it later.
  const recent = projects.slice(0, 5).map((project) => ({ id: project.id, href: `/dashboard/projects/${project.id}`, text: `${project.title} was created`, when: timeAgo(project.createdAt, now) }));

  return (
    <>
      <h1 className="pf-sr">Overview</h1>

      <section className="pf-next" aria-labelledby="next-heading">
        <div className="pf-next-text">
          <span className="pf-kicker">Next up</span>
          <h2 id="next-heading">{next.title}</h2>
          <p>{next.text}</p>
        </div>
        <Link className="pf-btn pri" href={next.href}>
          {next.label}
        </Link>
      </section>

      <p className="pf-event-line">
        <span className="pf-event-dot" aria-hidden="true" />
        Next event: dates coming soon.
      </p>

      <dl className="pf-stats">
        <div>
          <dt>Depth</dt>
          <dd>
            <span role="img" aria-label={`Depth ${formatDepth(depth.approved)}, from ${depth.approved} approved hours`}>
              {formatDepth(depth.approved)}
            </span>
          </dd>
          <dd className="pf-tile-note">
            {depth.approved} approved hours{depth.pending > 0 ? `, ${depth.pending} H waiting for review` : ""}
          </dd>
        </div>
        <div>
          <dt>Ore</dt>
          <dd>{oreBalance().toLocaleString("en-GB")}</dd>
          <dd className="pf-tile-note">10 Ore per approved hour</dd>
        </div>
      </dl>

      <section className="pf-section pf-section-plain" aria-labelledby="tracks-heading">
        <h2 id="tracks-heading">Tracks</h2>
        <ul className="pf-track-list">
          {trackHours.map(({ track, hours }) => {
            const level = levelForHours(hours.approved);
            const missing = hoursToNextLevel(hours.approved);
            const off = formatDiscount(discountForHours(hours.approved));
            return (
              <li key={track}>
                <Link
                  className="pf-track-line"
                  href={`/dashboard/tracks/${trackSlug(track)}`}
                  data-track={trackSlug(track)}
                  aria-label={`${track}, level ${level} of ${LEVEL_CAP}, ${off} off ${track} prizes. View levels`}
                >
                  <span className="pf-swatch" aria-hidden="true" />
                  <span className="pf-line-name">{track}</span>
                  <span className="pf-line-lv">LV.{level}</span>
                  <span className="pf-cells" aria-hidden="true">
                    {levelCells(level).map((filled, cell) => (
                      <span key={cell} className={filled ? "pf-cell on" : "pf-cell"} />
                    ))}
                  </span>
                  <span className="pf-line-hours">
                    <b className="pf-line-off">{off} off</b> / {missing === null ? "max level" : `${missing} H to LV.${level + 1}`}
                  </span>
                  <span className="pf-line-arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="pf-box pf-recent-box" aria-labelledby="recent-heading">
        <h2 id="recent-heading">Recent</h2>
        {recent.length === 0 ? (
          <p className="pf-hint">Approvals, hour reviews and orders show up here.</p>
        ) : (
          <ul className="pf-recent">
            {recent.map((item) => (
              <li key={item.id}>
                <span className="pf-recent-dot" aria-hidden="true" />
                <Link className="pf-recent-text" href={item.href}>
                  {item.text}
                </Link>
                <span className="pf-recent-when">{item.when}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
