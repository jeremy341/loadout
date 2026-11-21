// The local media store for journal photos and covers. Server only. Bytes go under .uploads/ at the app root (git ignored; or
// LOADOUT_UPLOAD_DIR). The record is a JournalMedia row. Every image is decoded and written out again with sharp, which drops all
// metadata (EXIF, GPS, camera data) because nothing is copied across. An S3 compatible store replaces this file later; the
// callers only use saveImage, readImage and removeImage.
//
//   processImage(bytes, kind) -> { bytes, type, width, height }   throws UploadError with a plain message
//   saveImage(file)           -> { path, ... }                    path is relative to the store root
//   readImage(path)           -> Buffer | null
//   removeImage(path)         -> deletes the file, ignores a missing one
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadSharp } from "./sharp-loader";
import { detectImageType, IMAGE_EXT, MAX_UPLOAD_BYTES, type ImageType, type MediaKind } from "./uploads";

export class UploadError extends Error {}

const MAX_SIDE = 2400;
// Decoded pixels allowed per image (about 24 megapixels; a 6000 x 4000 photo fits).
const MAX_INPUT_PIXELS = 24_000_000;
export const COVER_SIZE = { width: 1280, height: 720 } as const;

export function storeRoot(): string {
  return path.resolve(process.env.LOADOUT_UPLOAD_DIR || path.join(process.cwd(), ".uploads"));
}

// A stored path is "<projectId>/<id>.<ext>" and nothing else, so it can never leave the store root.
const STORED = /^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(jpg|png|webp)$/;
function resolveStored(stored: string): string | null {
  if (!STORED.test(stored)) return null;
  const root = storeRoot();
  const full = path.resolve(root, stored);
  return full.startsWith(root + path.sep) ? full : null;
}

async function sharpOrRefuse() {
  try {
    return await loadSharp();
  } catch {
    throw new UploadError("Image processing is not available on this server, so nothing was stored.");
  }
}

export async function processImage(input: Uint8Array, kind: MediaKind): Promise<{ bytes: Buffer; type: ImageType; width: number; height: number }> {
  if (input.byteLength === 0) throw new UploadError("That file is empty.");
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new UploadError("Images can be up to 10 MB.");
  const type = detectImageType(input);
  if (!type) throw new UploadError("Use a JPEG, PNG or WebP image.");
  const sharp = await sharpOrRefuse();
  try {
    // One sharp instance: the header is read for the format check, then the same input is decoded once for the re-encode.
    const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" });
    const meta = await base.metadata();
    // The decoder must agree with the first bytes.
    if (meta.format !== type) throw new UploadError("That file is not the image type it claims to be.");
    if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_INPUT_PIXELS) throw new UploadError("That image is too large. Try one under 24 megapixels.");
    let pipeline = base.rotate();
    pipeline =
      kind === "cover"
        ? pipeline.resize(COVER_SIZE.width, COVER_SIZE.height, { fit: "cover", position: "centre" })
        : pipeline.resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true });
    // No withMetadata(): the output carries no EXIF, GPS or colour profile from the original.
    pipeline = type === "jpeg" ? pipeline.jpeg({ quality: 85, mozjpeg: true }) : type === "png" ? pipeline.png() : pipeline.webp({ quality: 85 });
    const out = await pipeline.toBuffer({ resolveWithObject: true });
    return { bytes: out.data, type, width: out.info.width, height: out.info.height };
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError("That image could not be read. Try another file.");
  }
}

export async function saveImage(projectId: string, bytes: Buffer, type: ImageType): Promise<string> {
  const stored = `${projectId}/${randomBytes(12).toString("base64url")}.${IMAGE_EXT[type]}`;
  const full = resolveStored(stored);
  if (!full) throw new UploadError("That project can't hold files.");
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return stored;
}

export async function readImage(stored: string): Promise<Buffer | null> {
  const full = resolveStored(stored);
  if (!full) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

export async function removeImage(stored: string): Promise<void> {
  const full = resolveStored(stored);
  if (full) await rm(full, { force: true });
}
