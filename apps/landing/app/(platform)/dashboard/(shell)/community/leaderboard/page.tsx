import type { Metadata } from "next";
import Link from "next/link";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { LeaderTable } from "@/app/_components/platform/community/LeaderTable";
import { SampleNote } from "@/app/_components/platform/community/Parts";
import { LEADERBOARD_RANGE_LABELS, LEADERBOARD_RANGES, leaderboardHref, leaderboardRows, parseLeaderboardQuery } from "@/lib/platform/community";
import { TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Leaderboard - LOADOUT" };

// Builders ranked by approved hours, this week or all time, overall or in one track. Equal hours share a rank. No Ore is
// shown for anyone, and depth is one metre for each approved hour. The view lives in the address.
export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireViewer();
  const query = parseLeaderboardQuery(await searchParams);
  const rows = leaderboardRows(query);
  const scope = query.track ?? "all tracks";
  const caption = `${LEADERBOARD_RANGE_LABELS[query.range]}, ${scope}, by approved hours`;

  return (
    <>
      <CommunityHead title="Leaderboard">Rank is by approved hours only. Equal hours share a rank. Depth is 1 m for each approved hour.</CommunityHead>
      <SampleNote>The leaderboard is proposed. Handles and hours are invented samples.</SampleNote>

      <nav className="pf-explore-filters" aria-label="Choose a range">
        {LEADERBOARD_RANGES.map((range) => (
          <Link key={range} href={leaderboardHref({ ...query, range })} aria-current={range === query.range ? "page" : undefined}>
            {LEADERBOARD_RANGE_LABELS[range]}
          </Link>
        ))}
      </nav>
      <nav className="pf-explore-filters" aria-label="Filter by track">
        {[null, ...TRACKS].map((track) => (
          <Link key={track ?? "all"} href={leaderboardHref({ ...query, track })} aria-current={track === query.track ? "page" : undefined}>
            {track ?? "All tracks"}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="pf-empty-line">
          Nobody has approved hours here yet. <Link href="/dashboard/community/leaderboard">Show all tracks</Link>
        </p>
      ) : (
        <LeaderTable rows={rows} range={query.range} caption={caption} />
      )}
    </>
  );
}
