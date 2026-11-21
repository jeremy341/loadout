// Upload rules for journal photos and project covers. Pure: no file system, no database, no framework.
//
// API:
//   uploadsEnabled(env)       -> true only when LOADOUT_UPLOADS is "true". Off when unset (the default); .env.example turns it on locally.
//   MAX_UPLOAD_BYTES          10 MB
//   detectImageType(bytes)    -> "jpeg" | "png" | "webp" | null, from the first bytes of the file. The file name and the declared type are never trusted.
//   IMAGE_EXT / IMAGE_MIME    extension and content type per detected type
//   MEDIA_KINDS               "photo" | "cover"
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MEDIA_KINDS = ["photo", "cover"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];
export type ImageType = "jpeg" | "png" | "webp";
export const IMAGE_EXT: Record<ImageType, string> = { jpeg: "jpg", png: "png", webp: "webp" };
export const IMAGE_MIME: Record<ImageType, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export function uploadsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.LOADOUT_UPLOADS === "true";
}

export function isMediaKind(value: unknown): value is MediaKind {
  return typeof value === "string" && (MEDIA_KINDS as readonly string[]).includes(value);
}

const startsWith = (bytes: Uint8Array, signature: readonly number[], at = 0) => signature.every((byte, i) => bytes[at + i] === byte);

export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // RIFF....WEBP
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}
