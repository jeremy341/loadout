// Activity reads for the profile heatmap and Recent activity. Server only (uses the database). One query for a person's journal
// entries in the window, no per project reads. Entries by a banned person are not returned.
//   listActivity(personId, now, mode) -> { entries, recent }   mode "all": every entry (journals are readable by others)
//     entries: { createdAt, hours }[]   self-reported hours for the heatmap
//     recent:  the newest entries with the project title; mode "public" keeps only entries of projects a visitor may see
// The hours are logged (self-reported), never approved.
import { db } from "./db";
import { isPublicProject } from "./profile";
import { HEATMAP_WEEKS } from "./activity";

export type ActivityEntry = { createdAt: Date; hours: number };
export type RecentEntry = { id: string; title: string; hours: number; createdAt: Date; projectId: string; projectTitle: string };

const RECENT = 5;
const MAX_ROWS = 5000;

export async function listActivity(personId: string, now: Date, mode: "own" | "public" | "all"): Promise<{ entries: ActivityEntry[]; recent: RecentEntry[] }> {
  const since = new Date(now.getTime() - (HEATMAP_WEEKS * 7 + 7) * 86_400_000);
  const rows = await db().journalEntry.findMany({
    where: { authorId: personId, createdAt: { gte: since }, author: { bannedAt: null } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_ROWS,
    select: { id: true, title: true, hours: true, createdAt: true, projectId: true, project: { select: { title: true, status: true } } },
  });
  const visible = mode !== "public" ? rows : rows.filter((row) => isPublicProject(row.project));
  return {
    entries: visible.map((row) => ({ createdAt: row.createdAt, hours: row.hours })),
    recent: visible.slice(0, RECENT).map((row) => ({ id: row.id, title: row.title, hours: row.hours, createdAt: row.createdAt, projectId: row.projectId, projectTitle: row.project.title })),
  };
}

export type ProfileJournalEntry = { id: string; title: string; body: string; hours: number; createdAt: Date; projectId: string; projectTitle: string; projectStatus: string };

// The latest journal entries across a builder's projects, newest first, for the Journal tab. Journals are readable by others,
// so there is no per viewer filter. Selects no email or name. A banned person has none.
export async function listProfileJournal(personId: string, limit: number): Promise<{ entries: ProfileJournalEntry[]; total: number }> {
  const where = { authorId: personId, author: { bannedAt: null } };
  const [rows, total] = await Promise.all([
    db().journalEntry.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: { id: true, title: true, body: true, hours: true, createdAt: true, projectId: true, project: { select: { title: true, status: true } } },
    }),
    db().journalEntry.count({ where }),
  ]);
  return {
    entries: rows.map((row) => ({ id: row.id, title: row.title, body: row.body, hours: row.hours, createdAt: row.createdAt, projectId: row.projectId, projectTitle: row.project.title, projectStatus: row.project.status })),
    total,
  };
}
