// Reads for profiles and the Toolbelt. Server only (uses the database). Every read that serves another builder applies the pure
// visibility rules in profile.ts / toolbelt.ts, hides banned people, and selects only public columns; never an email or display name.
//
// API:
//   getProfileByHandle(handle)            -> PublicProfile | null    null for unknown handle, no handle set, or banned person
//   getOwnProfile(personId)               -> OwnProfile | null
//   listProfileProjects(personId, mode)   -> ProfileProjectRow[]      mode "own": every project, hidden flag included, newest first;
//                                                                      mode "public": publicProjects() only, pinned first, newest first
//   listUsesForProject(projectId)         -> UseRow[]                 INTERNAL: all statuses for the equipping project (owner page, reviewer desk).
//                                                                      The caller must have checked the viewer owns the project or is staff.
//   listUsersOfTool(projectId, viewerId)  -> ToolUserRow[]            builders who equipped this tool. The maker sees every status;
//                                                                      anyone else sees confirmed uses on public projects only
//   listToolsUsedBy(personId)             -> ToolUsedRow[]            public: confirmed uses by this builder's public projects of public tools
//   searchEquippableTools(viewerId, q)    -> EquippableTool[]         approved, visible, open-source, not own, maker has not blocked the viewer
//   usedByCounts(projectIds)              -> Record<id, number>       confirmed uses only; every requested id is present
import { db } from "./db";
import { isPublicProject, normalizeStatus, pinnedFirst, publicProjects } from "./profile";
import { publicToolUses } from "./toolbelt";

export const TOOL_SEARCH_LIMIT = 20;

export type PublicProfile = { id: string; handle: string; bio: string | null; joinedAt: Date };
export type OwnProfile = { id: string; handle: string | null; bio: string | null; joinedAt: Date };

export type ProfileProjectRow = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  status: string;
  pinned: boolean;
  hidden: boolean;
  showBuilding: boolean;
  repoUrl: string | null;
  demoUrl: string | null;
  createdAt: Date;
  usedBy: number;
};

export type UseRow = {
  id: string;
  status: string;
  note: string;
  createdAt: Date;
  decidedAt: Date | null;
  // public: the tool can still be opened on Explore (additive, for the owner's Toolbelt box).
  tool: { id: string; title: string; track: string | null; ownerHandle: string | null; public: boolean };
};

export type ToolUserRow = {
  id: string;
  status: string;
  note: string;
  createdAt: Date;
  userId: string;
  userHandle: string | null;
  // public: the equipping project can be opened on Explore (additive, for the maker's Toolbelt users box).
  project: { id: string; title: string; public: boolean };
};

export type ToolUsedRow = {
  id: string;
  note: string;
  project: { id: string; title: string };
  tool: { id: string; title: string; track: string | null; ownerHandle: string | null };
};

export type EquippableTool = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  repoUrl: string;
  ownerHandle: string | null;
  usedBy: number;
};

const publicOwner = { select: { handle: true, bannedAt: true } } as const;

export async function usedByCounts(projectIds: readonly string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.fromEntries(projectIds.map((id) => [id, 0]));
  if (projectIds.length === 0) return counts;
  const rows = await db().toolbeltUse.groupBy({
    by: ["toolId"],
    where: { toolId: { in: [...projectIds] }, status: "confirmed", project: { owner: { bannedAt: null } } },
    _count: { _all: true },
  });
  for (const row of rows) counts[row.toolId] = row._count._all;
  return counts;
}

export async function getProfileByHandle(handle: string): Promise<PublicProfile | null> {
  const person = await db().person.findUnique({
    where: { handle: handle.trim().toLowerCase() },
    select: { id: true, handle: true, bio: true, createdAt: true, bannedAt: true },
  });
  if (!person || person.bannedAt || !person.handle) return null;
  return { id: person.id, handle: person.handle, bio: person.bio, joinedAt: person.createdAt };
}

export async function getOwnProfile(personId: string): Promise<OwnProfile | null> {
  const person = await db().person.findUnique({
    where: { id: personId },
    select: { id: true, handle: true, bio: true, createdAt: true, bannedAt: true },
  });
  if (!person || person.bannedAt) return null;
  return { id: person.id, handle: person.handle, bio: person.bio, joinedAt: person.createdAt };
}

