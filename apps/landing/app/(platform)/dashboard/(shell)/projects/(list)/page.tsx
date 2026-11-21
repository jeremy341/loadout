import type { Metadata } from "next";
import Link from "next/link";
import { ScrambleText } from "@/app/_components/platform/ScrambleText";
import { ProjectInvites } from "@/app/_components/platform/ProjectInvites";
import { NewProjectCard } from "@/app/_components/platform/NewProjectLink";
import { ProjectsGridCard } from "@/app/_components/platform/ProjectsGridCard";
import "@/app/_components/platform/projects-grid.css";
import { listInvitesFor } from "@/lib/platform/collaborators-data";
import { db } from "@/lib/platform/db";
import { gridItems, parseProjectsQuery, PROJECTS_PAGE_SIZE, PROJECTS_PATH } from "@/lib/platform/projects-view";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Projects - LOADOUT" };

// Your own projects: the title, then one grid of project cards with the dashed New project tile last. With none, the empty line
// sits above the grid so it reads before the New project tile.
// Stasis has no filters, tabs or search on this page, and none are added here. Paging is plain links (Stasis shows everything).
// The one exception is a lightweight search that shows only when the list is longer than one page, where the paged grid hides
// projects. It is a plain GET form (?q=), filtered here, and it never adds stage or track filters.
const SEARCH_MAX = 80;
const firstValue = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));
const listHref = (q: string, page: number): string => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `${PROJECTS_PATH}?${text}` : PROJECTS_PATH;
};

export default async function ProjectsPage({ searchParams }: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>) {
  const viewer = await requireViewer();
  const raw = await searchParams;
  const { page } = parseProjectsQuery(raw);
  const all = await db().project.findMany({
    where: { ownerId: viewer.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, title: true, description: true, track: true, status: true },
  });
  const searchable = all.length > PROJECTS_PAGE_SIZE;
  const q = searchable ? firstValue(raw.q).trim().slice(0, SEARCH_MAX) : "";
  const needle = q.toLowerCase();
  const shown = needle ? all.filter((row) => row.title.toLowerCase().includes(needle) || (row.description ?? "").toLowerCase().includes(needle)) : all;
  const { items, paging } = gridItems(shown, page);
  const invites = await listInvitesFor(viewer.id);

  return (
    <>
      <header className="pf-sg-head">
        <h1><ScrambleText text="Projects" /></h1>
      </header>

      <ProjectInvites invites={invites} />

      {searchable ? (
        <form className="pf-sg-search" method="get" action={PROJECTS_PATH} role="search">
          <label htmlFor="projects-q">Search your projects</label>
          <span className="pf-sg-search-row">
            <input id="projects-q" className="pf-explore-input" type="search" name="q" defaultValue={q} maxLength={SEARCH_MAX} autoComplete="off" />
            <button type="submit" className="pf-btn">Search</button>
            {q ? <Link href={PROJECTS_PATH}>Clear</Link> : null}
          </span>
          {q ? <p role="status">{shown.length === 0 ? "No project matches." : `${shown.length} ${shown.length === 1 ? "project matches" : "projects match"}.`}</p> : null}
        </form>
      ) : null}

      {all.length === 0 ? <p className="pf-sg-empty">No projects yet. Create your first one!</p> : null}

      <ul className="pf-sg-grid">
        {items.map((item) =>
          item.kind === "new" ? null : (
            <li key={item.project.id}>
              <ProjectsGridCard project={item.project} />
            </li>
          ),
        )}
        {items.some((item) => item.kind === "new") ? (
          <li key="new">
            <NewProjectCard />
          </li>
        ) : null}
      </ul>

      {paging.pages > 1 ? (
        <nav className="pf-sg-pager" aria-label="Pages">
          {paging.page > 1 ? <Link href={listHref(q, paging.page - 1)} rel="prev">Previous</Link> : null}
          <span>Page {paging.page} of {paging.pages}</span>
          {paging.page < paging.pages ? <Link href={listHref(q, paging.page + 1)} rel="next">Next</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
