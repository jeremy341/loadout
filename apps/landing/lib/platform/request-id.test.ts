import { describe, expect, test } from "bun:test";
import { logLine, redactFields, REQUEST_ID_HEADER, requestId } from "./request-id";

function request(id?: string) {
  return { headers: new Headers(id === undefined ? {} : { [REQUEST_ID_HEADER]: id }) };
}

describe("requestId", () => {
  test("reuses a valid incoming id", () => {
    expect(requestId(request("abc-123_XYZ"))).toBe("abc-123_XYZ");
  });

  test("accepts exactly 64 characters and rejects 65", () => {
    const sixtyFour = "a".repeat(64);
    expect(requestId(request(sixtyFour))).toBe(sixtyFour);
    const fresh = requestId(request("a".repeat(65)));
    expect(fresh).not.toBe("a".repeat(65));
    expect(fresh).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("makes a new id when the header is missing", () => {
    const id = requestId(request());
    expect(id.length).toBeGreaterThan(0);
    expect(id).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
  });

  test("replaces an id with characters outside the allowed set", () => {
    for (const bad of ["abc def", "abc.def", "abc/def", "<script>", "id;drop", "naïve"]) {
      const id = requestId(request(bad));
      expect(id).not.toBe(bad);
      expect(id).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    }
  });

  test("makes a different id on each call without a header", () => {
    expect(requestId(request())).not.toBe(requestId(request()));
  });
});

describe("redactFields", () => {
  test("drops keys named like credentials", () => {
    const out = redactFields({
      authorization: "Bearer x",
      Authorization: "Bearer y",
      apiToken: "t",
      sessionSecret: "s",
      password: "p",
      serviceKey: "k",
      status: 200,
    });
    expect(out).toEqual({ status: 200 });
  });

  test("drops secret-named keys inside nested objects and arrays", () => {
    const out = redactFields({
      request: { headers: { authorization: "Bearer x" }, path: "/api/v1/me" },
      rows: [{ token: "t", id: 1 }],
    });
    expect(out).toEqual({ request: { headers: {}, path: "/api/v1/me" }, rows: [{ id: 1 }] });
  });

  test("keeps dates and plain values", () => {
    const when = new Date(0);
    expect(redactFields({ when, n: 3, ok: true, none: null })).toEqual({ when, n: 3, ok: true, none: null });
  });
});

describe("logLine", () => {
  const NOW = Date.UTC(2026, 10, 18, 10, 0, 0);

  test("returns one line of JSON with the timestamp, request id and event", () => {
    const line = logLine("req-1", "api.me", { status: 200, durationMs: 12 }, NOW);
    expect(line).not.toContain("\n");
    expect(JSON.parse(line)).toEqual({
      ts: "2026-11-18T10:00:00.000Z",
      status: 200,
      durationMs: 12,
      requestId: "req-1",
      event: "api.me",
    });
  });

  test("never includes a credential-named key, even when the caller passes one", () => {
    const line = logLine("req-2", "api.me", {
      authorization: "Bearer abc",
      apiKey: "sk-123",
      token: "t",
      secret: "s",
      password: "p",
      nested: { keyPrefix: "lk_", ok: true },
    });
    const parsed = JSON.parse(line);
    expect(parsed.authorization).toBeUndefined();
    expect(parsed.apiKey).toBeUndefined();
    expect(parsed.token).toBeUndefined();
    expect(parsed.secret).toBeUndefined();
    expect(parsed.password).toBeUndefined();
    expect(parsed.nested).toEqual({ ok: true });
    expect(line).not.toContain("Bearer abc");
    expect(line).not.toContain("sk-123");
  });

  test("the request id and event win over same-named fields", () => {
    const parsed = JSON.parse(logLine("real", "real.event", { requestId: "fake", event: "fake" }, NOW));
    expect(parsed.requestId).toBe("real");
    expect(parsed.event).toBe("real.event");
  });

  test("works with no fields", () => {
    const parsed = JSON.parse(logLine("req-3", "api.health", undefined, NOW));
    expect(parsed).toEqual({ ts: "2026-11-18T10:00:00.000Z", requestId: "req-3", event: "api.health" });
  });
});
