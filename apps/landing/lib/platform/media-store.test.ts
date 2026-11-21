import { describe, expect, test } from "bun:test";
import { processImage, UploadError } from "./media-store";
import { loadSharp } from "./sharp-loader";

// sharp is not a declared dependency of this app (it comes with Next as an optional package). If it cannot be loaded here the
// tests are skipped, and the upload route answers with a plain refusal instead of storing anything.
const sharp = await loadSharp().catch(() => null);

const jpegWithExif = () =>
  sharp!({ create: { width: 64, height: 48, channels: 3, background: "#c33" } })
    .withExif({ IFD0: { Copyright: "secret-owner", Artist: "someone" } })
    .jpeg()
    .toBuffer();

describe.skipIf(!sharp)("processImage", () => {
  test("re-encodes a JPEG and drops its EXIF", async () => {
    const input = await jpegWithExif();
    expect((await sharp!(input).metadata()).exif).toBeDefined();
    const out = await processImage(input, "photo");
    expect(out.type).toBe("jpeg");
    expect(out.width).toBe(64);
    expect((await sharp!(out.bytes).metadata()).exif).toBeUndefined();
    expect(out.bytes.includes(Buffer.from("secret-owner"))).toBe(false);
  });

  test("crops a cover to 16:9", async () => {
    const out = await processImage(await jpegWithExif(), "cover");
    expect(out.width / out.height).toBeCloseTo(16 / 9, 2);
  });

  test("rejects text renamed as an image, html, svg, and PNG bytes with nothing behind them", async () => {
    const text = new TextEncoder();
    for (const bad of [text.encode("not an image at all, just words"), text.encode("<!doctype html><p>hi</p>"), text.encode('<svg xmlns="http://www.w3.org/2000/svg"/>')]) {
      await expect(processImage(bad, "photo")).rejects.toBeInstanceOf(UploadError);
    }
    const fakePng = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
    await expect(processImage(fakePng, "photo")).rejects.toBeInstanceOf(UploadError);
  });

  test("rejects a file over 10 MB and an empty file", async () => {
    await expect(processImage(new Uint8Array(10 * 1024 * 1024 + 1), "photo")).rejects.toBeInstanceOf(UploadError);
    await expect(processImage(new Uint8Array(), "photo")).rejects.toBeInstanceOf(UploadError);
  });
});
