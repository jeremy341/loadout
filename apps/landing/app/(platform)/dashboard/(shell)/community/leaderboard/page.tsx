import type { Metadata } from "next";
import Link from "next/link";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { LeaderTable } from "@/app/_components/platform/community/LeaderTable";
import { LEADERBOARD_RANGE_LABELS, LEADERBOARD_RANGES, leaderboardHref, parseLeaderboardRange } from "@/lib/platform/community";
import { leaderboard } from "@/lib/platform/community-data";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Leaderboard - LOADOUT" };

// Builders ranked by approved hours, this week or all time, from the same nightly snapshot the public stats endpoint
// serves. Only builders who turned statsVisible on appear; a builder who turns it off disappears at once, even before the
// next snapshot. Equal hours share a rank. No Ore is shown for anyone, and depth is one metre for each approved hour.
export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireViewer();
  const range = parseLeaderboardRange((await searchParams).range);
  const board = await leaderboard(range);
  const caption = `${LEADERBOARD_RANGE_LABELS[range]}, by approved hours`;

  return (
    <>
      <CommunityHead title="Leaderboard">Rank is by approved hours only. Equal hours share a rank. Depth is 1 m for each approved hour.</CommunityHead>

      <nav className="pf-explore-filters" aria-label="Choose a range">
        {LEADERBOARD_RANGES.map((value) => (
          <Link key={value} href={leaderboardHref(value)} aria-current={value === range ? "page" : undefined}>
            {LEADERBOARD_RANGE_LABELS[value]}
          </Link>
        ))}
      </nav>

      {board.rows.length === 0 ? (
        <p className="pf-empty-line">
          No builder has approved hours here yet. A builder also chooses whether their hours are shown on the{" "}
          <Link href="/dashboard/settings">Settings</Link> page.
        </p>
      ) : (
        <>
          <LeaderTable rows={board.rows} range={range} caption={caption} />
          <p className="pf-box-note">
            As of {board.asOf ? `the snapshot for ${board.asOf}` : "the first snapshot"}. Only builders who turned stats on in Settings appear.
          </p>
        </>
      )}
    </>
  );
}
