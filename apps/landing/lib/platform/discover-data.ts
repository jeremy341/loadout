// Reads for Saved projects, project search and the Explore rails. Server only (uses the database). Rows carry handles, never an
// email or a display name, and only projects the viewer may see (public: approved, owner not banned; plus the viewer's
// own projects in listBookmarks). The pure rules are in search.ts, bookmarks.ts and toolbelt.ts; this file only fetches.
//
// API:
//   SEARCH_DEFAULT_LIMIT = 8, SEARCH_MAX_LIMIT = 30, RAIL_SIZE = 6, SEARCH_WINDOW = 300
//   type SearchRow = { id, title, description (at most 140 chars, one line), track, ownerHandle | null, usedBy, saved, hasRepo,
//                      status, createdAt (ISO string) }
//   searchProjects(viewerId, { q, track?, openSourceOnly?, savedOnly?, excludeProjectId?, limit?, offset? }) -> { rows, total }
//       q goes through parseSearchQuery: words must all match title, description or owner handle (case-blind); "track:tools" and
//       "by:handle" work inside q. opts.track wins over a track typed in q. Rows are ranked with rankResults over the newest
//       SEARCH_WINDOW matches (so ordering is exact inside that window); total is the exact count of matches.
//       openSourceFirst: with no search words, projects that have a source address come first (stable).
//   listBookmarks(viewerId, { limit? = 50, offset? }) -> BookmarkRow[]     SearchRow + savedAt (ISO), newest saved first; drops
//       anything the viewer may no longer see (unapproved, banned owner); the viewer's own projects stay
//   isBookmarked(viewerId, projectId) -> boolean
//   bookmarkedIds(viewerId, ids) -> Record<id, boolean>                     every requested id is present (for card stars)
//   countBookmarks(viewerId) -> number
//   kudosCounts(ids) -> Record<id, number>                                  one grouped count query; banned givers are not counted
//   kudosGivenIds(viewerId, ids) -> Record<id, boolean>                     which of these the viewer gave kudos to
//   discoverRails(viewerId) -> { newest, mostUsed, savedByTrack }          newest / mostUsed: up to 6 SearchRow each (mostUsed only
//       projects with at least one confirmed use); savedByTrack: [{ track, rows }] for tracks where the viewer saved something
//   searchEquippableTools(viewerId, projectId, q, { includeBlocked? = false, limit?, offset? }) -> { rows: EquipRow[], total, unavailable }
//       The Toolbelt search for the viewer's own project. Always open source and approved/visible, never the viewer's own
//       projects, never the equipping project. The decision for each row is canEquip (toolbelt.ts). includeBlocked false: only rows
//       canEquip accepts. includeBlocked true: also rows it refuses, each with `equip: { ok: false, code, reason }` (for example
//       "already-equipped" shows as code "duplicate", a maker block as "blocked"). unavailable is the reason the whole project
//       can't equip right now ("not-your-project" | "project-status" | "limit") or null.
import { db } from "./db";
import { canBookmark } from "./bookmarks";
import { openSourceFirst } from "./explore-feed";
import { normalizeStatus } from "./profile";
import { usedByCounts } from "./profile-data";
import { TRACKS, type Track } from "./progress";
import { rankResults, parseSearchQuery } from "./search";
import { repoHost } from "./search-view";
import { canEquip, EQUIP_STATUSES, TOOLBELT_MAX_PER_PROJECT, activeUses, type EquipCode } from "./toolbelt";
import { trackBySlug } from "./tracks";

export const SEARCH_DEFAULT_LIMIT = 8;
export const SEARCH_MAX_LIMIT = 30;
export const RAIL_SIZE = 6;
export const SEARCH_WINDOW = 300;
const DESCRIPTION_MAX = 140;

