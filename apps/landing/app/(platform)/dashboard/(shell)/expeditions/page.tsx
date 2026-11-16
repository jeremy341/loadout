import type { Metadata } from "next";
import Link from "next/link";
import "@/app/_components/platform/expeditions.css";
import { PageHead } from "@/app/_components/platform/PageHead";
import { MissionRow } from "@/app/_components/platform/expeditions/MissionRow";
import { expeditionsHref, filterMissions, groupByStatus, MISSION_STATUS_CHIPS, MISSION_STATUS_LABELS, MISSION_STATUSES, MISSIONS, parseExpeditionsQuery, SAMPLE_PROGRESS } from "@/lib/platform/expeditions";
import { TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Expeditions - LOADOUT" };

// Expeditions: guided missions with curated steps, prerequisites and a draft reward (plans/11 "Missions"). After the
// structure of Pixl's quest board and Stardance's missions, without the world: no map, no characters, no chance. Grouped by
// what the builder can do with each one, filtered by track and status through the address, and read-only because
// submissions open with the release. Everything on the page is a proposed fixture.
export default async function ExpeditionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireViewer();
  const query = parseExpeditionsQuery(await searchParams);
  const shown = filterMissions(MISSIONS, query, SAMPLE_PROGRESS);
  const groups = groupByStatus(shown, SAMPLE_PROGRESS);
  const filtered = query.track !== null || query.status !== null;

  return (
    <>
      <PageHead title="Expeditions">Guided missions with numbered steps, the work each one needs and a draft reward.</PageHead>

      <p className="pf-event-line">
        <span className="pf-event-dot" aria-hidden="true" />
        Expeditions open with a later release. These are proposed missions with sample progress, and every reward is a draft.
      </p>

      <div className="ex-filters">
        <nav className="pf-explore-filters" aria-label="Filter by track">
          {[null, ...TRACKS].map((track) => (
            <Link key={track ?? "all"} href={expeditionsHref({ ...query, track })} aria-current={track === query.track ? "page" : undefined}>
              {track ?? "All tracks"}
            </Link>
          ))}
        </nav>
        <nav className="pf-explore-filters" aria-label="Filter by status">
          {[null, ...MISSION_STATUSES].map((status) => (
            <Link key={status ?? "all"} href={expeditionsHref({ ...query, status })} aria-current={status === query.status ? "page" : undefined}>
              {status ? MISSION_STATUS_CHIPS[status] : "Any status"}
            </Link>
          ))}
        </nav>
      </div>

      <p className="ex-count" role="status">
        {shown.length} {shown.length === 1 ? "expedition" : "expeditions"}
      </p>

      {groups.length === 0 ? (
        <p className="pf-empty-line">
          {filtered ? (
            <>
              No expeditions match. <Link href="/dashboard/expeditions">Clear the filters</Link>
            </>
          ) : (
            "No expeditions are listed yet."
          )}
        </p>
      ) : (
        groups.map((group) => (
          <section className="ex-section" key={group.status} aria-labelledby={`ex-group-${group.status}`}>
            <h2 id={`ex-group-${group.status}`}>
              {MISSION_STATUS_LABELS[group.status]} <span className="ex-label ex-num">{group.missions.length}</span>
            </h2>
            <ul className="ex-list">
              {group.missions.map((mission) => (
                <MissionRow key={mission.id} mission={mission} status={group.status} progress={SAMPLE_PROGRESS} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
