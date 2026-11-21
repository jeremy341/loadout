import { describe, expect, test } from "bun:test";
import { POST } from "../../app/api/journal-media/route";
import { DELETE } from "../../app/api/journal-media/[id]/route";
import { checkMediaWrite, MAX_BODY_BYTES, MAX_MEDIA_PER_PROJECT, MAX_STAGED_PHOTOS_PER_PROJECT, parseMultipart, readCappedBody, UNDECIDED_ENTRY } from "./media-limits";
import { MAX_PHOTOS_PER_ENTRY } from "./journal-writer";
import { sameOrigin } from "./same-origin";

const post = (body: BodyInit, headers: Record<string, string> = {}) =>
  new Request("https://loadout.example/api/journal-media", { method: "POST", body, headers });

describe("readCappedBody", () => {
  test("returns the bytes of a small body", async () => {
    const bytes = await readCappedBody(post("hello"), 100);
    expect(new TextDecoder().decode(bytes!)).toBe("hello");
  });

  test("refuses a declared length over the cap without reading", async () => {
    const request = post("x", { "content-length": String(MAX_BODY_BYTES + 1) });
    expect(await readCappedBody(request)).toBeNull();
  });

  test("refuses a body that is bigger than it declared", async () => {
    expect(await readCappedBody(post("0123456789"), 5)).toBeNull();
  });

  test("a multipart body round trips", async () => {
    const form = new FormData();
    form.set("projectId", "p1");
    form.set("file", new File([new Uint8Array(32)], "a.png", { type: "image/png" }));
    const request = post(form);
    const bytes = await readCappedBody(request);
    const parsed = await parseMultipart(bytes!, request.headers.get("content-type"));
    expect(parsed.get("projectId")).toBe("p1");
    expect((parsed.get("file") as File).size).toBe(32);
  });
});

describe("UNDECIDED_ENTRY", () => {
  test("only a plain logged entry with nothing kept", () => {
    expect(UNDECIDED_ENTRY).toEqual({ status: "logged", keptMinutes: null, reviewAction: null });
  });
});

describe("checkMediaWrite", () => {
  const input = (over: Record<string, unknown> = {}) => ({ status: "draft", live: 0, held: 0, kind: "photo" as const, entryId: null, ...over });

  test("allows a draft below every cap", () => {
    expect(checkMediaWrite(input())).toEqual({ ok: true });
  });

  test("refuses a project whose journal has since locked", () => {
    const out = checkMediaWrite(input({ status: "submitted" }));
    expect(out).toEqual({ ok: false, status: 409, message: "This project is submitted, so its journal and cover can't change." });
  });

  test("refuses a project at the live media cap", () => {
    const out = checkMediaWrite(input({ live: MAX_MEDIA_PER_PROJECT }));
    expect(out).toEqual({ ok: false, status: 409, message: "This project holds as many files as it can. Remove some first." });
  });

  test("refuses an entry at its photo cap and staged photos at the staged cap", () => {
    expect(checkMediaWrite(input({ held: MAX_PHOTOS_PER_ENTRY, entryId: "e1" }))).toEqual({
      ok: false,
      status: 409,
      message: `One entry holds up to ${MAX_PHOTOS_PER_ENTRY} photos.`,
    });
    expect(checkMediaWrite(input({ held: MAX_STAGED_PHOTOS_PER_PROJECT }))).toEqual({
      ok: false,
      status: 409,
      message: "Save your entry or remove a photo before adding more.",
    });
  });

  test("a cover ignores the per-entry and staged photo caps", () => {
    expect(checkMediaWrite(input({ kind: "cover", held: 999, entryId: "e1" }))).toEqual({ ok: true });
  });
});

describe("sameOrigin", () => {
  const withHeaders = (headers: Record<string, string>) => new Request("https://loadout.example/api/auth/signout", { method: "POST", headers });
  test("accepts the same host through Origin or Referer", () => {
    expect(sameOrigin(withHeaders({ origin: "https://loadout.example" }))).toBe(true);
    expect(sameOrigin(withHeaders({ referer: "https://loadout.example/dashboard" }))).toBe(true);
  });
  test("refuses another host, a missing header and a null origin", () => {
    expect(sameOrigin(withHeaders({ origin: "https://evil.example" }))).toBe(false);
    expect(sameOrigin(withHeaders({ origin: "https://loadout.example.evil.example" }))).toBe(false);
    expect(sameOrigin(withHeaders({}))).toBe(false);
    expect(sameOrigin(withHeaders({ origin: "null" }))).toBe(false);
  });
});

describe("journal-media origin guard", () => {
  test("POST and DELETE refuse a cross-origin request before doing any work", async () => {
    const previous = process.env.LOADOUT_UPLOADS;
    try {
      process.env.LOADOUT_UPLOADS = "true";
      const posted = await POST(new Request("https://loadout.example/api/journal-media", { method: "POST", headers: { origin: "https://evil.example" } }));
      expect(posted.status).toBe(403);
      const deleted = await DELETE(new Request("https://loadout.example/api/journal-media/m1", { method: "DELETE", headers: { origin: "https://evil.example" } }), {
        params: Promise.resolve({ id: "m1" }),
      });
      expect(deleted.status).toBe(403);
    } finally {
      if (previous === undefined) delete process.env.LOADOUT_UPLOADS;
      else process.env.LOADOUT_UPLOADS = previous;
    }
  });
});
