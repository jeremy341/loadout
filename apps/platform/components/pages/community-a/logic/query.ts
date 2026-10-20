import type { Idea, IdeaStatus, IdeaTrack, SampleProject, ShowPost, TrackName } from "./types";

// Search, filter, sort and paginate. Pure functions: the pages hand in the data and the current controls.

/** Every whitespace-separated word of the query must appear (case-insensitive) in at least one field. */
export function matchesQuery(fields: string[], query: string): boolean {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) return true;
  const haystack = fields.join("\n").toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export interface Page<T> {
  items: T[];
  /** 1-based, clamped into range. */
  page: number;
  pageCount: number;
  total: number;
  /** 1-based position of the first and last item shown; both 0 when empty. */
  from: number;
  to: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function paginate<T>(items: T[], page: number, size: number): Page<T> {
  const safeSize = Math.max(1, Math.floor(size));
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / safeSize));
  const wanted = Number.isFinite(page) ? Math.floor(page) : 1;
  const current = Math.min(Math.max(1, wanted), pageCount);
  const start = (current - 1) * safeSize;
  const slice = items.slice(start, start + safeSize);
  return {
    items: slice,
    page: current,
    pageCount,
    total,
    from: slice.length === 0 ? 0 : start + 1,
    to: slice.length === 0 ? 0 : start + slice.length,
    hasPrev: current > 1,
    hasNext: current < pageCount,
  };
}

function byNewest<T extends { at: string; id: string }>(a: T, b: T): number {
  if (a.at !== b.at) return a.at < b.at ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

// ---- Explore ----

export type ProjectSort = "newest" | "liked";

export interface ProjectFilters {
  query: string;
  track: TrackName | "all";
  tag: string | "all";
}

export function allTags(projects: SampleProject[]): string[] {
  return Array.from(new Set(projects.flatMap((p) => p.tags))).sort((a, b) => a.localeCompare(b));
}

export function filterProjects(projects: SampleProject[], filters: ProjectFilters, nameOf: (handle: string) => string): SampleProject[] {
  return projects.filter((p) => {
    if (filters.track !== "all" && p.track !== filters.track) return false;
    if (filters.tag !== "all" && !p.tags.includes(filters.tag)) return false;
    return matchesQuery([p.title, p.summary, p.handle, nameOf(p.handle), p.track, ...p.tags], filters.query);
  });
}

export function sortProjects(projects: SampleProject[], sort: ProjectSort, likes: (project: SampleProject) => number): SampleProject[] {
  const copy = [...projects];
  if (sort === "liked") copy.sort((a, b) => likes(b) - likes(a) || byNewest(a, b));
  else copy.sort(byNewest);
  return copy;
}

// ---- Ideas ----

export type IdeaSort = "top" | "new";

export interface IdeaFilters {
  query: string;
  track: IdeaTrack | "all";
  status: IdeaStatus | "all";
}

export function filterIdeas(ideas: Idea[], filters: IdeaFilters, nameOf: (handle: string) => string): Idea[] {
  return ideas.filter((i) => {
    if (filters.track !== "all" && i.track !== filters.track) return false;
    if (filters.status !== "all" && i.status !== filters.status) return false;
    return matchesQuery([i.title, i.body, i.handle, nameOf(i.handle), i.track], filters.query);
  });
}

export function sortIdeas(ideas: Idea[], sort: IdeaSort, votes: (idea: Idea) => number): Idea[] {
  const copy = [...ideas];
  if (sort === "top") copy.sort((a, b) => votes(b) - votes(a) || byNewest(a, b));
  else copy.sort(byNewest);
  return copy;
}

// ---- Show & Tell ----

export type PostSort = "new" | "liked";

export interface PostFilters {
  query: string;
  track: TrackName | "all";
}

export function filterPosts(posts: ShowPost[], filters: PostFilters, nameOf: (handle: string) => string): ShowPost[] {
  return posts.filter((p) => {
    if (filters.track !== "all" && p.track !== filters.track) return false;
    return matchesQuery([p.title, p.built, p.learned ?? "", p.handle, nameOf(p.handle), p.track], filters.query);
  });
}

export function sortPosts(posts: ShowPost[], sort: PostSort, likes: (post: ShowPost) => number): ShowPost[] {
  const copy = [...posts];
  if (sort === "liked") copy.sort((a, b) => likes(b) - likes(a) || byNewest(a, b));
  else copy.sort(byNewest);
  return copy;
}
