import { describe, expect, test } from "bun:test";
import { PLACEHOLDER_ADAPTERS, PLACEHOLDER_IDS, placeholderStatuses } from "./placeholders";
import { PROVISIONAL_LABEL, formatProvisional, isFinal, provisional } from "./provisional";
import { requestExternalAiDraft } from "./external-ai";
import { fraudyStatus } from "./fraudy-status";
import { signWebhook, verifyWebhook, WEBHOOK_TOLERANCE_SECONDS } from "./webhook-signature";
import { checkImageSafety, sniffImageKind } from "./image-safety";

const SECRET = "0123456789abcdef-secret";
const NOW = new Date("2026-11-22T12:00:00Z");
const ts = String(Math.floor(NOW.getTime() / 1000));
const body = '{"event":"outcome.set"}';

describe("placeholder adapters", () => {
  test("every placeholder answers not connected with no live data", async () => {
    for (const id of PLACEHOLDER_IDS) {
      const result = await PLACEHOLDER_ADAPTERS[id].read();
      expect(result.ok).toBe(false);
      expect(result.state).toBe("not_connected");
      expect(result.live).toBe(false);
      expect(result.message).toContain("not connected");
    }
  });
  test("status lines cover all five services in a fixed order", async () => {
    const lines = await placeholderStatuses();
    expect(lines.map((l) => l.id)).toEqual(["airtable", "unified-database", "ships", "airbridge", "hcb"]);
    expect(lines.every((l) => l.state === "not_connected" && l.live === false)).toBe(true);
  });
});

describe("provisional values", () => {
  test("a working value is labelled and never final", () => {
    const price = provisional("price", 5, "owner working value");
    expect(price.provisional).toBe(true);
    expect(price.label).toBe(PROVISIONAL_LABEL);
    expect(isFinal(price)).toBe(false);
    expect(formatProvisional({ ...price, value: "5.00" })).toBe("5.00 (Provisional, not confirmed: owner working value)");
  });
  test("only an explicit provisional:false counts as final", () => {
    expect(isFinal({ provisional: false })).toBe(true);
    expect(isFinal({})).toBe(false);
    expect(isFinal(null)).toBe(false);
  });
  test("a blank source falls back to unspecified", () => {
    expect(provisional("dates", "2027-01-01", "  ").source).toBe("unspecified");
  });
});

describe("webhook signature", () => {
  test("a correctly signed, fresh request verifies", () => {
    const signature = signWebhook(SECRET, ts, body);
    expect(verifyWebhook({ secret: SECRET, timestamp: ts, signature, rawBody: body, now: NOW })).toEqual({ ok: true });
  });
  test("a changed body fails", () => {
    const signature = signWebhook(SECRET, ts, body);
    expect(verifyWebhook({ secret: SECRET, timestamp: ts, signature, rawBody: body + " ", now: NOW })).toEqual({ ok: false, reason: "mismatch" });
  });
  test("a wrong secret fails", () => {
    const signature = signWebhook("another-secret-value-here", ts, body);
    expect(verifyWebhook({ secret: SECRET, timestamp: ts, signature, rawBody: body, now: NOW })).toEqual({ ok: false, reason: "mismatch" });
  });
  test("a replayed request outside the tolerance is refused", () => {
    const old = String(Math.floor(NOW.getTime() / 1000) - WEBHOOK_TOLERANCE_SECONDS - 1);
    const signature = signWebhook(SECRET, old, body);
    expect(verifyWebhook({ secret: SECRET, timestamp: old, signature, rawBody: body, now: NOW })).toEqual({ ok: false, reason: "stale" });
  });
  test("an unset or short secret means not configured, never accepted", () => {
    const signature = signWebhook("x", ts, body);
    expect(verifyWebhook({ secret: undefined, timestamp: ts, signature, rawBody: body, now: NOW })).toEqual({ ok: false, reason: "not_configured" });
    expect(verifyWebhook({ secret: "short", timestamp: ts, signature, rawBody: body, now: NOW })).toEqual({ ok: false, reason: "not_configured" });
  });
  test("missing or malformed headers are refused", () => {
    expect(verifyWebhook({ secret: SECRET, timestamp: null, signature: "sha256=00", rawBody: body, now: NOW })).toEqual({ ok: false, reason: "missing" });
    expect(verifyWebhook({ secret: SECRET, timestamp: "abc", signature: "sha256=" + "0".repeat(64), rawBody: body, now: NOW })).toEqual({ ok: false, reason: "malformed" });
  });
});

