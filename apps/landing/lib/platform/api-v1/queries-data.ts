// Reads behind the /api/v1 routes. Server only (uses the database). Read only: nothing here writes.
// Every query that serves another builder applies the visibility rules: banned people and banned projects are left out, and a
// block either way hides the row (notBlockedWith in blocks-data.ts). Public rows carry handles, never an email or a name.
//
// API (own data, for the signed-in key's person):
//   ownPerson(personId)                         -> SelfPerson | null
//   ownProjects(personId, cursor, limit)        -> OwnProjectRow[]           newest first
//   ownHoursWindow(personId, from, to)          -> { rows: {day, name, seconds}[], linked, lastSyncAt, lastStatus }
//   ownTrackProjects(personId)                  -> { track, approvedMinutes }[]
//   ownHackatimeTracks(personId)                -> Map<name, track | null>
//   ownLedger(personId, cursor, limit)          -> LedgerRowLike[]           newest first, own rows only
//   ownJournalWindow(personId, from, to)        -> { createdAt, hours }[]    the window is UTC days, inclusive
// API (public, for the viewer):
//   publicProjects(viewerId, { q, track, ownerHandle }, cursor, limit) -> PublicProjectRow[]
//   publicProject(viewerId, projectId)          -> PublicProjectRow | null
//   publicJournal(viewerId, projectId, cursor, limit) -> JournalRowLike[]
//   publicBuilders(viewerId, q, afterHandle, limit)   -> BuilderRow[]
//   publicBuilder(viewerId, handle)             -> { person: BuilderRow, projectCount } | null
// API (stats):
//   latestSnapshot(kind)                        -> { day, data } | null
//   snapshotsBetween(kind, from, to)            -> { day, data }[]
//   visibleStatsPeople(personIds)               -> Map<personId, handle>   only people who turned stats on, not banned
import { notBlockedWith } from "../blocks-data";
import { db } from "../db";
import { parseSearchQuery } from "../search";
import type { SelfPerson } from "./serializers";
import type { OwnProjectRow, PublicProjectRow, JournalRowLike, BuilderRow, LedgerRowLike } from "./serializers";
import { dayKey } from "../hackatime/rules";

// Projects a visitor may see: not banned, the owner has a handle and is not banned, and no block either way with the viewer.
function visibleProjectWhere(viewerId: string) {
  return {
    bannedAt: null,
    status: { notIn: ["banned"] },
    owner: { bannedAt: null, handle: { not: null }, ...notBlockedWith(viewerId) },
  };
}

// Newest first with a stable tie break. The cursor is the (createdAt, id) of the last row on the previous page.
function newestFirstAfter(at: Date | null, id: string | null) {
  if (!at || !id) return {};
  return { OR: [{ createdAt: { lt: at } }, { createdAt: at, id: { lt: id } }] };
}

const OWN_PROJECT_SELECT = {
  id: true,
  title: true,
  description: true,
  track: true,
  status: true,
  isUpdate: true,
  approvedMinutes: true,
  reviewNote: true,
  repoUrl: true,
  demoUrl: true,
  createdAt: true,
  submittedAt: true,
  firstShippedAt: true,
} as const;

export async function ownPerson(personId: string): Promise<SelfPerson | null> {
  return db().person.findUnique({
    where: { id: personId },
    select: { id: true, handle: true, displayName: true, bio: true, createdAt: true, statsVisible: true },
  });
}

export async function ownProjects(personId: string, cursor: { at: Date; id: string } | null, limit: number): Promise<OwnProjectRow[]> {
  return db().project.findMany({
    where: { ownerId: personId, ...newestFirstAfter(cursor?.at ?? null, cursor?.id ?? null) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: OWN_PROJECT_SELECT,
  });
}

export async function ownHoursWindow(
  personId: string,
  from: string,
  to: string,
): Promise<{ rows: { day: string; name: string; seconds: number }[]; linked: boolean; lastSyncAt: Date | null; lastStatus: string | null }> {
  const [link, rows] = await Promise.all([
    db().hackatimeLink.findUnique({ where: { personId }, select: { lastSyncAt: true, lastStatus: true } }),
    db().hoursDay.findMany({
      where: { personId, day: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) } },
      select: { day: true, hackatimeName: true, seconds: true },
    }),
  ]);
  return {
    rows: rows.map((r) => ({ day: dayKey(r.day), name: r.hackatimeName, seconds: r.seconds })),
    linked: link !== null,
    lastSyncAt: link?.lastSyncAt ?? null,
    lastStatus: link?.lastStatus ?? null,
  };
}

export async function ownTrackProjects(personId: string): Promise<{ track: string | null; approvedMinutes: number }[]> {
  return db().project.findMany({ where: { ownerId: personId }, select: { track: true, approvedMinutes: true } });
}

export async function ownHackatimeTracks(personId: string): Promise<Map<string, string | null>> {
  const rows = await db().hackatimeProject.findMany({
    where: { personId },
    select: { name: true, project: { select: { track: true } } },
  });
  return new Map(rows.map((r) => [r.name, r.project?.track ?? null]));
}