export type SearchRow = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  ownerHandle: string | null;
  usedBy: number;
  saved: boolean;
  hasRepo: boolean;
  status: string;
  createdAt: string;
};
export type BookmarkRow = SearchRow & { savedAt: string };
export type EquipRow = SearchRow & { repoHost: string | null; equip: { ok: true } | { ok: false; code: EquipCode; reason: string } };

export type SearchOptions = {
  q?: string;
  track?: Track | string | null;
  openSourceOnly?: boolean;
  savedOnly?: boolean;
  excludeProjectId?: string;
  // Browse order (no search words): projects with a source address come before the rest. Search keeps its relevance order.
  openSourceFirst?: boolean;
  limit?: number;
  offset?: number;
};

const select = {
  id: true, title: true, description: true, track: true, status: true, repoUrl: true, createdAt: true, ownerId: true,
  owner: { select: { handle: true } },
} as const;

type Candidate = {
  id: string; title: string; description: string | null; track: string | null; status: string; repoUrl: string | null;
  createdAt: Date; ownerId: string; owner: { handle: string | null };
};

const clampInt = (value: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.min(max, Math.max(min, n));
};

export function shortDescription(text: string | null): string | null {
  if (text === null) return null;
  const one = text.replace(/\s+/g, " ").trim();
  if (one === "") return null;
  return one.length > DESCRIPTION_MAX ? `${one.slice(0, DESCRIPTION_MAX - 1).trimEnd()}…` : one;
}

function toRow(c: Candidate, usedBy: number, saved: boolean): SearchRow {
  return {
    id: c.id, title: c.title, description: shortDescription(c.description), track: c.track, ownerHandle: c.owner.handle,
    usedBy, saved, hasRepo: Boolean(c.repoUrl), status: c.status, createdAt: c.createdAt.toISOString(),
  };
}

export async function bookmarkedIds(viewerId: string, ids: readonly string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = Object.fromEntries(ids.map((id) => [id, false]));
  if (ids.length === 0) return out;
  const rows = await db().projectBookmark.findMany({ where: { personId: viewerId, projectId: { in: [...ids] } }, select: { projectId: true } });
  for (const row of rows) out[row.projectId] = true;
  return out;
}

export async function isBookmarked(viewerId: string, projectId: string): Promise<boolean> {
  const row = await db().projectBookmark.findUnique({ where: { personId_projectId: { personId: viewerId, projectId } }, select: { id: true } });
  return row !== null;
}

// Kudos: how many each project has (one grouped query for the whole page) and which of them the viewer gave.
// Every requested id is present in both results.
export async function kudosCounts(ids: readonly string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  if (ids.length === 0) return out;
  const groups = await db().projectKudos.groupBy({ by: ["projectId"], where: { projectId: { in: [...ids] }, person: { bannedAt: null } }, _count: { _all: true } });
  for (const g of groups) out[g.projectId] = g._count._all;
  return out;
}

export async function kudosGivenIds(viewerId: string, ids: readonly string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = Object.fromEntries(ids.map((id) => [id, false]));
  if (ids.length === 0) return out;
  const rows = await db().projectKudos.findMany({ where: { personId: viewerId, projectId: { in: [...ids] } }, select: { projectId: true } });
  for (const row of rows) out[row.projectId] = true;
  return out;
}

export async function countBookmarks(viewerId: string): Promise<number> {
  return db().projectBookmark.count({ where: { personId: viewerId } });
}

// The shared "what may a stranger see" filter. Every project is public, drafts included (owner, 16 Nov 2026); only a banned
// project or a banned owner is left out.
const publicWhere = { status: { not: "banned" }, owner: { bannedAt: null } } as const;

type Where = NonNullable<Parameters<ReturnType<typeof db>["project"]["findMany"]>[0]>["where"];

