import type { Metadata } from "next";
import Link from "next/link";
import { ExploreCard } from "@/app/_components/platform/ExploreCard";
import { db } from "@/lib/platform/db";
import { usedByCounts } from "@/lib/platform/profile-data";
import { EXPLORE_PAGE_SIZE, EXPLORE_QUERY_MAX, EXPLORE_STATUS, exploreHref, parseExploreQuery } from "@/lib/platform/explore";
import { TRACKS } from "@/lib/platform/progress";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Explore - LOADOUT" };

// Explore: approved projects from every builder, searched by name or builder and filtered by track, newest first. Plain
// like Pixl's and Stasis's boards: a search box, the filters and a grid of cards. No feed, likes or follows.
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireViewer();
  const { q, track } = parseExploreQuery(await searchParams);

  const projects = await db().project.findMany({
    where: {
      status: EXPLORE_STATUS,
      // A hidden project and a banned builder's work never show here.
      hidden: false,
      owner: { bannedAt: null },
      ...(track ? { track } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { owner: { handle: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: EXPLORE_PAGE_SIZE,
    select: { id: true, title: true, description: true, track: true, status: true, repoUrl: true, owner: { select: { handle: true } } },
  });
  const used = await usedByCounts(projects.map((project) => project.id));

  const filtered = q !== "" || track !== null;

  return (
    <>
      <h1 className="pf-sr">Explore</h1>

      <form className="pf-explore-search" method="get" action="/dashboard/explore" role="search">
        <label className="pf-sr" htmlFor="explore-q">
          Find a project or a builder
        </label>
        <input id="explore-q" className="pf-explore-input" type="search" name="q" defaultValue={q} maxLength={EXPLORE_QUERY_MAX} placeholder="Find a project or a builder" autoComplete="off" />
        {track ? <input type="hidden" name="track" value={track.toLowerCase()} /> : null}
        <button type="submit" className="pf-btn pri">
          Search
        </button>
      </form>

      <nav className="pf-explore-filters" aria-label="Filter by track">
        {[null, ...TRACKS].map((item) => (
          <Link key={item ?? "all"} href={exploreHref({ q, track: item })} aria-current={item === track ? "page" : undefined}>
            {item ?? "All tracks"}
          </Link>
        ))}
      </nav>

      {projects.length === 0 ? (
        filtered ? (
          <p className="pf-empty-line">
            No projects match. <Link href="/dashboard/explore">Clear the search</Link>
          </p>
        ) : (
          <p className="pf-empty-line">Awaiting the first projects. Approved projects from builders show up here.</p>
        )
      ) : (
        <ul className="pf-project-grid">
          {projects.map((project) => (
            <li key={project.id}>
              <ExploreCard project={{ ...project, usedBy: used[project.id] ?? 0, openSource: Boolean(project.repoUrl) }} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