export async function listProfileProjects(personId: string, mode: "own" | "public"): Promise<ProfileProjectRow[]> {
  const owner = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  if (!owner || owner.bannedAt) return [];
  const projects = await db().project.findMany({
    where: { ownerId: personId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, description: true, track: true, status: true, pinned: true, hidden: true, showBuilding: true,
      repoUrl: true, demoUrl: true, createdAt: true,
    },
  });
  const chosen = mode === "own" ? projects : pinnedFirst(publicProjects(projects));
  const counts = await usedByCounts(chosen.map((p) => p.id));
  return chosen.map((p) => ({ ...p, usedBy: counts[p.id] ?? 0 }));
}

export async function listUsesForProject(projectId: string): Promise<UseRow[]> {
  const rows = await db().toolbeltUse.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, status: true, note: true, createdAt: true, decidedAt: true,
      tool: { select: { id: true, title: true, track: true, status: true, hidden: true, showBuilding: true, owner: publicOwner } },
    },
  });
  return rows.map((row) => ({
    id: row.id, status: row.status, note: row.note, createdAt: row.createdAt, decidedAt: row.decidedAt,
    tool: { id: row.tool.id, title: row.tool.title, track: row.tool.track, ownerHandle: row.tool.owner.bannedAt ? null : row.tool.owner.handle, public: !row.tool.owner.bannedAt && isPublicProject(row.tool) },
  }));
}

export async function listUsersOfTool(projectId: string, viewerId: string): Promise<ToolUserRow[]> {
  const tool = await db().project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, status: true, hidden: true, showBuilding: true },
  });
  if (!tool) return [];
  const isMaker = tool.ownerId === viewerId;
  if (!isMaker && !isPublicProject(tool)) return [];
  const rows = await db().toolbeltUse.findMany({
    where: { toolId: projectId, project: { owner: { bannedAt: null } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, status: true, note: true, createdAt: true,
      project: { select: { id: true, title: true, status: true, hidden: true, showBuilding: true, owner: { select: { id: true, handle: true } } } },
    },
  });
  const visible = isMaker
    ? rows
    : publicToolUses(rows.map((row) => ({ ...row, tool: { status: tool.status, hidden: tool.hidden, showBuilding: tool.showBuilding } })));
  return visible.map((row) => ({
    id: row.id, status: row.status, note: row.note, createdAt: row.createdAt,
    userId: row.project.owner.id, userHandle: row.project.owner.handle,
    project: { id: row.project.id, title: row.project.title, public: isPublicProject(row.project) },
  }));
}

export async function listToolsUsedBy(personId: string): Promise<ToolUsedRow[]> {
  const owner = await db().person.findUnique({ where: { id: personId }, select: { bannedAt: true } });
  if (!owner || owner.bannedAt) return [];
  const rows = await db().toolbeltUse.findMany({
    where: { status: "confirmed", project: { ownerId: personId }, tool: { owner: { bannedAt: null } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, status: true, note: true,
      project: { select: { id: true, title: true, status: true, hidden: true, showBuilding: true } },
      tool: { select: { id: true, title: true, track: true, status: true, hidden: true, showBuilding: true, owner: publicOwner } },
    },
  });
  return publicToolUses(rows).map((row) => ({
    id: row.id, note: row.note,
    project: { id: row.project.id, title: row.project.title },
    tool: { id: row.tool.id, title: row.tool.title, track: row.tool.track, ownerHandle: row.tool.owner.handle },
  }));
}

export async function searchEquippableTools(viewerId: string, q: string): Promise<EquippableTool[]> {
  const text = q.trim().slice(0, 80);
  const rows = await db().project.findMany({
    where: {
      status: "approved",
      hidden: false,
      repoUrl: { not: null },
      ownerId: { not: viewerId },
      owner: { bannedAt: null, blocksMade: { none: { blockedId: viewerId } } },
      ...(text ? { title: { contains: text, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: TOOL_SEARCH_LIMIT,
    select: { id: true, title: true, description: true, track: true, status: true, repoUrl: true, owner: publicOwner },
  });
  const counts = await usedByCounts(rows.map((r) => r.id));
  return rows
    .filter((r) => normalizeStatus(r.status) === "approved" && r.repoUrl)
    .map((r) => ({
      id: r.id, title: r.title, description: r.description, track: r.track, repoUrl: r.repoUrl as string,
      ownerHandle: r.owner.handle, usedBy: counts[r.id] ?? 0,
    }));
}
