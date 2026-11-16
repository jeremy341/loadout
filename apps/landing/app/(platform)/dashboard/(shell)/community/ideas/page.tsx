import type { Metadata } from "next";
import Link from "next/link";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { IdeaRow } from "@/app/_components/platform/community/IdeaRow";
import { SampleNote } from "@/app/_components/platform/community/Parts";
import { filterIdeas, IDEA_SORT_LABELS, IDEA_SORTS, IDEA_STATUSES, IDEAS, ideasHref, parseIdeasQuery, sortIdeas } from "@/lib/platform/community";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Ideas - LOADOUT" };

// The public idea board, after Pixl's: ideas for the program and the platform with a vote count and a status. Voting is not
// open, so the upvote buttons are shown disabled. Shop suggestions and voting are excluded by plan 02, which the page says.
// The filter and the sort live in the address.
export default async function IdeasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireViewer();
  const query = parseIdeasQuery(await searchParams);
  const ideas = sortIdeas(filterIdeas(IDEAS, query.status), query.sort);

  return (
    <>
      <CommunityHead title="Ideas">Ideas for the program and the platform. They cannot be shop requests: the shop has no suggestion or voting system.</CommunityHead>
      <SampleNote>The idea board is proposed. These ideas, builders and vote counts are invented samples.</SampleNote>
      <p className="cm-closed">Voting opens with the community release. Nothing here is saved.</p>

      <nav className="pf-explore-filters" aria-label="Filter by status">
        {[null, ...IDEA_STATUSES].map((status) => (
          <Link key={status ?? "all"} href={ideasHref({ ...query, status })} aria-current={status === query.status ? "page" : undefined}>
            {status ?? "All ideas"}
          </Link>
        ))}
      </nav>

      <div className="pf-shop-meta">
        <p className="pf-shop-count" role="status">
          {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
        </p>
        <nav className="pf-shop-sort" aria-label="Sort ideas">
          {IDEA_SORTS.map((sort) => (
            <Link key={sort} href={ideasHref({ ...query, sort })} aria-current={sort === query.sort ? "true" : undefined}>
              {IDEA_SORT_LABELS[sort]}
            </Link>
          ))}
        </nav>
      </div>

      {ideas.length === 0 ? (
        <p className="pf-empty-line">
          No ideas match. <Link href="/dashboard/community/ideas">Show all ideas</Link>
        </p>
      ) : (
        <ul className="cm-ideas cm-ideas-board">
          {ideas.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} level={2} />
          ))}
        </ul>
      )}
    </>
  );
}
