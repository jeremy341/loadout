import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import "@/app/_components/platform/expeditions.css";
import { EmptyState } from "@/app/_components/platform/EmptyState";
import { ExpeditionFilters } from "@/app/_components/platform/expeditions/ExpeditionFilters";
import { ExpeditionPager } from "@/app/_components/platform/expeditions/ExpeditionPager";
import { MissionCard } from "@/app/_components/platform/expeditions/MissionCard";
import { PageHead } from "@/app/_components/platform/PageHead";
import { viewerExpeditions } from "@/lib/platform/expedition-data";
import { expeditionsHref, filterMissions, missionStatus, MISSIONS, pageMissions, parseExpeditionsQuery, sortByState, statusCounts } from "@/lib/platform/expeditions";
import { TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";
import { trackSlug } from "@/lib/platform/tracks";

export const metadata: Metadata = { title: "Expeditions - LOADOUT" };

const TRACK_OPTIONS = TRACKS.map((track) => ({ value: trackSlug(track), label: track }));

// Expeditions: guided missions a builder follows to learn a skill (plans/11 "Missions"). The layout follows Stasis Discover
// (one search, one card grid, pages by link) in our pixel style. Open work comes first, so the state of each expedition is
// a word on its card and there are no group headings or status filter. The old ?status= address goes back to the list.
// A builder equips an expedition on a project; submissions open with the release. The missions are a proposed fixture.
export default async function ExpeditionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireViewer();
  const raw = await searchParams;
  const query = parseExpeditionsQuery(raw);
  if (raw.status !== undefined) redirect(expeditionsHref({ track: query.track }));

  const { progress, equipped } = await viewerExpeditions(viewer.id);
  const matches = filterMissions(MISSIONS, query);
  const sorted = sortByState(matches, progress);
  const { items, page, pages, total } = pageMissions(sorted, query.page);
  const counts = statusCounts(matches, progress);
  const filtered = query.q !== "" || query.track !== null;

  return (
    <>
      <PageHead title="Expeditions">Guided missions that teach one skill, one step at a time.</PageHead>

      <p className="pf-event-line">
        <span className="pf-event-dot" aria-hidden="true" />
        Equip an expedition on a project and its approved hours count toward the steps.
      </p>

      <ExpeditionFilters key={`${query.q}|${query.track ?? ""}`} q={query.q} track={query.track ? trackSlug(query.track) : ""} tracks={TRACK_OPTIONS} />

      <p className="ex-count" role="status">
        {total} {total === 1 ? "expedition" : "expeditions"}
        {total > 0 ? `. ${counts["in-progress"]} in progress, ${counts.available} ready, ${counts.locked} locked, ${counts.done} done.` : "."}
      </p>

      {total === 0 ? (
        filtered ? (
          <EmptyState action={<Link href="/dashboard/shop/expeditions">Clear the search</Link>}>No expeditions match.</EmptyState>
        ) : (
          <EmptyState>No expeditions are listed yet.</EmptyState>
        )
      ) : (
        <>
          <ul className="ex-grid">
            {items.map((mission) => (
              <li key={mission.id}>
                <MissionCard mission={mission} status={missionStatus(mission, progress)} progress={progress} equippedOn={equipped.find((row) => row.active && row.expeditionId === mission.id)?.projectTitle} />
              </li>
            ))}
          </ul>
          <ExpeditionPager query={query} page={page} pages={pages} />
        </>
      )}
    </>
  );
}
