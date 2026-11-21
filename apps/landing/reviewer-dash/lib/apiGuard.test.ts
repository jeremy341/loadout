import { describe, expect, test } from "bun:test";
import { noStore, notFoundJson } from "./apiGuard";

describe("noStore", () => {
  test("marks a reviewer response private, no-store and varying on the cookie", () => {
    const response = noStore(Response.json({ ok: true }));
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toContain("Cookie");
  });

  test("overwrites a cacheable response instead of leaving it shareable", () => {
    const response = noStore(new Response("ok", { headers: { "Cache-Control": "public, max-age=60" } }));
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toContain("Cookie");
  });

  test("is idempotent and keeps an existing Vary value without duplicating Cookie", () => {
    const once = noStore(new Response("ok", { headers: { Vary: "Accept-Encoding" } }));
    expect(once.headers.get("vary")).toContain("Accept-Encoding");
    expect(once.headers.get("vary")).toContain("Cookie");
    const twice = noStore(once);
    expect(twice.headers.get("cache-control")).toBe("private, no-store");
    expect(twice.headers.get("vary")?.match(/cookie/gi)).toHaveLength(1);
  });
});

describe("notFoundJson", () => {
  test("is a private 404 that is never cached", async () => {
    const response = notFoundJson();
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toContain("Cookie");
    expect(await response.json()).toEqual({ error: "not_found" });
  });
});
