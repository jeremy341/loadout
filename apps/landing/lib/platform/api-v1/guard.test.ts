import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { LimitResult } from "../rate-limit-db";
import * as realRateLimit from "../rate-limit-db";
import * as realApiKeysData from "../api-keys-data";

// The guard's database-backed collaborators are replaced so we can observe the exact order of the IP limit and the key
// lookup, and the path written to the rejected-key audit. Everything else (headers, clientIp, auditPathOf) stays real.
const calls: string[] = [];
const rejected: Array<Record<string, unknown>> = [];
const checkLimit = mock(async (input: { key: string }): Promise<LimitResult> => {
  calls.push(`limit:${input.key}`);
  return realRateLimit.buildLimitResult({ count: 1, limit: 60, windowMs: 60_000, now: Date.now() });
});
const authenticateBearer = mock(async () => {
  calls.push("authenticate");
  return { ok: false, code: "invalid_key", status: 401, keyId: "k1", personId: "p1" } as const;
});
const recordKeyRejection = mock(async (entry: Record<string, unknown>) => {
  rejected.push(entry);
});

mock.module("../api-keys-data", () => ({ ...realApiKeysData, authenticateBearer, recordKeyRejection }));
mock.module("../rate-limit-db", () => ({ ...realRateLimit, checkLimit }));

afterAll(() => mock.restore());

const { apiError, apiRoute, clientIp, exportLimitKey, pickLimitHeaders, withHeaders } = await import("./guard");

function limit(over: Partial<LimitResult>): LimitResult {
  return {
    ok: true,
    limit: 60,
    remaining: 59,
    resetAt: new Date("2026-11-18T10:00:00.000Z"),
    resetSeconds: 30,
    retryAfterSeconds: 0,
    ...over,
  };
}

describe("clientIp", () => {
  const trusted = { LOADOUT_TRUST_PROXY: "true" };

  test("rotating x-forwarded-for does not change the key by default", () => {
    const keys = new Set(
      ["203.0.113.1", "203.0.113.2", "198.51.100.5, 203.0.113.3"].map((v) => clientIp(new Request("https://x.test/api/v1/me", { headers: { "x-forwarded-for": v } }), {})),
    );
    expect([...keys]).toEqual(["unknown"]);
  });

  test("behind a trusted proxy it takes the last hop, the one the proxy appended", () => {
    const request = new Request("https://x.test/api/v1/me", { headers: { "x-forwarded-for": "198.51.100.5, 203.0.113.9" } });
    expect(clientIp(request, trusted)).toBe("203.0.113.9");
  });

  test("accepts IPv6 text", () => {
    const request = new Request("https://x.test/", { headers: { "x-forwarded-for": "2001:db8::1" } });
    expect(clientIp(request, trusted)).toBe("2001:db8::1");
  });

  test("anything odd or missing is unknown, so a header cannot inject into a key", () => {
    expect(clientIp(new Request("https://x.test/"), trusted)).toBe("unknown");
    expect(clientIp(new Request("https://x.test/", { headers: { "x-forwarded-for": "a\"b" } }), trusted)).toBe("unknown");
    expect(clientIp(new Request("https://x.test/", { headers: { "x-forwarded-for": "x".repeat(70) } }), trusted)).toBe("unknown");
  });
});

describe("apiError", () => {
  test("an error body is exactly { error: { code, message } }", async () => {
    const response = apiError(403, "insufficient_scope", "No.");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: { code: "insufficient_scope", message: "No." } });
  });
});

describe("pickLimitHeaders", () => {
  test("empty list gives no headers", () => {
    expect(pickLimitHeaders([])).toEqual({});
  });

  test("the refused limit wins, with Retry-After", () => {
    const headers = pickLimitHeaders([
      limit({ remaining: 0 }),
      limit({ ok: false, limit: 5000, remaining: 0, retryAfterSeconds: 120, resetSeconds: 120 }),
    ]);
    expect(headers).toEqual({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "120",
      "Retry-After": "120",
    });
  });

  test("otherwise the limit with the fewest requests left, and no Retry-After", () => {
    const headers = pickLimitHeaders([limit({ limit: 5000, remaining: 4000 }), limit({ limit: 60, remaining: 12 })]);
    expect(headers["X-RateLimit-Limit"]).toBe("60");
    expect(headers["X-RateLimit-Remaining"]).toBe("12");
    expect(headers["Retry-After"]).toBeUndefined();
  });
});