export async function ownLedger(personId: string, cursor: { at: Date; id: string } | null, limit: number): Promise<LedgerRowLike[]> {
  return db().ledgerEntry.findMany({
    where: { personId, ...newestFirstAfter(cursor?.at ?? null, cursor?.id ?? null) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: { id: true, amountOre: true, status: true, kind: true, reason: true, projectId: true, createdAt: true, confirmedAt: true },
  });
}

export async function ownJournalWindow(personId: string, from: string, to: string): Promise<{ createdAt: Date; hours: number }[]> {
  // One day of slack on each side: the grace rule can move an entry at 00:20 into the day before.
  const start = new Date(`${from}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(`${to}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 2);
  return db().journalEntry.findMany({
    where: { authorId: personId, createdAt: { gte: start, lt: end } },
    select: { createdAt: true, hours: true },
  });
}

export async function publicProjects(
  viewerId: string,
  filter: { q: string; track: string | null; ownerHandle: string | null },
  cursor: { at: Date; id: string } | null,
  limit: number,
): Promise<PublicProjectRow[]> {
  const parsed = parseSearchQuery(filter.q);
  const track = filter.track ?? parsed.track;
  const by = filter.ownerHandle ?? parsed.by;
  const words = parsed.tokens.map((token) => ({
    OR: [
      { title: { contains: token, mode: "insensitive" as const } },
      { description: { contains: token, mode: "insensitive" as const } },
      { owner: { handle: { contains: token, mode: "insensitive" as const } } },
    ],
  }));
  return db().project.findMany({
    where: {
      ...visibleProjectWhere(viewerId),
      ...(track ? { track } : {}),
      ...(by ? { owner: { ...visibleProjectWhere(viewerId).owner, handle: by } } : {}),
      ...(words.length ? { AND: words } : {}),
      ...newestFirstAfter(cursor?.at ?? null, cursor?.id ?? null),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: PUBLIC_PROJECT_SELECT,
  });
}

const PUBLIC_PROJECT_SELECT = {
  id: true,
  title: true,
  description: true,
  track: true,
  status: true,
  approvedMinutes: true,
  repoUrl: true,
  demoUrl: true,
  createdAt: true,
  owner: { select: { handle: true } },
} as const;

export async function publicProject(viewerId: string, projectId: string): Promise<PublicProjectRow | null> {
  return db().project.findFirst({
    where: { id: projectId, ...visibleProjectWhere(viewerId) },
    select: PUBLIC_PROJECT_SELECT,
  });
}

export async function publicJournal(
  viewerId: string,
  projectId: string,
  cursor: { at: Date; id: string } | null,
  limit: number,
): Promise<JournalRowLike[]> {
  return db().journalEntry.findMany({
    where: {
      projectId,
      // The project itself must be public to this viewer, so the query holds even if a caller skips publicProject first.
      project: visibleProjectWhere(viewerId),
      author: { bannedAt: null, ...notBlockedWith(viewerId) },
      ...newestFirstAfter(cursor?.at ?? null, cursor?.id ?? null),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: { id: true, title: true, body: true, hours: true, status: true, createdAt: true, updatedAt: true },
  });
}

export async function publicBuilders(viewerId: string, q: string, afterHandle: string | null, limit: number): Promise<BuilderRow[]> {
  const term = q.trim().toLowerCase();
  const rows = await db().person.findMany({
    where: {
      handle: { not: null, ...(afterHandle ? { gt: afterHandle } : {}), ...(term ? { contains: term } : {}) },
      bannedAt: null,
      ...notBlockedWith(viewerId),
    },
    orderBy: { handle: "asc" },
    take: limit + 1,
    select: { handle: true, bio: true, createdAt: true },
  });
  return rows.map((r) => ({ handle: r.handle ?? "", bio: r.bio, createdAt: r.createdAt }));
}

export async function publicBuilder(viewerId: string, handle: string): Promise<{ person: BuilderRow; projectCount: number } | null> {
  const person = await db().person.findFirst({
    where: { handle, bannedAt: null, ...notBlockedWith(viewerId) },
    select: { id: true, handle: true, bio: true, createdAt: true },
  });
  if (!person || !person.handle) return null;
  const projectCount = await db().project.count({ where: { ownerId: person.id, ...visibleProjectWhere(viewerId) } });
  return { person: { handle: person.handle, bio: person.bio, createdAt: person.createdAt }, projectCount };
}

export async function latestSnapshot(kind: string): Promise<{ day: Date; data: unknown } | null> {
  const row = await db().statSnapshot.findFirst({ where: { kind }, orderBy: { day: "desc" }, select: { day: true, data: true } });
  return row ? { day: row.day, data: row.data } : null;
}

export async function snapshotsBetween(kind: string, from: string, to: string): Promise<{ day: Date; data: unknown }[]> {
  const rows = await db().statSnapshot.findMany({
    where: { kind, day: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) } },
    orderBy: { day: "asc" },
    select: { day: true, data: true },
  });
  return rows;
}

// The leaderboard snapshot is written nightly, so a person who has just turned stats off may still be in it. Every read
// checks the current setting, so the switch takes effect at once.
export async function visibleStatsPeople(personIds: string[]): Promise<Map<string, string>> {
  if (personIds.length === 0) return new Map();
  const rows = await db().person.findMany({
    where: { id: { in: personIds }, statsVisible: true, bannedAt: null, handle: { not: null } },
    select: { id: true, handle: true },
  });
  return new Map(rows.map((r) => [r.id, r.handle ?? ""]));
}

