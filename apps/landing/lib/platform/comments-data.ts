// Builder comments on a project: reads and writes. Server only (uses the database). The pure rules are in comments.ts
// (checkComment); the visibility rule is the platform's own (lib/platform/profile.ts: every project is public, drafts
// included, except a banned one — so comments live on public projects only, and a comment on a banned project or by a
// banned builder is not shown).
//
// API:
//   listProjectComments(projectId)      -> CommentView[]   oldest first, at most COMMENTS_SHOWN, newest kept when cut
//   countProjectComment(projectId)      -> number
//   addProjectComment(viewerId, projectId, rawBody) -> WriteResult   writes only a public project's comment
//   deleteProjectComment(viewerId, id)  -> WriteResult   the writer only (deleteMany carries the author check)
import { db } from "./db";
import { isPublicProject } from "./profile";
import { checkComment, COMMENTS_SHOWN } from "./comments";
import { createRateLimiter } from "./rate-limit";

export type WriteResult = { ok: true } | { ok: false; message: string };

export type CommentView = {
  id: string;
  authorId: string;
  authorHandle: string | null;
  body: string;
  createdAt: Date;
};

const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });
const SLOW_DOWN: WriteResult = { ok: false, message: "Slow down a little and try again." };
const NOT_FOUND: WriteResult = { ok: false, message: "That project was not found." };

// The comments one project page lists, oldest first so the thread reads top to bottom. When there are more than
// COMMENTS_SHOWN the newest ones are kept and the page says the list is cut. Banned writers' comments are not listed.
export async function listProjectComments(projectId: string): Promise<{ items: CommentView[]; total: number; shown: number }> {
  const where = { projectId, author: { bannedAt: null } };
  const total = await db().projectComment.count({ where });
  const rows = await db().projectComment.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: COMMENTS_SHOWN,
    skip: Math.max(0, total - COMMENTS_SHOWN),
    select: { id: true, authorId: true, body: true, createdAt: true, author: { select: { handle: true } } },
  });
  return {
    items: rows.map((row) => ({ id: row.id, authorId: row.authorId, authorHandle: row.author?.handle ?? null, body: row.body, createdAt: row.createdAt })),
    total,
    shown: Math.min(total, COMMENTS_SHOWN),
  };
}

export async function countProjectComments(projectId: string): Promise<number> {
  return db().projectComment.count({ where: { projectId, author: { bannedAt: null } } });
}

// A signed-in builder comments on a public project (not banned, and its owner not banned — the same rule kudos follow).
// The comment is checked by the pure rule, then written; blank or over-long bodies never reach the database.
export async function addProjectComment(viewerId: string, projectId: string, rawBody: unknown): Promise<WriteResult> {
  if (!limiter.check(`comment:${viewerId}`).ok) return SLOW_DOWN;
  const project = await db().project.findFirst({
    where: { id: projectId },
    select: { status: true, owner: { select: { bannedAt: true } } },
  });
  if (!project || project.owner.bannedAt !== null || !isPublicProject({ status: project.status })) return NOT_FOUND;
  const check = checkComment(rawBody);
  if (!check.ok) return { ok: false, message: check.message };
  await db().projectComment.create({ data: { projectId, authorId: viewerId, body: check.value } });
  return { ok: true };
}

// The writer's own comment, nothing else: a delete that carries the author check in the query, so another builder's id in
// the form deletes nothing and answers as if the comment were already gone.
export async function deleteProjectComment(viewerId: string, id: string): Promise<WriteResult> {
  if (!limiter.check(`comment-delete:${viewerId}`).ok) return SLOW_DOWN;
  await db().projectComment.deleteMany({ where: { id, authorId: viewerId } });
  return { ok: true };
}
