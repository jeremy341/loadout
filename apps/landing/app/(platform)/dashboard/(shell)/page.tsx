import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";
import { db } from "@/lib/platform/db";
import { oreBalance, trackProgress, trackStatus } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Overview - LOADOUT" };

export default async function OverviewPage() {
  const viewer = await requireViewer();
  const byStatus = await db().project.groupBy({
    by: ["status"],
    where: { ownerId: viewer.id },
    _count: { _all: true },
  });
  const projects = byStatus.reduce((sum, row) => sum + row._count._all, 0);
  const levels = new Map(trackProgress().map((row) => [row.track, row.level]));

  return (
    <>
      {/* The headline block uses the homepage's hero treatment: meta labels above, corner brackets around the title. */}
      <div className="pf-hero">
        <div className="pf-hero-meta" aria-hidden="true">
          <span>
            51.4912° N
            <br />
            7.0452° E
            <br />
            Zeche Revier
          </span>
          <span>
            4 tracks
            <br />
            Tools to Hardware
          </span>
        </div>
        <div className="pf-hero-frame">
          <span className="pf-corner top-left" aria-hidden="true" />
          <span className="pf-corner top-right" aria-hidden="true" />
          <span className="pf-corner bottom-left" aria-hidden="true" />
          <span className="pf-corner bottom-right" aria-hidden="true" />
          <h1>Overview</h1>
          <p className="pf-lead">Your Ore, your track levels and your projects. Figures appear once approved work exists.</p>
        </div>
      </div>

      <dl className="pf-facts pf-facts-three">
        <div>
          <dt>Ore on hand</dt>
          <dd>{oreBalance().toLocaleString("en-GB")}</dd>
        </div>
        <div>
          <dt>Projects</dt>
          <dd>{projects}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd className="pf-next">{projects === 0 ? "Start a project" : "Write a journal entry"}</dd>
        </div>
      </dl>

      <section className="pf-section" aria-labelledby="tracks-heading">
        <h2 id="tracks-heading">Tracks</h2>
        <ul className="pf-track-grid">
          {TRACK_BUILDS.map((build, index) => (
            <li className="pf-card pf-track-card" key={build.name}>
              <div className="pf-card-top">
                <span>{`TRACK 0${index + 1}`}</span>
                <Image src={`/loadout/sprites/${build.icon}.png`} alt="" width={32} height={32} unoptimized />
              </div>
              <h3>{build.name}</h3>
              <p className="pf-card-text">{build.text}</p>
              <span className="pf-chip">{build.tag}</span>
              <span className="pf-track-status">{trackStatus(levels.get(build.name) ?? 0)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="pf-section" aria-labelledby="start-heading">
        <h2 id="start-heading">Start here</h2>
        <div className="pf-panel">
          {projects === 0 ? (
            <p className="pf-start-text">
              Projects open in a later release. Your projects, ship decisions and journal entries will show here as they happen.
            </p>
          ) : (
            <>
              <ul className="pf-status-list">
                {byStatus.map((row) => (
                  <li key={row.status}>
                    <span>{row.status}</span>
                    <span>{row._count._all}</span>
                  </li>
                ))}
              </ul>
              <p><Link href="/dashboard/projects">Open projects</Link></p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