// Image safety tests build small containers byte by byte, so the scanner runs on real structure.
const u32be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u32le = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const chunk = (type: string, data: number[]) => [...u32be(data.length), ...ascii(type), ...data, 0, 0, 0, 0];

function png(...chunks: number[][]) {
  return new Uint8Array([...PNG_SIG, ...chunk("IHDR", new Array(13).fill(0)), ...chunks.flat(), ...chunk("IEND", [])]);
}

// A JPEG whose APP1 Exif block has an IFD0 entry for the GPS pointer (tag 0x8825), big-endian TIFF.
function jpegWithGps(): Uint8Array {
  const tiff = [...ascii("MM"), 0, 0x2a, ...u32be(8), 0, 1, 0x88, 0x25, 0, 4, ...u32be(1), ...u32be(0), ...u32be(0)];
  const data = [...ascii("Exif\0\0"), ...tiff];
  const length = data.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, length >> 8, length & 255, ...data, 0xff, 0xd9]);
}

describe("image safety", () => {
  test("magic bytes decide the type, not the name", () => {
    expect(sniffImageKind(png())).toBe("png");
    expect(sniffImageKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("jpeg");
    expect(sniffImageKind(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniffImageKind(new TextEncoder().encode("GIF89a........"))).toBeNull();
  });
  test("SVG, GIF and empty files are refused", () => {
    expect(checkImageSafety(new TextEncoder().encode("<svg></svg>"))).toEqual({ ok: false, reason: "unknown-type" });
    expect(checkImageSafety(new TextEncoder().encode("GIF89a........"))).toEqual({ ok: false, reason: "unknown-type" });
    expect(checkImageSafety(new Uint8Array())).toEqual({ ok: false, reason: "empty" });
  });
  test("a clean PNG reports no metadata", () => {
    expect(checkImageSafety(png())).toEqual({ ok: true, type: "png", metadata: [], action: "none" });
  });
  test("a PNG with an eXIf chunk and an XMP text chunk is flagged for stripping", () => {
    const xmp = ascii("XML:com.adobe.xmp\0\0\0\0\0");
    const result = checkImageSafety(png(chunk("eXIf", [1, 2, 3]), chunk("iTXt", xmp)));
    expect(result).toEqual({ ok: true, type: "png", metadata: ["exif", "xmp"], action: "strip-on-reencode" });
  });
  test("a JPEG with a GPS pointer reports exif and gps", () => {
    expect(checkImageSafety(jpegWithGps())).toEqual({ ok: true, type: "jpeg", metadata: ["exif", "gps"], action: "strip-on-reencode" });
  });
  test("a WebP with an EXIF chunk reports exif", () => {
    const payload = [...ascii("WEBP"), ...ascii("EXIF"), ...u32le(4), 1, 2, 3, 4];
    const file = new Uint8Array([...ascii("RIFF"), ...u32le(payload.length), ...payload]);
    expect(checkImageSafety(file)).toEqual({ ok: true, type: "webp", metadata: ["exif"], action: "strip-on-reencode" });
  });
  test("a truncated file does not throw", () => {
    expect(checkImageSafety(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 40, 1]))).toMatchObject({ ok: true, type: "jpeg" });
  });
});

describe("external AI and Fraudy status", () => {
  test("the external AI adapter sends nothing and says so", async () => {
    expect(await requestExternalAiDraft("prompt")).toMatchObject({ ok: false, state: "not_connected", live: false });
  });
  test("Fraudy reads not connected without a key, and never claims a live answer", () => {
    expect(fraudyStatus({}).state).toBe("not_connected");
    expect(fraudyStatus({ LOADOUT_FRAUDY_KEY: "k" }).state).toBe("configured_unverified");
  });
});
