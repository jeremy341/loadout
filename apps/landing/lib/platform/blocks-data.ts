// Block reads and writes. Server only (uses the database).
// A block removes follows both ways and the pending collaborator invites and idea applications between the two builders. It does
// not touch accepted collaborations or anything already decided; the owner can still remove those through collaborators-data.ts.
// Blocking is audited (AuditEvent, action "person.block"). Unblocking is not, because it only restores what the block hid.
//
// API:
//   blockBuilder(blockerId, handle)      -> WriteResult    handle is the builder's public handle. Idempotent: a second block writes nothing.
//   unblockBuilder(blockerId, handle)    -> WriteResult
//   isBlockedEitherWay(a, b)             -> boolean
//   notBlockedWith(viewerId)             -> Prisma where fragment for a Person relation: spread it into a `person` / `owner` / `author`
//                                           filter so the row is hidden when either builder has blocked the other.
//   WriteResult = { ok: true } | { ok: false, message }
import { recordAudit } from "./audit";
import { BLOCK_REASON, canBlock } from "./blocks";
import { db } from "./db";
import { createRateLimiter } from "./rate-limit";

export type WriteResult = { ok: true } | { ok: false; message: string };

const writeLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
const SLOW_DOWN: WriteResult = { ok: false, message: "Slow down a little and try again." };
const NOT_FOUND: WriteResult = { ok: false, message: "That builder was not found." };

function cleanHandle(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function notBlockedWith(viewerId: string) {
  return {
    NOT: {
      OR: [{ blocksSent: { some: { blockedId: viewerId } } }, { blocksGot: { some: { blockerId: viewerId } } }],
    },
  };
}

export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const found = await db().block.count({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return found > 0;
}

export async function blockBuilder(blockerId: string, rawHandle: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`block:${blockerId}`).ok) return SLOW_DOWN;
  const handle = cleanHandle(rawHandle);
  if (handle === "") return NOT_FOUND;
  const target = await db().person.findUnique({ where: { handle }, select: { id: true, bannedAt: true } });
  if (!target) return NOT_FOUND;
  const verdict = canBlock({ blockerId, target: { id: target.id, banned: target.bannedAt !== null } });
  if (!verdict.ok) return { ok: false, message: verdict.reason };

  await db().$transaction(async (tx) => {
    const key = { blockerId_blockedId: { blockerId, blockedId: target.id } };
    const existed = await tx.block.findUnique({ where: key, select: { blockerId: true } });
    if (existed) return;
    await tx.block.create({ data: { blockerId, blockedId: target.id } });
    await tx.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followeeId: target.id },
          { followerId: target.id, followeeId: blockerId },
        ],
      },
    });
    await tx.projectCollaborator.deleteMany({
      where: {
        status: "invited",
        OR: [
          { personId: target.id, project: { ownerId: blockerId } },
          { personId: blockerId, project: { ownerId: target.id } },
        ],
      },
    });
    await tx.ideaCollabApplication.deleteMany({
      where: {
        status: "pending",
        OR: [
          { personId: target.id, idea: { authorId: blockerId } },
          { personId: blockerId, idea: { authorId: target.id } },
        ],
      },
    });
    await recordAudit(tx, {
      actorId: blockerId,
      action: "person.block",
      targetType: "Person",
      targetId: target.id,
      reason: BLOCK_REASON,
    });
  });
  return { ok: true };
}

export async function unblockBuilder(blockerId: string, rawHandle: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`unblock:${blockerId}`).ok) return SLOW_DOWN;
  const handle = cleanHandle(rawHandle);
  if (handle === "") return NOT_FOUND;
  const target = await db().person.findUnique({ where: { handle }, select: { id: true } });
  if (!target) return NOT_FOUND;
  await db().block.deleteMany({ where: { blockerId, blockedId: target.id } });
  return { ok: true };
}
