"use server";

// Server actions for the project journal. Same shape as profile-actions.ts: (previous state, FormData) -> FormState.
// A signed in, active builder is required. The owner check is part of every query. Hours are self-reported and stay "logged":
// nothing here approves hours or touches the Ore ledger. Approval is a review action.
// Form fields:
//   addJournalEntry     projectId, title, body, hours, photos (JSON [{id, alt}], optional), lapseUrl (Hardware only, optional)
//   updateJournalEntry  entryId, title, body, hours, photos, lapseUrl
// Photos are uploaded first (app/api/journal-media); saving the entry attaches them and stores their alt text. On an update the
// photos list is the whole truth: a photo the entry held that is not in the list is removed.
//   deleteJournalEntry  entryId
// Update and delete only touch an entry a reviewer has not decided (status "logged", nothing kept, no review action); any other
// answers "not found".
import { revalidatePath } from "next/cache";
import type { FormState } from "./actions";
import { db } from "./db";
import { checkJournalBody, checkJournalHours, checkJournalTitle, journalOpen } from "./journal";
import { checkLapseUrl, checkPhotoAlt, MAX_PHOTOS_PER_ENTRY } from "./journal-writer";
import { UNDECIDED_ENTRY } from "./media-limits";
import { removeImage } from "./media-store";
import { requireViewer } from "./session";

const text = (value: FormDataEntryValue | null): string => (typeof value === "string" ? value : "");
const error = (message: string, field?: string): FormState => ({ status: "error", message, field });
const NOT_FOUND = "That project was not found.";
const LOCKED = "This project is submitted, so its journal can't change. If a reviewer asks for changes, it opens again.";

function refresh(projectId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

type PhotoInput = { id: string; alt: string };
type Parsed<T> = { ok: true; value: T } | { ok: false; message: string; field?: string };

// The photos field: a JSON list of { id, alt }. Every alt is required. Empty or missing means no photos.
function parsePhotos(raw: FormDataEntryValue | null): Parsed<PhotoInput[]> {
  const textValue = typeof raw === "string" ? raw.trim() : "";
  if (!textValue) return { ok: true, value: [] };
  let list: unknown;
  try {
    list = JSON.parse(textValue);
  } catch {
    return { ok: false, message: "The photos could not be read. Reload the page and try again." };
  }
  if (!Array.isArray(list) || list.length > MAX_PHOTOS_PER_ENTRY) return { ok: false, message: `One entry holds up to ${MAX_PHOTOS_PER_ENTRY} photos.` };
  const out: PhotoInput[] = [];
  for (const item of list) {
    const id = typeof item?.id === "string" ? item.id : "";
    const alt = checkPhotoAlt(item?.alt);
    if (!id) return { ok: false, message: "The photos could not be read. Reload the page and try again." };
    if (!alt.ok) return { ok: false, message: alt.message, field: `alt-${id}` };
    out.push({ id, alt: alt.value });
  }
  return { ok: true, value: out };
}

// Attach the listed photos to the entry and store their alt text. Only the project's own live photos that are free or already on this entry.
async function attachPhotos(projectId: string, entryId: string, photos: PhotoInput[]) {
  for (const photo of photos) {
    await db().journalMedia.updateMany({
      where: { id: photo.id, projectId, kind: "photo", deletedAt: null, OR: [{ entryId: null }, { entryId }] },
      data: { entryId, alt: photo.alt },
    });
  }
}

// Soft-deletes the live photos on the entry that are not in keepIds, then removes their files (best effort).
async function dropOmittedPhotos(entryId: string, keepIds: string[]) {
  const omitted = await db().journalMedia.findMany({
    where: { entryId, kind: "photo", deletedAt: null, id: { notIn: keepIds } },
    select: { id: true, path: true },
  });
  if (omitted.length === 0) return;
  await db().journalMedia.updateMany({ where: { id: { in: omitted.map((row) => row.id) } }, data: { deletedAt: new Date() } });
  for (const row of omitted) await removeImage(row.path).catch(() => {});
}

export async function addJournalEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const projectId = text(formData.get("projectId"));
  const title = checkJournalTitle(formData.get("title"));
  if (!title.ok) return error(title.message, "title");
  const body = checkJournalBody(formData.get("body"));
  if (!body.ok) return error(body.message, "body");
  const hours = checkJournalHours(formData.get("hours"));
  if (!hours.ok) return error(hours.message, "hours");
  const photos = parsePhotos(formData.get("photos"));
  if (!photos.ok) return error(photos.message, photos.field);
  const lapse = checkLapseUrl(formData.get("lapseUrl"));
  if (!lapse.ok) return error(lapse.message, "lapseUrl");

  const project = await db().project.findFirst({ where: { id: projectId, ownerId: viewer.id }, select: { id: true, status: true, track: true } });
  if (!project) return error(NOT_FOUND);
  if (!journalOpen(project.status)) return error(LOCKED);

  const created = await db().journalEntry.create({
    data: {
      projectId: project.id,
      authorId: viewer.id,
      title: title.value,
      body: body.value,
      hours: hours.value,
      lapseUrl: project.track === "Hardware" ? lapse.value : null,
    },
    select: { id: true },
  });
  await attachPhotos(project.id, created.id, photos.value);
  refresh(project.id);
  return { status: "saved", message: "Entry added. Its hours count once a reviewer approves them.", href: `/dashboard/projects/${project.id}` };
}

