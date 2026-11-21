// Journal media reads and writes. Server only. A deleted row (deletedAt set) is never returned. A photo that is uploaded but not saved
// with an entry yet (entryId null) is the owner's alone; the public readers only ask for photos that belong to an entry.
//   photosByEntry(entryIds)  -> Record<entryId, MediaPhoto[]>   oldest first
//   coverOf(projectId)       -> { id, width, height } | null
//   pendingPhotos(projectId) -> MediaPhoto[]                     owner only: uploaded, not yet on an entry
//   mediaUrl(id)             -> the address the file is served from
import { db } from "./db";
import { journalOpen } from "./journal";
import { photoRuleApplies } from "./journal-writer";
import { checkMediaWrite, LOCKED_MESSAGE, UNDECIDED_ENTRY } from "./media-limits";
import { removeImage, saveImage } from "./media-store";
import type { ImageType, MediaKind } from "./uploads";
import type { ShipJournal } from "./ship-gate";

export type MediaPhoto = { id: string; entryId: string | null; alt: string; width: number; height: number };

export { mediaUrl } from "./media-url";

export async function photosByEntry(entryIds: readonly string[]): Promise<Record<string, MediaPhoto[]>> {
  const out: Record<string, MediaPhoto[]> = {};
  if (entryIds.length === 0) return out;
  const rows = await db().journalMedia.findMany({
    where: { entryId: { in: [...entryIds] }, kind: "photo", deletedAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, entryId: true, alt: true, width: true, height: true },
  });
  for (const row of rows) (out[row.entryId ?? ""] ??= []).push(row);
  return out;
}

export async function coverOf(projectId: string): Promise<{ id: string; width: number; height: number } | null> {
  return db().journalMedia.findFirst({
    where: { projectId, kind: "cover", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, width: true, height: true },
  });
}

export async function pendingPhotos(projectId: string): Promise<MediaPhoto[]> {
  return db().journalMedia.findMany({
    where: { projectId, entryId: null, kind: "photo", deletedAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, entryId: true, alt: true, width: true, height: true },
  });
}

// The entries as the ship gate reads them: hours and text, plus the photo count and whether the photo rule covers each entry.
export async function shipJournals(entries: readonly { id: string; hours: number; body: string; createdAt: Date; keptMinutes?: number | null }[]): Promise<ShipJournal[]> {
  const photos = await photosByEntry(entries.map((entry) => entry.id));
  return entries.map((entry) => ({
    hours: entry.hours,
    body: entry.body,
    photos: photos[entry.id]?.length ?? 0,
    photoRule: photoRuleApplies(entry.createdAt),
    keptMinutes: entry.keptMinutes,
  }));
}

// ---- Writes -----------------------------------------------------------------------------------------------------------------------
// The two mutations below own the races around journal media. Every check that decides whether a write is allowed is repeated inside
// one transaction, under a lock keyed on the project, so two concurrent uploads or an upload racing a ship see a committed state.
// Physical files are never deleted before the transaction commits, and a saved image is removed if its row cannot be written.
type Client = ReturnType<typeof db>;
export type MediaWriteDeps = { client: Client; save: typeof saveImage; remove: typeof removeImage };

export function mediaWriteDeps(overrides: Partial<MediaWriteDeps> = {}): MediaWriteDeps {
  // The defaults are lazy so a caller that supplies a client (a test) never needs DATABASE_URL.
  return {
    client: overrides.client ?? db(),
    save: overrides.save ?? saveImage,
    remove: overrides.remove ?? removeImage,
  };
}

export class MediaConflict extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "MediaConflict";
  }
}

const DECIDED_MESSAGE = "A reviewer already decided this entry, so its photos can't change.";
const lockKey = (projectId: string) => `journal-media:${projectId}`;

