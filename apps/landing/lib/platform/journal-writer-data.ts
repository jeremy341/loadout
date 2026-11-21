// What the journal writer page needs. Server only. The owner check is part of the query: any other id answers null (a 404).
//   loadWriter(viewerId, projectId, entryId?) -> WriterData | null
import { db } from "./db";
import { journalOpen } from "./journal";
import { photosByEntry, pendingPhotos, type MediaPhoto } from "./media-data";
import { normalizeStatus } from "./profile";

export type WriterData = {
  project: { id: string; title: string; track: string | null; status: string; handle: string | null };
  open: boolean;
  entry: { id: string; title: string; body: string; hours: number; lapseUrl: string | null; createdAt: Date } | null;
  // The project's other entries, for the "hours not yet covered" line.
  otherHours: number;
  otherCount: number;
  photos: MediaPhoto[];
};

export async function loadWriter(viewerId: string, projectId: string, entryId?: string): Promise<WriterData | null> {
  const project = await db().project.findFirst({
    where: { id: projectId, ownerId: viewerId },
    select: { id: true, title: true, track: true, status: true, owner: { select: { handle: true } } },
  });
  if (!project) return null;
  const entry = entryId
    ? await db().journalEntry.findFirst({
        where: { id: entryId, projectId: project.id, authorId: viewerId },
        select: { id: true, title: true, body: true, hours: true, lapseUrl: true, createdAt: true },
      })
    : null;
  if (entryId && !entry) return null;
  const others = await db().journalEntry.aggregate({
    where: { projectId: project.id, author: { bannedAt: null }, ...(entry ? { id: { not: entry.id } } : {}) },
    _sum: { hours: true },
    _count: { _all: true },
  });
  const attached = entry ? ((await photosByEntry([entry.id]))[entry.id] ?? []) : [];
  const pending = await pendingPhotos(project.id);
  return {
    project: { id: project.id, title: project.title, track: project.track, status: project.status, handle: project.owner.handle },
    open: journalOpen(normalizeStatus(project.status)),
    entry,
    otherHours: others._sum.hours ?? 0,
    otherCount: others._count._all,
    photos: [...attached, ...pending],
  };
}
