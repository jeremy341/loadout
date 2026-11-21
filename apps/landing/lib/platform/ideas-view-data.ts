// Reads for one idea's page. Server only (uses the database). The list and every write are in ideas-data.ts; this file adds the single
// idea and its applications, which the data layer does not expose.
//
// API:
//   getIdea(viewerId, ideaId)           -> IdeaDetail | null   null for a missing idea, a banned author, or a block either way
//   listApplications(authorId, ideaId)  -> ApplicationRow[]    the author's own idea only (anyone else gets []); newest first, at most 50;
//                                                              applicants who are banned or blocked either way are left out
// Handles only: no email, age, name or Slack id.
import { notBlockedWith } from "./blocks-data";
import { db } from "./db";
import { ideaScore, type IdeaStatus } from "./ideas";

export type IdeaDetail = {
  id: string;
  title: string;
  body: string;
  status: IdeaStatus;
  createdAt: Date;
  authorId: string;
  authorHandle: string | null;
  score: number;
  up: number;
  down: number;
  myVote: 1 | -1 | 0;
  applied: boolean;
};

export type ApplicationRow = { id: string; handle: string | null; message: string; status: "pending" | "accepted" | "declined"; createdAt: Date };

export async function getIdea(viewerId: string, ideaId: string): Promise<IdeaDetail | null> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(ideaId)) return null;
  const row = await db().idea.findFirst({
    where: { id: ideaId, author: { bannedAt: null, ...notBlockedWith(viewerId) } },
    select: {
      id: true,
      title: true,
      body: true,
      status: true,
      createdAt: true,
      authorId: true,
      author: { select: { handle: true } },
      votes: { select: { personId: true, value: true } },
      applications: { where: { personId: viewerId }, select: { id: true }, take: 1 },
    },
  });
  if (!row) return null;
  const values = row.votes.map((vote) => vote.value);
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status as IdeaStatus,
    createdAt: row.createdAt,
    authorId: row.authorId,
    authorHandle: row.author.handle,
    score: ideaScore(values),
    up: values.filter((value) => value > 0).length,
    down: values.filter((value) => value < 0).length,
    myVote: (row.votes.find((vote) => vote.personId === viewerId)?.value ?? 0) as 1 | -1 | 0,
    applied: row.applications.length > 0,
  };
}

export async function listApplications(authorId: string, ideaId: string): Promise<ApplicationRow[]> {
  const rows = await db().ideaCollabApplication.findMany({
    where: { ideaId, idea: { authorId }, person: { bannedAt: null, ...notBlockedWith(authorId) } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, message: true, status: true, createdAt: true, person: { select: { handle: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    handle: row.person.handle,
    message: row.message,
    status: row.status as ApplicationRow["status"],
    createdAt: row.createdAt,
  }));
}
