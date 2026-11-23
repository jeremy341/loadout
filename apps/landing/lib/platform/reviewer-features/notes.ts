// Project notes: an internal, chat-style thread per project for reviewers. Never visible to builders. Pure rules only.
//
// API:
//   NOTE_MAX = 2000, NOTE_IMAGES_MAX = 4, NOTE_IMAGE_MAX_BYTES = 5 MB, NOTE_IMAGE_TYPES
//   checkNoteBody(raw)                     -> { ok: true, body } | { ok: false, message }
//   checkNoteImage({ type, bytes, count }) -> { ok: true } | { ok: false, message }
//   authorColour(authorId)                 -> one of NOTE_COLOURS, the same for the same author everywhere
import { cleanPlainText } from "./text";

export const NOTE_MAX = 2000;
export const NOTE_IMAGES_MAX = 4;
export const NOTE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const NOTE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const NOTE_COLOURS = ["#2b6cb0", "#2f855a", "#b7791f", "#9b2c2c", "#6b46c1", "#047481", "#b83280", "#4a5568"] as const;

export type NoteCheck = { ok: true; body: string } | { ok: false; message: string };

export function checkNoteBody(raw: unknown): NoteCheck {
  const body = cleanPlainText(raw, true);
  if (body.length === 0) return { ok: false, message: "A note needs some text." };
  if (body.length > NOTE_MAX) return { ok: false, message: `Keep a note under ${NOTE_MAX} characters.` };
  return { ok: true, body };
}

export type ImageCheck = { ok: true } | { ok: false; message: string };

const isNoteImageType = (type: string): boolean => (NOTE_IMAGE_TYPES as readonly string[]).includes(type);

function isNoteImageSizeOk(bytes: number): boolean {
  if (!Number.isFinite(bytes)) return false;
  return bytes > 0 && bytes <= NOTE_IMAGE_MAX_BYTES;
}

export function checkNoteImage(input: { type: string; bytes: number; count: number }): ImageCheck {
  if (!isNoteImageType(input.type)) return { ok: false, message: "Attach a PNG, JPEG or WebP image." };
  if (!isNoteImageSizeOk(input.bytes)) return { ok: false, message: "An image can be up to 5 MB." };
  if (input.count >= NOTE_IMAGES_MAX) return { ok: false, message: `A note holds up to ${NOTE_IMAGES_MAX} images.` };
  return { ok: true };
}

// FNV-1a over the author id, so the colour is stable without storing it.
export function authorColour(authorId: string): (typeof NOTE_COLOURS)[number] {
  let hash = 0x811c9dc5;
  for (let i = 0; i < authorId.length; i++) {
    hash ^= authorId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return NOTE_COLOURS[hash % NOTE_COLOURS.length];
}