export async function storeJournalMedia(
  image: { bytes: Buffer; type: ImageType; width: number; height: number },
  input: { projectId: string; entryId: string | null; kind: MediaKind },
  deps: MediaWriteDeps,
): Promise<{ id: string; width: number; height: number }> {
  const { client, save, remove } = deps;
  const stored = await save(input.projectId, image.bytes, image.type);
  let committed = false;
  let superseded: string[] = [];
  try {
    const row = await client.$transaction(async (tx) => {
      // Serialise every writer for this project: the cap and status checks below must see the rows the others committed.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey(input.projectId)}))`;
      const project = await tx.project.findFirst({ where: { id: input.projectId }, select: { status: true } });
      const live = await tx.journalMedia.count({ where: { projectId: input.projectId, deletedAt: null } });
      const held = await tx.journalMedia.count({ where: { projectId: input.projectId, kind: "photo", deletedAt: null, entryId: input.entryId } });
      const allowed = checkMediaWrite({ status: project?.status ?? "", live, held, kind: input.kind, entryId: input.entryId });
      if (!allowed.ok) throw new MediaConflict(allowed.status, allowed.message);

      const created = await tx.journalMedia.create({
        data: {
          projectId: input.projectId,
          entryId: input.entryId,
          kind: input.kind,
          path: stored,
          width: image.width,
          height: image.height,
          byteSize: image.bytes.length,
        },
        select: { id: true, width: true, height: true },
      });
      if (input.kind === "cover") {
        // The new cover and the deletion of the old ones are one transaction. Only their paths leave it, for removal after commit.
        const old = await tx.journalMedia.findMany({
          where: { projectId: input.projectId, kind: "cover", deletedAt: null, id: { not: created.id } },
          select: { id: true, path: true },
        });
        for (const item of old) await tx.journalMedia.update({ where: { id: item.id }, data: { deletedAt: new Date() } });
        superseded = old.map((item) => item.path);
      }
      return created;
    });
    committed = true;
    for (const path of superseded) await remove(path);
    return { id: row.id, width: row.width, height: row.height };
  } catch (error) {
    // The bytes are already on disk. If the database did not commit, undo them; otherwise they are the live file.
    if (!committed) await remove(stored).catch(() => {});
    throw error;
  }
}

export type MediaDeleteResult = { ok: true; projectId: string; path: string } | { ok: false; status: number; message: string };

export async function deleteJournalMedia(input: { id: string; viewerId: string }, deps: MediaWriteDeps): Promise<MediaDeleteResult> {
  const { client, remove } = deps;
  const row = await client.journalMedia.findFirst({
    where: { id: input.id, deletedAt: null, project: { ownerId: input.viewerId } },
    select: { id: true, path: true, projectId: true, entryId: true, project: { select: { status: true } } },
  });
  if (!row) return { ok: false, status: 404, message: "That file was not found." };
  if (!journalOpen(row.project.status)) return { ok: false, status: 409, message: LOCKED_MESSAGE };
  if (row.entryId) {
    const entry = await client.journalEntry.findFirst({ where: { id: row.entryId, ...UNDECIDED_ENTRY }, select: { id: true } });
    if (!entry) return { ok: false, status: 409, message: DECIDED_MESSAGE };
  }

  // Re-read both gates under the project's lock, immediately before the update: a ship or a review decision may have landed since
  // the row was fetched. The file is removed only after the transaction has committed the deletion.
  const outcome = await client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey(row.projectId)}))`;
    const project = await tx.project.findFirst({ where: { id: row.projectId }, select: { status: true } });
    if (!project || !journalOpen(project.status)) return { ok: false as const, status: 409, message: LOCKED_MESSAGE };
    if (row.entryId) {
      const entry = await tx.journalEntry.findFirst({ where: { id: row.entryId, ...UNDECIDED_ENTRY }, select: { id: true } });
      if (!entry) return { ok: false as const, status: 409, message: DECIDED_MESSAGE };
    }
    await tx.journalMedia.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
    return { ok: true as const };
  });
  if (!outcome.ok) return outcome;
  await remove(row.path);
  return { ok: true, projectId: row.projectId, path: row.path };
}
