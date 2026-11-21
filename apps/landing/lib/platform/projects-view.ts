// Pure rules for the own projects page: the stage and track filter and the page number in the address, the tab counts, the
// filtering and the paging. No database, no framework; every function has a bun test (projects-view.test.ts).
//
// API:
//   PROJECTS_PAGE_SIZE                  24
//   parseProjectsQuery(raw)             -> { stage, track, page }   unknown values fall back to all, no track, page 1
//   projectsHref(query)                 -> "/dashboard/projects" plus only the non-default parts
//   stageTabs(projects)                 -> [{ key, label, count }]  All first, then each stage; counts over every project
//   filterOwnProjects(projects, query)  -> the projects for the stage and track
//   paginate(total, page, size)         -> { page, pages, from, to }  page is clamped into range; from and to are slice bounds
//   stageCountLabel(label, n)           -> "Draft, 1 project"       the accessible name of a stage link
//   gridItems(rows, page, size)         -> { items, paging }        the projects, then the New project tile last on every page
import { normalizeStatus, statusTabs, STATUS_TABS, type StatusTab } from "./profile";
import { TRACKS, type Track } from "./progress";

export const PROJECTS_PAGE_SIZE = 24;
export const PROJECTS_PATH = "/dashboard/projects";

export type StageKey = "all" | "draft" | "logging" | "submitted" | "in-review" | "needs-changes" | "approved";
export type ProjectsQuery = { stage: StageKey; track: Track | null; page: number };

const STAGES: readonly string[] = ["all", ...STATUS_TABS.map((tab) => tab.key)];
const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

export function parseProjectsQuery(raw: { stage?: string | string[]; track?: string | string[]; page?: string | string[] }): ProjectsQuery {
  const stage = normalizeStatus(first(raw.stage));
  const trackText = first(raw.track).trim().toLowerCase();
  const page = /^\d{1,6}$/.test(first(raw.page).trim()) ? Number(first(raw.page).trim()) : 1;
  return {
    stage: (STAGES.includes(stage) ? stage : "all") as StageKey,
    track: TRACKS.find((track) => track.toLowerCase() === trackText) ?? null,
    page: Math.max(1, page),
  };
}

export function projectsHref(query: Partial<ProjectsQuery>): string {
  const params = new URLSearchParams();
  if (query.stage && query.stage !== "all") params.set("stage", query.stage);
  if (query.track) params.set("track", query.track.toLowerCase());
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `${PROJECTS_PATH}?${text}` : PROJECTS_PATH;
}

export function stageTabs(projects: readonly { status: string }[]): StatusTab[] {
  return statusTabs(projects);
}

export function filterOwnProjects<T extends { status: string; track: string | null }>(projects: readonly T[], query: Pick<ProjectsQuery, "stage" | "track">): T[] {
  return projects.filter(
    (project) =>
      (query.stage === "all" || normalizeStatus(project.status) === query.stage) && (query.track === null || project.track === query.track),
  );
}

export function paginate(total: number, page: number, size: number = PROJECTS_PAGE_SIZE): { page: number; pages: number; from: number; to: number } {
  const pages = Math.max(1, Math.ceil(Math.max(0, total) / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const from = (current - 1) * size;
  return { page: current, pages, from, to: Math.min(total, from + size) };
}

export function stageCountLabel(label: string, count: number): string {
  return `${label}, ${count} ${count === 1 ? "project" : "projects"}`;
}

export type GridItem<T> = { kind: "new" } | { kind: "project"; project: T };

// The Projects grid: the projects in the order given, then the dashed New project tile last. The tile sits on every page, so the
// way to start a project is always at the end of the grid. The page size counts projects, not the tile.
export function gridItems<T>(rows: readonly T[], page: number, size: number = PROJECTS_PAGE_SIZE): { items: GridItem<T>[]; paging: ReturnType<typeof paginate> } {
  const paging = paginate(rows.length, page, size);
  const items: GridItem<T>[] = [...rows.slice(paging.from, paging.to).map((project): GridItem<T> => ({ kind: "project", project })), { kind: "new" }];
  return { items, paging };
}
