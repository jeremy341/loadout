// Follow reads and writes. Server only (uses the database). Pure rules are in follows.ts; blocks are hidden through blocks-data.ts.
// Lists show handles only: never a display name, email, birthday, age or Slack id. Banned builders are left out of every list and
// every count.
//
// API:
//   followBuilder(viewerId, handle)            -> WriteResult   notifies the followed builder ("follow") on a new follow only
//   unfollowBuilder(viewerId, handle)          -> WriteResult   always works, even when a block now exists
//   followCounts(personId)                     -> { followers, following }   counts leave out banned builders
//   isFriend(a, b)                             -> boolean        follows in both directions
//   listFollowers(personId, viewerId)          -> { handle }[]   up to FOLLOW_LIST_MAX, by handle; hides anyone blocked either way with the viewer
//   listFollowing(personId, viewerId)          -> { handle }[]   same rules
//   WriteResult = { ok: true } | { ok: false, message }
import { Prisma } from "../generated/prisma/client";
import { isBlockedEitherWay, notBlockedWith } from "./blocks-data";
import { canFollow, FOLLOW_LIST_MAX, followTitle, isFriend as bothWays } from "./follows";
import { db } from "./db";
import { notify } from "./notifications-data";
import { createRateLimiter } from "./rate-limit";

export type WriteResult = { ok: true } | { ok: false; message: string };
export type ListedBuilder = { handle: string };

const writeLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
const SLOW_DOWN: WriteResult = { ok: false, message: "Slow down a little and try again." };
const NOT_FOUND: WriteResult = { ok: false, message: "That builder was not found." };

function cleanHandle(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export async function followBuilder(viewerId: string, rawHandle: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`follow:${viewerId}`).ok) return SLOW_DOWN;
  const handle = cleanHandle(rawHandle);
  if (handle === "") return NOT_FOUND;
  const target = await db().person.findUnique({ where: { handle }, select: { id: true, handle: true, bannedAt: true } });
  if (!target) return NOT_FOUND;
  const verdict = canFollow({
    viewerId,
    target: { id: target.id, handle: target.handle, banned: target.bannedAt !== null },
    blocked: await isBlockedEitherWay(viewerId, target.id),
  });
  if (!verdict.ok) return { ok: false, message: verdict.reason };

  try {
    await db().follow.create({ data: { followerId: viewerId, followeeId: target.id } });
  } catch (e) {
    // Already following: the state asked for is in place, and no second notification goes out.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: true };
    throw e;
  }
  const viewer = await db().person.findUnique({ where: { id: viewerId }, select: { handle: true } });
  await notify(target.id, "follow", { title: followTitle(viewer?.handle ?? null), href: viewer?.handle ? `/dashboard/builders/${viewer.handle}` : undefined });
  return { ok: true };
}

export async function unfollowBuilder(viewerId: string, rawHandle: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`unfollow:${viewerId}`).ok) return SLOW_DOWN;
  const handle = cleanHandle(rawHandle);
  if (handle === "") return NOT_FOUND;
  const target = await db().person.findUnique({ where: { handle }, select: { id: true } });
  if (!target) return NOT_FOUND;
  await db().follow.deleteMany({ where: { followerId: viewerId, followeeId: target.id } });
  return { ok: true };
}

export async function followCounts(personId: string): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    db().follow.count({ where: { followeeId: personId, follower: { bannedAt: null } } }),
    db().follow.count({ where: { followerId: personId, followee: { bannedAt: null } } }),
  ]);
  return { followers, following };
}

export async function isFriend(a: string, b: string): Promise<boolean> {
  const [aFollowsB, bFollowsA] = await Promise.all([
    db().follow.count({ where: { followerId: a, followeeId: b } }),
    db().follow.count({ where: { followerId: b, followeeId: a } }),
  ]);
  return bothWays(aFollowsB > 0, bFollowsA > 0);
}

export async function listFollowers(personId: string, viewerId: string): Promise<ListedBuilder[]> {
  const rows = await db().follow.findMany({
    where: {
      followeeId: personId,
      follower: { bannedAt: null, handle: { not: null }, ...notBlockedWith(viewerId) },
    },
    orderBy: { follower: { handle: "asc" } },
    take: FOLLOW_LIST_MAX,
    select: { follower: { select: { handle: true } } },
  });
  return rows.flatMap((row) => (row.follower.handle ? [{ handle: row.follower.handle }] : []));
}

export async function listFollowing(personId: string, viewerId: string): Promise<ListedBuilder[]> {
  const rows = await db().follow.findMany({
    where: {
      followerId: personId,
      followee: { bannedAt: null, handle: { not: null }, ...notBlockedWith(viewerId) },
    },
    orderBy: { followee: { handle: "asc" } },
    take: FOLLOW_LIST_MAX,
    select: { followee: { select: { handle: true } } },
  });
  return rows.flatMap((row) => (row.followee.handle ? [{ handle: row.followee.handle }] : []));
}
