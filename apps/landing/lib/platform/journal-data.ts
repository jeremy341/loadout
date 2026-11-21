// Journal reads. Server only (uses the database). INTERNAL like listUsesForProject: the caller must have checked that the viewer
// owns the project or is staff. Entries by a banned person are not returned.
//   listJournal(projectId)  -> JournalRow[]   newest first
//   loggedHours(projectId)  -> number         self-reported hours, NOT approved hours
//   journalStats(projectId) -> { entries, hours, due, owed }   the 8 hour rule applied to the project
import { db } from "./db";
import { entriesOwed, journalDue } from "./journal";

export type JournalRow = {
  id: string;
  projectId: string;
  authorId: string;
  title: string;
  body: string;
  hours: number;
  // What a reviewer decided to credit for this entry; null until it is reviewed.
  keptMinutes: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listJournal(projectId: string): Promise<JournalRow[]> {
  return db().journalEntry.findMany({
    where: { projectId, author: { bannedAt: null } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, projectId: true, authorId: true, title: true, body: true, hours: true, keptMinutes: true, status: true, createdAt: true, updatedAt: true },
  });
}

export async function loggedHours(projectId: string): Promise<number> {
  const sum = await db().journalEntry.aggregate({ where: { projectId, author: { bannedAt: null } }, _sum: { hours: true } });
  return sum._sum.hours ?? 0;
}

export async function journalStats(projectId: string): Promise<{ entries: number; hours: number; due: number; owed: number }> {
  const agg = await db().journalEntry.aggregate({ where: { projectId, author: { bannedAt: null } }, _sum: { hours: true }, _count: { _all: true } });
  const hours = agg._sum.hours ?? 0;
  const entries = agg._count._all;
  return { entries, hours, due: journalDue(hours, entries), owed: entriesOwed(hours, entries) };
}
