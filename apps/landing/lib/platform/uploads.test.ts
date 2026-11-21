import { describe, expect, test } from "bun:test";
import { detectImageType, isMediaKind, MAX_UPLOAD_BYTES, uploadsEnabled } from "./uploads";

const pad = (head: number[], total = 32) => Uint8Array.from([...head, ...new Array(Math.max(0, total - head.length)).fill(0)]);
const text = (value: string) => new TextEncoder().encode(value.padEnd(32, " "));

describe("detectImageType (magic bytes)", () => {
  test("accepts jpeg, png and webp", () => {
    expect(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(detectImageType(pad([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("webp");
  });
  test("rejects html, svg, a renamed text file, gif, and empty or short input", () => {
    expect(detectImageType(text("<!doctype html><html><body>x"))).toBeNull();
    expect(detectImageType(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(detectImageType(text("just some notes saved as photo.jpg"))).toBeNull();
    expect(detectImageType(text("GIF89a"))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
    expect(detectImageType(Uint8Array.from([0xff, 0xd8, 0xff]))).toBeNull();
  });
  test("a RIFF file that is not WebP is rejected", () => {
    expect(detectImageType(pad([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]))).toBeNull();
  });
});

test("the flag is off unless it is exactly true", () => {
  expect(uploadsEnabled({})).toBe(false);
  expect(uploadsEnabled({ LOADOUT_UPLOADS: "false" })).toBe(false);
  expect(uploadsEnabled({ LOADOUT_UPLOADS: "1" })).toBe(false);
  expect(uploadsEnabled({ LOADOUT_UPLOADS: "true" })).toBe(true);
});

test("limits and kinds", () => {
  expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  expect(isMediaKind("photo")).toBe(true);
  expect(isMediaKind("cover")).toBe(true);
  expect(isMediaKind("video")).toBe(false);
});