function matchWhere(viewerId: string, opts: SearchOptions, extra: Where[] = []): { where: Where; tokens: string[] } {
  const parsed = parseSearchQuery(opts.q ?? "");
  const track = opts.track ? (trackBySlug(String(opts.track)) ?? null) : parsed.track;
  const and: NonNullable<Where>[] = [];
  for (const raw of parsed.tokens) {
    // LIKE wildcards in the text are literal characters (Postgres reads a backslash as the escape).
    const token = raw.replace(/[\\%_]/g, (c) => `\\${c}`);
    and.push({
      OR: [
        { title: { contains: token, mode: "insensitive" } },
        { description: { contains: token, mode: "insensitive" } },
        { owner: { handle: { contains: token, mode: "insensitive" } } },
      ],
    });
  }
  if (parsed.by) and.push({ owner: { handle: parsed.by } });
  if (track) and.push({ track });
  if (opts.openSourceOnly) and.push({ repoUrl: { not: null } });
  if (opts.savedOnly) and.push({ bookmarks: { some: { personId: viewerId } } });
  if (opts.excludeProjectId) and.push({ id: { not: opts.excludeProjectId } });
  for (const part of extra) if (part) and.push(part);
  return { where: { ...publicWhere, AND: and }, tokens: parsed.tokens };
}

async function fetchWindow(where: Where): Promise<Candidate[]> {
  return db().project.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: SEARCH_WINDOW, select });
}

async function decorate(viewerId: string, rows: Candidate[]): Promise<SearchRow[]> {
  const ids = rows.map((r) => r.id);
  const [counts, saved] = await Promise.all([usedByCounts(ids), bookmarkedIds(viewerId, ids)]);
  return rows.map((r) => toRow(r, counts[r.id] ?? 0, saved[r.id] ?? false));
}

export async function searchProjects(viewerId: string, opts: SearchOptions = {}): Promise<{ rows: SearchRow[]; total: number }> {
  const limit = clampInt(opts.limit, SEARCH_DEFAULT_LIMIT, 1, SEARCH_MAX_LIMIT);
  const offset = clampInt(opts.offset, 0, 0, 100_000);
  const { where, tokens } = matchWhere(viewerId, opts);
  const window = await fetchWindow(where);
  const total = window.length < SEARCH_WINDOW ? window.length : await db().project.count({ where });
  const relevant = rankResults(await decorate(viewerId, window), tokens);
  const ranked = opts.openSourceFirst && tokens.length === 0 ? openSourceFirst(relevant) : relevant;
  return { rows: ranked.slice(offset, offset + limit), total };
}