export async function updateJournalEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const entryId = text(formData.get("entryId"));
  const title = checkJournalTitle(formData.get("title"));
  if (!title.ok) return error(title.message, "title");
  const body = checkJournalBody(formData.get("body"));
  if (!body.ok) return error(body.message, "body");
  const hours = checkJournalHours(formData.get("hours"));
  if (!hours.ok) return error(hours.message, "hours");
  const photos = parsePhotos(formData.get("photos"));
  if (!photos.ok) return error(photos.message, photos.field);
  const lapse = checkLapseUrl(formData.get("lapseUrl"));
  if (!lapse.ok) return error(lapse.message, "lapseUrl");

  const entry = await db().journalEntry.findFirst({
    where: { id: entryId, authorId: viewer.id, project: { ownerId: viewer.id }, ...UNDECIDED_ENTRY },
    select: { id: true, projectId: true, project: { select: { status: true, track: true } } },
  });
  if (!entry) return error("That entry was not found.");
  if (!journalOpen(entry.project.status)) return error(LOCKED);
  const saved = await db().journalEntry.updateMany({
    where: { id: entry.id, authorId: viewer.id, ...UNDECIDED_ENTRY },
    data: { title: title.value, body: body.value, hours: hours.value, lapseUrl: entry.project.track === "Hardware" ? lapse.value : null },
  });
  if (saved.count === 0) return error("That entry was not found.");
  await attachPhotos(entry.projectId, entry.id, photos.value);
  // The edit is authoritative: a photo the entry held that the form no longer lists is removed (record kept, file deleted).
  if (formData.has("photos")) await dropOmittedPhotos(entry.id, photos.value.map((photo) => photo.id));
  refresh(entry.projectId);
  return { status: "saved", message: "Entry saved.", href: `/dashboard/projects/${entry.projectId}` };
}

export async function deleteJournalEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const entryId = text(formData.get("entryId"));
  const entry = await db().journalEntry.findFirst({
    where: { id: entryId, authorId: viewer.id, project: { ownerId: viewer.id }, ...UNDECIDED_ENTRY },
    select: { id: true, projectId: true, project: { select: { status: true } } },
  });
  if (!entry) return error("That entry was not found.");
  if (!journalOpen(entry.project.status)) return error(LOCKED);
  // The rows go with the entry (cascade); the files are removed here.
  const files = await db().journalMedia.findMany({ where: { entryId: entry.id, deletedAt: null }, select: { path: true } });
  const removed = await db().journalEntry.deleteMany({ where: { id: entry.id, authorId: viewer.id, ...UNDECIDED_ENTRY } });
  if (removed.count === 0) return error("That entry was not found.");
  for (const file of files) await removeImage(file.path).catch(() => {});
  refresh(entry.projectId);
  return { status: "saved", message: "Entry deleted." };
}
