// Upload safety checks that run on the bytes before anything is stored. Pure: no file system, no sharp, no database.
//
// What it does:
//   1. Magic bytes decide the type. The file name and the declared MIME type are never trusted. Only PNG, JPEG and WebP pass, so
//      nothing exotic (SVG, GIF, PDF, HTML) is handed to a decoder.
//   2. Metadata scan. EXIF (and GPS inside it), XMP, text chunks and JPEG comments are listed. Finding metadata is not a refusal:
//      the caller re-encodes the image, which drops metadata (media-store.ts does this with sharp), so the scan is evidence, not a gate.
//
// It reads the container structure only. It does not decode pixels.

export const IMAGE_SAFETY_MAX_BYTES = 10 * 1024 * 1024;

export type ImageKind = "png" | "jpeg" | "webp";
export type MetadataFinding = "exif" | "gps" | "xmp" | "text" | "comment";

export type ImageSafety =
  | { ok: true; type: ImageKind; metadata: MetadataFinding[]; action: "none" | "strip-on-reencode" }
  | { ok: false; reason: "empty" | "too-large" | "unknown-type" };

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const XMP_JPEG_ID = "http://ns.adobe.com/xap/1.0/\0";

const at = (bytes: Uint8Array, i: number): number => (i >= 0 && i < bytes.length ? bytes[i] : 0);
const ascii = (bytes: Uint8Array, from: number, to: number): string => {
  let out = "";
  for (let i = from; i < to && i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
  return out;
};

export function sniffImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 8 && PNG_MAGIC.every((b, i) => bytes[i] === b)) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "webp";
  return null;
}

// Reads one unsigned value from a TIFF block in the given byte order.
function readU16(bytes: Uint8Array, at0: number, little: boolean): number {
  return little ? at(bytes, at0) | (at(bytes, at0 + 1) << 8) : (at(bytes, at0) << 8) | at(bytes, at0 + 1);
}
function readU32(bytes: Uint8Array, at0: number, little: boolean): number {
  const b = [0, 1, 2, 3].map((k) => at(bytes, at0 + (little ? k : 3 - k)));
  return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}

// The GPS pointer (tag 0x8825) sits in IFD0 of the Exif TIFF block. Checking only IFD0 is enough for the cameras and phones that
// write GPS data; a file that hides it deeper still counts as EXIF, and the re-encode removes it anyway.
function exifHasGps(exif: Uint8Array, tiffStart: number): boolean {
  const order = ascii(exif, tiffStart, tiffStart + 2);
  const little = order === "II";
  if (!little && order !== "MM") return false;
  const ifd0 = tiffStart + readU32(exif, tiffStart + 4, little);
  if (ifd0 <= tiffStart || ifd0 + 2 > exif.length) return false;
  const count = readU16(exif, ifd0, little);
  for (let n = 0; n < count; n += 1) {
    const entry = ifd0 + 2 + n * 12;
    if (entry + 12 > exif.length) break;
    if (readU16(exif, entry, little) === 0x8825) return true;
  }
  return false;
}

function scanJpeg(bytes: Uint8Array, found: Set<MetadataFinding>): void {
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return;
    const marker = bytes[i + 1];
    if (marker === 0xd9 || marker === 0xda) return; // end of image or start of scan: metadata lives before these
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0xff) {
      i += marker === 0xff ? 1 : 2;
      continue;
    }
    const length = (at(bytes, i + 2) << 8) | at(bytes, i + 3);
    if (length < 2) return;
    const dataStart = i + 4;
    const dataEnd = Math.min(i + 2 + length, bytes.length);
    if (marker === 0xe1) {
      const head = ascii(bytes, dataStart, dataStart + 6);
      if (head === "Exif\0\0") {
        found.add("exif");
        if (exifHasGps(bytes.subarray(dataStart, dataEnd), dataStart + 6 - dataStart)) found.add("gps");
      } else if (ascii(bytes, dataStart, dataStart + XMP_JPEG_ID.length) === XMP_JPEG_ID) {
        found.add("xmp");
      }
    } else if (marker === 0xfe) {
      found.add("comment");
    }
    i += 2 + length;
  }
}

function scanPng(bytes: Uint8Array, found: Set<MetadataFinding>): void {
  let i = 8;
  while (i + 8 <= bytes.length) {
    const size = readU32(bytes, i, false);
    const type = ascii(bytes, i + 4, i + 8);
    const data = i + 8;
    if (type === "IEND") return;
    if (type === "eXIf") found.add("exif");
    if (type === "tEXt" || type === "zTXt" || type === "iTXt") {
      const keyword = ascii(bytes, data, Math.min(data + 80, data + size));
      if (keyword.startsWith("XML:com.adobe.xmp")) found.add("xmp");
      else if (keyword.startsWith("Raw profile type exif")) found.add("exif");
      else found.add("text");
    }
    if (size > bytes.length) return;
    i = data + size + 4; // skip the data and its CRC
  }
}

function scanWebp(bytes: Uint8Array, found: Set<MetadataFinding>): void {
  let i = 12;
  while (i + 8 <= bytes.length) {
    const fourcc = ascii(bytes, i, i + 4);
    const size = readU32(bytes, i + 4, true);
    if (fourcc === "EXIF") found.add("exif");
    if (fourcc === "XMP ") found.add("xmp");
    if (size > bytes.length) return;
    i += 8 + size + (size % 2);
  }
}

export function checkImageSafety(bytes: Uint8Array): ImageSafety {
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > IMAGE_SAFETY_MAX_BYTES) return { ok: false, reason: "too-large" };
  const type = sniffImageKind(bytes);
  if (!type) return { ok: false, reason: "unknown-type" };
  const found = new Set<MetadataFinding>();
  try {
    if (type === "jpeg") scanJpeg(bytes, found);
    else if (type === "png") scanPng(bytes, found);
    else scanWebp(bytes, found);
  } catch {
    // A truncated or odd container is not an error for the type check; the scan just reports what it read.
  }
  const metadata = [...found].sort();
  return { ok: true, type, metadata, action: metadata.length > 0 ? "strip-on-reencode" : "none" };
}
