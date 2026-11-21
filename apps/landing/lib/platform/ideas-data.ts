// Idea reads and writes. Server only (uses the database). Pure rules are in ideas.ts.
// Every list hides banned authors and anyone blocked either way with the viewer. A list shows the newest 100 ideas of the chosen
// status, ranked by score and then newest. Idea status changes are audited (AuditEvent, action "idea.status"), as is accepting an
// application (which takes the idea). Declining and voting are not audited.
//
// API:
//   createIdea(authorId, draft)                  -> CreateResult   { ok: true, id } | { ok: false, message }; at most MAX_OPEN_IDEAS open
//   listIdeas(viewerId, status?)                 -> IdeaRow[]      status defaults to "open"
//   voteIdea(viewerId, ideaId, rawValue)         -> WriteResult    rawValue 1 or -1; one vote per person, changing it is allowed
//   applyToIdea(viewerId, ideaId, rawMessage)    -> WriteResult    one application per person; notifies the author ("idea-application")
//   decideApplication(authorId, applicationId, rawDecision)  -> WriteResult   "accept" takes the idea and declines the other pending
//                                                                applications in one transaction, then notifies the applicant; "decline" only declines
//   setIdeaStatus(actorId, ideaId, rawStatus)    -> WriteResult    the author closes or reopens; "taken" comes only from accepting
//   WriteResult = { ok: true } | { ok: false, message }
import { recordAudit } from "./audit";
import { notBlockedWith, isBlockedEitherWay } from "./blocks-data";
import { db } from "./db";
import { clipText } from "./notifications";
import { notify } from "./notifications-data";
import { createRateLimiter } from "./rate-limit";
import {
  canApply,
  canDecide,
  canSetIdeaStatus,
  canVote,
  checkApplicationMessage,
  checkIdeaDraft,
  checkOpenIdeaLimit,
  checkVoteValue,
  IDEA_STATUSES,
  ideaScore,
  type IdeaStatus,
  rankIdeas,
} from "./ideas";
import { Prisma } from "../generated/prisma/client";

export type WriteResult = { ok: true } | { ok: false; message: string };
export type CreateResult = { ok: true; id: string } | { ok: false; message: string };
export type IdeaRow = {
  id: string;
  title: string;
  body: string;
  status: IdeaStatus;
  createdAt: Date;
  authorHandle: string | null;
  score: number;
  myVote: 1 | -1 | 0;
  applied: boolean;
};

const LIST_MAX = 100;
const writeLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
const voteLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
const SLOW_DOWN = "Slow down a little and try again.";
const NOT_FOUND = "That idea was not found.";

function isStatus(raw: unknown): raw is IdeaStatus {
  return IDEA_STATUSES.includes(raw as IdeaStatus);
}

export async function createIdea(authorId: string, raw: { title?: unknown; body?: unknown }): Promise<CreateResult> {
  if (!writeLimiter.check(`idea:${authorId}`).ok) return { ok: false, message: SLOW_DOWN };
  const draft = checkIdeaDraft(raw);
  if (!draft.ok) return draft;
  const author = await db().person.findUnique({ where: { id: authorId }, select: { bannedAt: true } });
  if (!author || author.bannedAt) return { ok: false, message: "Your account cannot post ideas." };
  const open = await db().idea.count({ where: { authorId, status: "open" } });
  const limit = checkOpenIdeaLimit(open);
  if (!limit.ok) return limit;
  const idea = await db().idea.create({ data: { authorId, title: draft.title, body: draft.body }, select: { id: true } });
  return { ok: true, id: idea.id };
}

export async function listIdeas(viewerId: string, rawStatus: unknown = "open"): Promise<IdeaRow[]> {
  const status: IdeaStatus = isStatus(rawStatus) ? rawStatus : "open";
  const rows = await db().idea.findMany({
    where: { status, author: { bannedAt: null, ...notBlockedWith(viewerId) } },
    orderBy: { createdAt: "desc" },
    take: LIST_MAX,
    select: {
      id: true,
      title: true,
      body: true,
      status: true,
      createdAt: true,
      author: { select: { handle: true } },
      votes: { select: { personId: true, value: true } },
      applications: { where: { personId: viewerId }, select: { id: true }, take: 1 },
    },
  });
  const scored = rows.map((row) => ({
    row,
    score: ideaScore(row.votes.map((vote) => vote.value)),
  }));
  const ranked = rankIdeas(scored.map((s) => ({ id: s.row.id, score: s.score, createdAt: s.row.createdAt, row: s.row })));
  return ranked.map(({ row, score }) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status as IdeaStatus,
    createdAt: row.createdAt,
    authorHandle: row.author.handle,
    score,
    myVote: (row.votes.find((vote) => vote.personId === viewerId)?.value ?? 0) as 1 | -1 | 0,
    applied: row.applications.length > 0,
  }));
}

export async function voteIdea(viewerId: string, ideaId: unknown, rawValue: unknown): Promise<WriteResult> {
  if (!voteLimiter.check(`vote:${viewerId}`).ok) return { ok: false, message: SLOW_DOWN };
  const value = checkVoteValue(rawValue);
  if (!value.ok) return value;
  if (typeof ideaId !== "string" || ideaId === "") return { ok: false, message: NOT_FOUND };
  const idea = await db().idea.findUnique({
    where: { id: ideaId },
    select: { authorId: true, author: { select: { bannedAt: true } } },
  });
  if (!idea || idea.author.bannedAt) return { ok: false, message: NOT_FOUND };
  if (await isBlockedEitherWay(viewerId, idea.authorId)) return { ok: false, message: NOT_FOUND };
  const verdict = canVote({ viewerId, idea });
  if (!verdict.ok) return { ok: false, message: verdict.message };

  await db().ideaVote.upsert({
    where: { ideaId_personId: { ideaId, personId: viewerId } },
    create: { ideaId, personId: viewerId, value: value.value },
    update: { value: value.value, votedAt: new Date() },
  });
  return { ok: true };
}

