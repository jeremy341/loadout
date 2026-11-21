import { NextResponse } from "next/server";
import { mediaWriteDeps, MediaConflict, storeJournalMedia } from "@/lib/platform/media-data";
import { db } from "@/lib/platform/db";
import { journalOpen } from "@/lib/platform/journal";
import { MAX_PHOTOS_PER_ENTRY } from "@/lib/platform/journal-writer";
import { MAX_MEDIA_PER_PROJECT, MAX_STAGED_PHOTOS_PER_PROJECT, parseMultipart, readCappedBody, UNDECIDED_ENTRY, UPLOAD_RATE } from "@/lib/platform/media-limits";
import { processImage, UploadError } from "@/lib/platform/media-store";
import { mediaUrl } from "@/lib/platform/media-url";
import { checkLimit, rateLimitHeaders } from "@/lib/platform/rate-limit-db";
import { sameOrigin } from "@/lib/platform/same-origin";
import { readViewer } from "@/lib/platform/session";
import { isMediaKind, MAX_UPLOAD_BYTES, uploadsEnabled } from "@/lib/platform/uploads";

// POST /api/journal-media  (multipart: file, projectId, kind = photo | cover, entryId optional)
// Owner only. Images only (checked by their first bytes), 10 MB, re-encoded without metadata. Off unless LOADOUT_UPLOADS=true.
// A photo is stored unattached; saving the entry attaches it. A cover replaces the old one.
// The body is capped while it is read (the declared length is only a quick refusal), uploads are rate limited per viewer, and a
// project holds a bounded number of live files. A cover follows the journal's lock: no upload while the project is locked.
// The early checks below are a courtesy to the caller; the authoritative checks are repeated in media-data's project-locked
// transaction immediately before the row is created.
const fail = (message: string, status: number, headers?: Record<string, string>) => NextResponse.json({ error: message }, { status, headers });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("That request did not come from this site.", 403);
  if (!uploadsEnabled()) return fail("Uploads are turned off.", 404);
  const viewer = await readViewer();
  if (!viewer) return fail("Sign in first.", 401);

  const limit = await checkLimit({ key: `journal-upload:${viewer.id}:minute`, ...UPLOAD_RATE });
  if (!limit.ok) return fail("Too many uploads. Wait a minute and try again.", 429, rateLimitHeaders(limit));

  const bytesIn = await readCappedBody(request).catch(() => undefined);
  if (bytesIn === null) return fail("Images can be up to 10 MB.", 413);
  if (bytesIn === undefined) return fail("That upload could not be read.", 400);
  let form: FormData;
  try {
    form = await parseMultipart(bytesIn, request.headers.get("content-type"));
  } catch {
    return fail("That upload could not be read.", 400);
  }
  const projectId = String(form.get("projectId") ?? "");
  const kind = form.get("kind");
  const file = form.get("file");
  if (!isMediaKind(kind)) return fail("Say whether this is a photo or a cover.", 400);
  if (!(file instanceof File)) return fail("Choose an image first.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return fail("Images can be up to 10 MB.", 413);

  const project = await db().project.findFirst({ where: { id: projectId, ownerId: viewer.id }, select: { id: true, status: true } });
  if (!project) return fail("That project was not found.", 404);
  if (!journalOpen(project.status)) return fail("This project is submitted, so its journal and cover can't change.", 409);

  const live = await db().journalMedia.count({ where: { projectId: project.id, deletedAt: null } });
  if (live >= MAX_MEDIA_PER_PROJECT) return fail("This project holds as many files as it can. Remove some first.", 409);

  let entryId: string | null = null;
  if (kind === "photo") {
    const rawEntry = String(form.get("entryId") ?? "");
    if (rawEntry) {
      const entry = await db().journalEntry.findFirst({
        where: { id: rawEntry, projectId: project.id, authorId: viewer.id, ...UNDECIDED_ENTRY },
        select: { id: true },
      });
      if (!entry) return fail("That entry was not found.", 404);
      entryId = entry.id;
    }
    // Six photos per entry. Photos not on an entry yet are staged per project, under a separate cap.
    const held = await db().journalMedia.count({ where: { projectId: project.id, kind: "photo", deletedAt: null, entryId } });
    if (entryId !== null && held >= MAX_PHOTOS_PER_ENTRY) return fail(`One entry holds up to ${MAX_PHOTOS_PER_ENTRY} photos.`, 409);
    if (entryId === null && held >= MAX_STAGED_PHOTOS_PER_PROJECT) return fail("Save your entry or remove a photo before adding more.", 409);
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = await processImage(bytes, kind);
    const row = await storeJournalMedia(image, { projectId: project.id, entryId, kind }, mediaWriteDeps());
    return NextResponse.json({ id: row.id, url: mediaUrl(row.id), width: row.width, height: row.height });
  } catch (error) {
    if (error instanceof MediaConflict) return fail(error.message, error.status);
    if (error instanceof UploadError) return fail(error.message, 415);
    return fail("The upload failed. Try again.", 500);
  }
}