describe("withHeaders", () => {
  test("sets each header on the response", () => {
    const response = withHeaders(new Response("x"), { "X-Request-Id": "abc", "X-RateLimit-Limit": "60" });
    expect(response.headers.get("x-request-id")).toBe("abc");
    expect(response.headers.get("x-ratelimit-limit")).toBe("60");
  });
});

describe("the /api/v1 guard order", () => {
  beforeEach(() => {
    calls.length = 0;
    rejected.length = 0;
    process.env.LOADOUT_TRUST_PROXY = "true";
    checkLimit.mockImplementation(async (input: { key: string }) => {
      calls.push(`limit:${input.key}`);
      return realRateLimit.buildLimitResult({ count: 1, limit: 60, windowMs: 60_000, now: Date.now() });
    });
    authenticateBearer.mockImplementation(async () => {
      calls.push("authenticate");
      return { ok: false, code: "invalid_key", status: 401, keyId: "k1", personId: "p1" } as const;
    });
  });

  test("a request with a bearer checks the per-IP limit before looking up the key", async () => {
    const route = apiRoute({}, async () => new Response("ok"));
    const request = new Request("https://x.test/api/v1/me", {
      headers: { authorization: "Bearer bad", "x-forwarded-for": "203.0.113.10" },
    });

    expect((await route(request)).status).toBe(401);
    expect(calls[0]).toBe("limit:api-ip:203.0.113.10:minute");
    expect(calls[1]).toBe("authenticate");
  });

  test("a request without a key also runs the per-IP limit first", async () => {
    const route = apiRoute({}, async () => new Response("ok"));
    const request = new Request("https://x.test/api/v1/me", { headers: { "x-forwarded-for": "203.0.113.12" } });

    expect((await route(request)).status).toBe(401);
    expect(calls).toEqual(["limit:api-ip:203.0.113.12:minute"]);
  });

  test("an over-limit IP is refused before any key lookup", async () => {
    checkLimit.mockImplementationOnce(async (input: { key: string }) => {
      calls.push(`limit:${input.key}`);
      const result = realRateLimit.buildLimitResult({ count: 99, limit: 20, windowMs: 60_000, now: Date.now() });
      return { ...result, ok: false, limit: 20, remaining: 0, retryAfterSeconds: result.resetSeconds };
    });
    const route = apiRoute({}, async () => new Response("ok"));
    const request = new Request("https://x.test/api/v1/me", {
      headers: { authorization: "Bearer bad", "x-forwarded-for": "203.0.113.13" },
    });

    const response = await route(request);
    expect(response.status).toBe(429);
    expect(calls).toEqual(["limit:api-ip:203.0.113.13:minute"]);
    expect(response.headers.get("retry-after")).not.toBeNull();
  });

  test("a rejected key is audited with a route pattern, never the raw path", async () => {
    const route = apiRoute({}, async () => new Response("ok"));
    const request = new Request("https://x.test/api/v1/projects/abc123/journal?token=secret", {
      headers: { authorization: "Bearer bad", "x-forwarded-for": "203.0.113.14" },
    });

    await route(request);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].path).toBe("/api/v1/*");
    expect(rejected[0].method).toBe("GET");
    expect(String(rejected[0].path)).not.toContain("abc123");
  });
});

describe("exportLimitKey", () => {
  test("one stable daily key per person, no matter which export route asks", () => {
    expect(exportLimitKey("p1")).toBe("export:p1:day");
    expect(exportLimitKey("p1")).toBe(exportLimitKey("p1"));
    expect(exportLimitKey("p2")).not.toBe(exportLimitKey("p1"));
  });

  test("the Settings download uses the shared key and audits the download", async () => {
    const text = await Bun.file(new URL("../../../app/(platform)/dashboard/(shell)/settings/export/route.ts", import.meta.url)).text();
    expect(text).toContain("exportLimitKey(viewer.id)");
    expect(text).not.toContain("export-ui:");
    expect(text).toContain('dataExportAudit(viewer.id, "settings"');
  });

  test("the API export audits a successful response through the guard", async () => {
    const text = await Bun.file(new URL("./guard.ts", import.meta.url)).text();
    expect(text).toContain("options.exportLimit && response.ok");
    expect(text).toContain('dataExportAudit(personId, "api"');
  });
});