export async function applyToIdea(viewerId: string, ideaId: unknown, rawMessage: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`apply:${viewerId}`).ok) return { ok: false, message: SLOW_DOWN };
  if (typeof ideaId !== "string" || ideaId === "") return { ok: false, message: NOT_FOUND };
  const message = checkApplicationMessage(rawMessage);
  if (!message.ok) return message;
  const idea = await db().idea.findUnique({
    where: { id: ideaId },
    select: { id: true, title: true, authorId: true, status: true, author: { select: { bannedAt: true } } },
  });
  if (!idea || idea.author.bannedAt) return { ok: false, message: NOT_FOUND };
  if (await isBlockedEitherWay(viewerId, idea.authorId)) return { ok: false, message: NOT_FOUND };
  const existing = await db().ideaCollabApplication.findUnique({
    where: { ideaId_personId: { ideaId, personId: viewerId } },
    select: { id: true },
  });
  const verdict = canApply({ viewerId, idea, alreadyApplied: existing !== null });
  if (!verdict.ok) return { ok: false, message: verdict.message };

  try {
    await db().ideaCollabApplication.create({ data: { ideaId, personId: viewerId, message: message.message } });
  } catch (e) {
    // A double submit: the application exists, which is what the person asked for.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: true };
    throw e;
  }
  const applicant = await db().person.findUnique({ where: { id: viewerId }, select: { handle: true } });
  await notify(idea.authorId, "idea-application", {
    title: clipText(`${applicant?.handle ?? "A builder"} wants to help with "${idea.title}"`, 120),
    href: `/dashboard/ideas/${idea.id}`,
  });
  return { ok: true };
}

export async function decideApplication(authorId: string, applicationId: unknown, rawDecision: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`decide:${authorId}`).ok) return { ok: false, message: SLOW_DOWN };
  if (typeof applicationId !== "string" || applicationId === "") return { ok: false, message: "That application was not found." };
  if (rawDecision !== "accept" && rawDecision !== "decline") return { ok: false, message: "Choose accept or decline." };
  const application = await db().ideaCollabApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      status: true,
      personId: true,
      idea: { select: { id: true, title: true, authorId: true, status: true } },
    },
  });
  if (!application) return { ok: false, message: "That application was not found." };
  const verdict = canDecide({ actorId: authorId, idea: application.idea, application });
  if (!verdict.ok) return { ok: false, message: verdict.message };

  if (rawDecision === "decline") {
    await db().ideaCollabApplication.updateMany({ where: { id: application.id, status: "pending" }, data: { status: "declined" } });
    return { ok: true };
  }

  const outcome = await db().$transaction(async (tx) => {
    // The conditional update is the race guard: only one accept can move the idea from open to taken.
    const taken = await tx.idea.updateMany({ where: { id: application.idea.id, status: "open" }, data: { status: "taken" } });
    if (taken.count !== 1) return "not-open" as const;
    await tx.ideaCollabApplication.updateMany({ where: { id: application.id, status: "pending" }, data: { status: "accepted" } });
    await tx.ideaCollabApplication.updateMany({
      where: { ideaId: application.idea.id, status: "pending", NOT: { id: application.id } },
      data: { status: "declined" },
    });
    await recordAudit(tx, {
      actorId: authorId,
      action: "idea.status",
      targetType: "Idea",
      targetId: application.idea.id,
      reason: "Author accepted a collaborator, so the idea is taken.",
      before: { status: "open" },
      after: { status: "taken" },
    });
    return "taken" as const;
  });
  if (outcome === "not-open") return { ok: false, message: "This idea is not taking applications." };

  await notify(application.personId, "idea-application", {
    title: clipText(`Your application for "${application.idea.title}" was accepted`, 120),
    href: `/dashboard/ideas/${application.idea.id}`,
  });
  return { ok: true };
}

export async function setIdeaStatus(actorId: string, ideaId: unknown, rawStatus: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`status:${actorId}`).ok) return { ok: false, message: SLOW_DOWN };
  if (typeof ideaId !== "string" || ideaId === "") return { ok: false, message: NOT_FOUND };
  const idea = await db().idea.findUnique({ where: { id: ideaId }, select: { id: true, authorId: true, status: true } });
  if (!idea) return { ok: false, message: NOT_FOUND };
  const openCount = await db().idea.count({ where: { authorId: idea.authorId, status: "open" } });
  const verdict = canSetIdeaStatus({ actorId, idea, next: rawStatus, openCount });
  if (!verdict.ok) return { ok: false, message: verdict.message };
  const next = rawStatus as IdeaStatus;

  await db().$transaction(async (tx) => {
    await tx.idea.update({ where: { id: idea.id }, data: { status: next } });
    await recordAudit(tx, {
      actorId,
      action: "idea.status",
      targetType: "Idea",
      targetId: idea.id,
      reason: "Author changed the status of their own idea.",
      before: { status: idea.status },
      after: { status: next },
    });
  });
  return { ok: true };
}
