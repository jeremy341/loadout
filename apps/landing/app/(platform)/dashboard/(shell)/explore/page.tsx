import type { Metadata } from "next";
import Link from "next/link";
import { ExploreCard } from "@/app/_components/platform/ExploreCard";
import { ExploreRail } from "@/app/_components/platform/ExploreRails";
import { ExploreSearch } from "@/app/_components/platform/ExploreSearch";
import { SavedStatus } from "@/app/_components/platform/SaveButton";
import { countBookmarks, discoverRails, listBookmarks, searchProjects, type SearchRow } from "@/lib/platform/discover-data";
import {
  EXPLORE_RESULTS_SIZE,
  emptyResultsKind,
  exploreHref,
  isFiltered,
  pageWindow,
  parseExploreParams,
  projectCountLine,
  usedMostRows,
} from "@/lib/platform/explore";
import { TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Explore - LOADOUT" };

const RAIL_TRACK_SIZE = 4;
const SAVED_RAIL_SIZE = 8;

function Card({ row }: { row: SearchRow }) {
  return (
    <ExploreCard
      saved={row.saved}
      project={{ id: row.id, title: row.title, description: row.description, track: row.track, owner: { handle: row.ownerHandle }, usedBy: row.usedBy, openSource: row.hasRepo }}
    />
  );
}

// Explore: approved projects from every builder. Search first (live rows under the field), then the track and Saved chips, then
// either short rails (Saved, New, Used most, one per track) or, once there is a search or a filter, a paged grid. The whole
// results page is plain links and a GET form, so it works with no script: ?q=&track=&saved=1&page=.
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireViewer();
  const params = parseExploreParams(await searchParams);
  const { q, track, saved } = params;
  const filtered = isFiltered(params);
  const savedCount = await countBookmarks(viewer.id);

  return (
    <>
      <h1 className="pf-sr">Explore</h1>

      <ExploreSearch key={`${q}|${track ?? ""}|${saved}`} q={q} track={track} saved={saved} />

      <nav className="pf-explore-chips" aria-label="Filter by track">
        {[null, ...TRACKS].map((item) => (
          <Link key={item ?? "all"} href={exploreHref({ q, track: item, saved })} aria-current={item === track ? "page" : undefined}>
            {item ?? "All tracks"}
          </Link>
        ))}
        <Link className="pf-explore-chip-saved" href={exploreHref({ q, track, saved: !saved })} aria-current={saved ? "page" : undefined}>
          Saved <span className="pf-explore-chip-count">{savedCount}</span>
        </Link>
      </nav>

      <SavedStatus className="pf-explore-saved-status" />

      {filtered ? <Results viewerId={viewer.id} q={q} track={track} saved={saved} page={params.page} savedCount={savedCount} /> : <Rails viewerId={viewer.id} />}
    </>
  );
}

async function Results({ viewerId, q, track, saved, page, savedCount }: { viewerId: string; q: string; track: (typeof TRACKS)[number] | null; saved: boolean; page: number; savedCount: number }) {
  // Ask for the page the address names; if it is past the end, ask again for the last one.
  let result = await searchProjects(viewerId, { q, track, savedOnly: saved, limit: EXPLORE_RESULTS_SIZE, offset: (page - 1) * EXPLORE_RESULTS_SIZE });
  const win = pageWindow(result.total, page);
  if (win.page !== page) result = await searchProjects(viewerId, { q, track, savedOnly: saved, limit: EXPLORE_RESULTS_SIZE, offset: win.offset });
  const clear = exploreHref({ q: "", track: null, saved: false });

  if (result.rows.length === 0) {
    const kind = emptyResultsKind({ q, saved }, savedCount > 0);
    return (
      <>
        <p className="pf-explore-count" role="status">{projectCountLine(0)}</p>
        {kind === "saved-none" ? (
          <p className="pf-empty-line">You have not saved anything yet. Press the star on a project to keep it here.</p>
        ) : kind === "saved-no-match" ? (
          <p className="pf-empty-line">
            No saved projects match. <Link href={exploreHref({ q: "", track, saved })}>Clear the search</Link>
          </p>
        ) : (
          <p className="pf-empty-line">
            No projects match. <Link href={clear}>Clear the search</Link>
          </p>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby="explore-results-heading">
      <div className="pf-explore-results-head">
        <h2 id="explore-results-heading">{saved ? "Saved" : "Results"}</h2>
        <p className="pf-explore-count" role="status">
          {projectCountLine(result.total)}{" "}
          <Link href={clear}>Clear</Link>
        </p>
      </div>
      {saved ? <p className="pf-hint pf-explore-private">Only you can see this list.</p> : null}
      <ul className="pf-explore-grid">
        {result.rows.map((row) => (
          <li key={row.id}>
            <Card row={row} />
          </li>
        ))}
      </ul>
      {win.pages > 1 ? (
        <nav className="pf-explore-pages" aria-label="Pages">
          {win.hasPrev ? <Link href={exploreHref({ q, track, saved, page: win.page - 1 })} rel="prev">Previous</Link> : <span aria-disabled="true">Previous</span>}
          <span>
            Page {win.page} of {win.pages}
          </span>
          {win.hasNext ? <Link href={exploreHref({ q, track, saved, page: win.page + 1 })} rel="next">Next</Link> : <span aria-disabled="true">Next</span>}
        </nav>
      ) : null}
    </section>
  );
}

async function Rails({ viewerId }: { viewerId: string }) {
  const [discover, savedRows, byTrack] = await Promise.all([
    discoverRails(viewerId),
    listBookmarks(viewerId, { limit: SAVED_RAIL_SIZE }),
    Promise.all(TRACKS.map(async (item) => ({ track: item, rows: (await searchProjects(viewerId, { track: item, limit: RAIL_TRACK_SIZE })).rows }))),
  ]);
  const used = usedMostRows(discover.mostUsed);
  const trackRails = byTrack.filter((rail) => rail.rows.length > 0);

  if (discover.newest.length === 0) {
    return <p className="pf-empty-line">Awaiting the first projects. Approved projects from builders show up here.</p>;
  }

  return (
    <>
      {savedRows.length > 0 ? (
        <ExploreRail title="Saved" note="Only you can see this list." seeAllHref={exploreHref({ q: "", track: null, saved: true })}>
          {savedRows.map((row) => (
            <li key={row.id}>
              <Card row={row} />
            </li>
          ))}
        </ExploreRail>
      ) : null}
      <ExploreRail title="New">
        {discover.newest.map((row) => (
          <li key={row.id}>
            <Card row={row} />
          </li>
        ))}
      </ExploreRail>
      {used.length > 0 ? (
        <ExploreRail title="Used most">
          {used.map((row) => (
            <li key={row.id}>
              <Card row={row} />
            </li>
          ))}
        </ExploreRail>
      ) : null}
      {trackRails.map((rail) => (
        <ExploreRail key={rail.track} title={rail.track} seeAllHref={exploreHref({ q: "", track: rail.track })} seeAllLabel={`See all ${rail.track}`}>
          {rail.rows.map((row) => (
            <li key={row.id}>
              <Card row={row} />
            </li>
          ))}
        </ExploreRail>
      ))}
    </>
  );
}