export async function listBookmarks(viewerId: string, opts: { limit?: number; offset?: number } = {}): Promise<BookmarkRow[]> {
  const limit = clampInt(opts.limit, 50, 1, 200);
  const offset = clampInt(opts.offset, 0, 0, 100_000);
  const rows = await db().projectBookmark.findMany({
    where: {
      personId: viewerId,
      project: { OR: [{ ownerId: viewerId }, publicWhere] },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: offset,
    take: limit,
    select: { createdAt: true, project: { select } },
  });
  const projects = rows.map((r) => r.project);
  const counts = await usedByCounts(projects.map((p) => p.id));
  return rows.map((r) => ({ ...toRow(r.project, counts[r.project.id] ?? 0, true), savedAt: r.createdAt.toISOString() }));
}

export async function discoverRails(viewerId: string): Promise<{
  newest: SearchRow[];
  mostUsed: SearchRow[];
  savedByTrack: { track: Track; rows: BookmarkRow[] }[];
}> {
  const newestRows = await db().project.findMany({ where: publicWhere, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: RAIL_SIZE, select });
  const usedGroups = await db().toolbeltUse.groupBy({
    by: ["toolId"],
    where: { status: "confirmed", project: { owner: { bannedAt: null } }, tool: publicWhere },
    _count: { _all: true },
    orderBy: [{ _count: { toolId: "desc" } }, { toolId: "asc" }],
    take: RAIL_SIZE,
  });
  const usedIds = usedGroups.map((g) => g.toolId);
  const usedRows = usedIds.length ? await db().project.findMany({ where: { ...publicWhere, id: { in: usedIds } }, select }) : [];
  const usedOrder = new Map(usedIds.map((id, i) => [id, i]));
  usedRows.sort((a, b) => (usedOrder.get(a.id) ?? 0) - (usedOrder.get(b.id) ?? 0));

  const [newest, mostUsed, saved] = await Promise.all([
    decorate(viewerId, newestRows),
    decorate(viewerId, usedRows),
    listBookmarks(viewerId, { limit: 200 }),
  ]);
  const savedByTrack = TRACKS.map((track) => ({ track, rows: saved.filter((r) => r.track === track).slice(0, RAIL_SIZE) })).filter((g) => g.rows.length > 0);
  return { newest, mostUsed, savedByTrack };
}

export async function searchEquippableTools(
  viewerId: string,
  projectId: string,
  q: string,
  opts: { includeBlocked?: boolean; limit?: number; offset?: number } = {},
): Promise<{ rows: EquipRow[]; total: number; unavailable: "not-your-project" | "project-status" | "limit" | null }> {
  const limit = clampInt(opts.limit, SEARCH_DEFAULT_LIMIT, 1, SEARCH_MAX_LIMIT);
  const offset = clampInt(opts.offset, 0, 0, 100_000);
  const project = await db().project.findUnique({ where: { id: projectId }, select: { id: true, ownerId: true, status: true } });
  if (!project || project.ownerId !== viewerId) return { rows: [], total: 0, unavailable: "not-your-project" };

  const [existingUses, blocks] = await Promise.all([
    db().toolbeltUse.findMany({ where: { projectId }, select: { projectId: true, toolId: true, status: true } }),
    db().toolbeltBlock.findMany({ where: { blockedId: viewerId }, select: { makerId: true, blockedId: true } }),
  ]);
  const active = activeUses(existingUses);
  const unavailable = !EQUIP_STATUSES.includes(normalizeStatus(project.status))
    ? ("project-status" as const)
    : active.length >= TOOLBELT_MAX_PER_PROJECT
      ? ("limit" as const)
      : null;

  const includeBlocked = opts.includeBlocked === true;
  // Only an approved project can be equipped, so a draft is not offered here even though it is public.
  const extra: Where[] = [{ ownerId: { not: viewerId } }, { status: "approved" }];
  if (!includeBlocked) {
    extra.push({ owner: { blocksMade: { none: { blockedId: viewerId } } } });
    if (active.length > 0) extra.push({ id: { notIn: active.map((u) => u.toolId) } });
  }
  const { where, tokens } = matchWhere(viewerId, { q, openSourceOnly: true, excludeProjectId: projectId }, extra);
  const window = await fetchWindow(where);
  const decided = (await decorate(viewerId, window)).map((row, i) => {
    const c = window[i];
    const equip = canEquip({
      equipper: { id: viewerId },
      project,
      tool: { id: c.id, ownerId: c.ownerId, status: c.status, repoUrl: c.repoUrl },
      existingUses,
      blocks,
    });
    return { row: { ...row, repoHost: repoHost(c.repoUrl), equip } as EquipRow, ok: equip.ok };
  });
  const kept = decided.filter((d) => includeBlocked || d.ok).map((d) => d.row);
  const ranked = rankResults(kept, tokens);
  const total = window.length < SEARCH_WINDOW ? ranked.length : Math.max(ranked.length, await db().project.count({ where }));
  return { rows: ranked.slice(offset, offset + limit), total, unavailable };
}

// Whether a person may save a project, read from the database. null means the project does not exist.
export async function bookmarkVerdict(viewerId: string, projectId: string) {
  const project = await db().project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, status: true, owner: { select: { bannedAt: true } } },
  });
  if (!project) return null;
  return canBookmark({
    viewer: { id: viewerId },
    project: { ownerId: project.ownerId, status: project.status, ownerBanned: project.owner.bannedAt !== null },
  });
}
