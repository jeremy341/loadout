import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/app/_components/platform/EmptyState";
import { ExploreFeed } from "@/app/_components/platform/ExploreFeed";
import { ExploreSearch } from "@/app/_components/platform/ExploreSearch";
import { SavedStatus } from "@/app/_components/platform/SaveButton";
import { countBookmarks } from "@/lib/platform/discover-data";
import { emptyResultsKind, exploreHref, parseExploreParams, projectCountLine } from "@/lib/platform/explore";
import { decodeCursor, encodeCursor, prevCursor } from "@/lib/platform/explore-feed";
import { loadFeedPage } from "@/lib/platform/explore-feed-data";
import { TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Explore - LOADOUT" };

// Explore, after Stasis's Discover: a title and one paragraph, one search for projects and builders, a single row of chips (tracks
// and Saved), then one grid of every public project with infinite scroll. The first 21 cards are rendered here on the server; the
// rest come from /platform-explore as the end of the grid nears. With no script a "Load more" link goes to ?cursor= and the page
// shows the next 21. An empty search lists every public project (drafts too), those with a source address first.
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireViewer();
  const raw = await searchParams;
  const { q, track, saved } = parseExploreParams(raw);
  const offset = decodeCursor(raw.cursor);
  const [savedCount, feed] = await Promise.all([countBookmarks(viewer.id), loadFeedPage(viewer.id, { q, track, saved }, offset)]);
  // A cursor past the end (an old link) goes back to the first page.
  if (feed.cards.length === 0 && offset > 0) redirect(exploreHref({ q, track, saved }));
  const filter = { q, track, saved };
  const clear = exploreHref({ q: "", track: null, saved: false });
  const earlier = prevCursor(offset);

  return (
    <>
      <header className="pf-explore-intro">
        <h1>Explore</h1>
        <p>
          See what other builders are making. Every project is public, drafts included. Give kudos to the ones you like and save the ones
          you want to come back to.
        </p>
      </header>

      <ExploreSearch q={q} track={track} saved={saved} />

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

      {feed.cards.length === 0 ? (
        <Empty q={q} saved={saved} filtered={q !== "" || track !== null || saved} anySaved={savedCount > 0} clear={clear} track={track} />
      ) : (
        <section aria-label="Projects">
          <p className="pf-explore-count" role="status">
            {projectCountLine(feed.total)}
            {q !== "" || track !== null || saved ? <> <Link href={clear}>Clear</Link></> : null}
          </p>
          {saved ? <p className="pf-hint pf-explore-private">Only you can see this list.</p> : null}
          <ExploreFeed
            key={`${q}|${track ?? ""}|${saved ? 1 : 0}|${offset}`}
            initial={feed.cards}
            next={feed.next}
            total={feed.total}
            offset={offset}
            filter={filter}
            nextHref={feed.next ? exploreHref({ q, track, saved, cursor: feed.next }) : null}
            prevHref={earlier ? exploreHref({ q, track, saved, cursor: earlier === encodeCursor(0) ? null : earlier }) : null}
          />
        </section>
      )}
    </>
  );
}

function Empty({ q, saved, filtered, anySaved, clear, track }: { q: string; saved: boolean; filtered: boolean; anySaved: boolean; clear: string; track: string | null }) {
  if (!filtered) return <EmptyState>No projects yet. Projects from builders show up here as soon as they are created, drafts included.</EmptyState>;
  const kind = emptyResultsKind({ q, saved }, anySaved);
  return (
    <>
      <p className="pf-explore-count" role="status">{projectCountLine(0)}</p>
      {kind === "saved-none" ? (
        <EmptyState>You have not saved anything yet. Press the star on a project to keep it here.</EmptyState>
      ) : kind === "saved-no-match" ? (
        <EmptyState action={<Link href={exploreHref({ q: "", track, saved })}>Clear the search</Link>}>No saved projects match.</EmptyState>
      ) : (
        <EmptyState action={<Link href={clear}>Clear the search</Link>}>No projects match.</EmptyState>
      )}
    </>
  );
}
