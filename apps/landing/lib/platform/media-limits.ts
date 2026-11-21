// Limits and small guards for journal media uploads. Pure: no database, no framework (a Request is only read).
//
// API:
//   MAX_STAGED_PHOTOS_PER_PROJECT   photos uploaded but not yet saved with an entry, per project
//   MAX_MEDIA_PER_PROJECT           live media rows (photos and cover) per project
//   UPLOAD_RATE                     { limit, windowMs } for uploads per viewer
//   MAX_BODY_BYTES                  the biggest multipart body accepted (the file plus a little for the other fields)
//   readCappedBody(request, max)    -> Uint8Array | null   null when the body is bigger than max; stops reading as soon as it is
//   parseMultipart(bytes, contentType) -> Promise<FormData>
//   UNDECIDED_ENTRY                 Prisma where fragment: an entry a reviewer has not decided (status logged, nothing kept)
//   checkMediaWrite(input)          the status and cap decision repeated inside the upload transaction, before the row is created
import { journalOpen } from "./journal";
import { MAX_PHOTOS_PER_ENTRY } from "./journal-writer";
import { MAX_UPLOAD_BYTES, type MediaKind } from "./uploads";

export const MAX_STAGED_PHOTOS_PER_PROJECT = 12;
export const MAX_MEDIA_PER_PROJECT = 150;
export const UPLOAD_RATE = { limit: 20, windowMs: 60_000 } as const;
export const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

// An entry is the builder's to change only while it is plain "logged": no approval, no kept minutes, no review action.
export const UNDECIDED_ENTRY = { status: "logged", keptMinutes: null, reviewAction: null } as const;

// Messages shared by the early route checks and the transaction re-check, so both refuse for the same reason.
export const LOCKED_MESSAGE = "This project is submitted, so its journal and cover can't change.";
export const MEDIA_CAP_MESSAGE = "This project holds as many files as it can. Remove some first.";
export const STAGED_PHOTOS_MESSAGE = "Save your entry or remove a photo before adding more.";
export const entryPhotosMessage = () => `One entry holds up to ${MAX_PHOTOS_PER_ENTRY} photos.`;

export type MediaWriteCheck = { ok: true } | { ok: false; status: number; message: string };

// The decision repeated inside the write transaction, immediately before create. The caller supplies freshly read values; a
// project that vanished (or has an unknown status) fails closed, like journalOpen does.
export function checkMediaWrite(input: { status: string; live: number; held: number; kind: MediaKind; entryId: string | null }): MediaWriteCheck {
  if (!journalOpen(input.status)) return { ok: false, status: 409, message: LOCKED_MESSAGE };
  if (input.live >= MAX_MEDIA_PER_PROJECT) return { ok: false, status: 409, message: MEDIA_CAP_MESSAGE };
  if (input.kind === "photo") {
    if (input.entryId !== null && input.held >= MAX_PHOTOS_PER_ENTRY) return { ok: false, status: 409, message: entryPhotosMessage() };
    if (input.entryId === null && input.held >= MAX_STAGED_PHOTOS_PER_PROJECT) return { ok: false, status: 409, message: STAGED_PHOTOS_MESSAGE };
  }
  return { ok: true };
}

// The declared length is a quick refusal; the stream count is the real limit, because the header can be missing or wrong.
export async function readCappedBody(request: Request, max: number = MAX_BODY_BYTES): Promise<Uint8Array | null> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const n = Number(declared);
    if (!Number.isFinite(n) || n < 0 || n > max) return null;
  }
  const body = request.body;
  if (!body) return new Uint8Array(0);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.byteLength;
  }
  return out;
}

export function parseMultipart(bytes: Uint8Array, contentType: string | null): Promise<FormData> {
  return new Response(bytes as BodyInit, { headers: contentType ? { "content-type": contentType } : {} }).formData();
}
