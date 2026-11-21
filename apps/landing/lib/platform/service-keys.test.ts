import { describe, expect, test } from "bun:test";
import { createRateLimiter } from "./rate-limit";
import {
  auditPathOf,
  MIN_SERVICE_KEY_LENGTH,
  matchServiceKey,
  requireServiceKey,
  SERVICE_KEY_HEADER,
  type RejectedServiceKey,
} from "./service-keys";

const REVIEWER_KEY = "r".repeat(40);
const SLACK_KEY = "s".repeat(40);
const STATS_KEY = "t".repeat(40);
const env = {
  SERVICE_KEY_REVIEWER: REVIEWER_KEY,
  SERVICE_KEY_SLACK_BOT: SLACK_KEY,
  SERVICE_KEY_STATS_JOB: STATS_KEY,
};

// Most tests are about the answer, not the audit throttle, so each call gets a limiter that never trips.
const guard: typeof requireServiceKey = (req, allowed, options = {}) =>
  requireServiceKey(req, allowed, { throttle: createRateLimiter({ limit: 1000, windowMs: 60_000 }), ...options });

function request(headers: Record<string, string> = {}, url = "https://loadout.test/api/v1/me") {
  return { headers: new Headers(headers), method: "GET", url };
}

describe("matchServiceKey", () => {
  test("returns the service that owns each key", () => {
    expect(matchServiceKey(REVIEWER_KEY, env)).toBe("reviewer");
    expect(matchServiceKey(SLACK_KEY, env)).toBe("slack-bot");
    expect(matchServiceKey(STATS_KEY, env)).toBe("stats-job");
  });

  test("rejects an empty, unknown or near-miss key", () => {
    expect(matchServiceKey("", env)).toBeNull();
    expect(matchServiceKey("q".repeat(40), env)).toBeNull();
    expect(matchServiceKey(REVIEWER_KEY.slice(1), env)).toBeNull();
    expect(matchServiceKey(`${REVIEWER_KEY}x`, env)).toBeNull();
  });

  test("treats a key shorter than the minimum as unset", () => {
    const short = "a".repeat(MIN_SERVICE_KEY_LENGTH - 1);
    expect(matchServiceKey(short, { SERVICE_KEY_REVIEWER: short })).toBeNull();
    const exact = "a".repeat(MIN_SERVICE_KEY_LENGTH);
    expect(matchServiceKey(exact, { SERVICE_KEY_REVIEWER: exact })).toBe("reviewer");
  });

  test("ignores services with no key configured", () => {
    expect(matchServiceKey(REVIEWER_KEY, { SERVICE_KEY_SLACK_BOT: SLACK_KEY })).toBeNull();
    expect(matchServiceKey("", {})).toBeNull();
  });

  test("uses the header name the platform documents", () => {
    expect(SERVICE_KEY_HEADER).toBe("x-loadout-service-key");
  });
});

describe("requireServiceKey", () => {
  function recorder() {
    const events: RejectedServiceKey[] = [];
    return { events, audit: async (event: RejectedServiceKey) => void events.push(event) };
  }

  test("accepts a key for an allowed service", async () => {
    const { events, audit } = recorder();
    const result = await guard(request({ [SERVICE_KEY_HEADER]: SLACK_KEY }), ["slack-bot"], { env, audit });
    expect(result).toEqual({ ok: true, service: "slack-bot" });
    expect(events).toHaveLength(0);
  });

  test("answers 401 and audits when the key is missing", async () => {
    const { events, audit } = recorder();
    const result = await guard(request(), ["reviewer"], { env, audit });
    expect(result).toEqual({ ok: false, status: 401 });
    expect(events).toEqual([
      { reason: "missing_key", method: "GET", path: "/api/v1/*", service: null },
    ]);
  });

  test("answers 401 and audits an unknown key", async () => {
    const { events, audit } = recorder();
    const result = await guard(request({ [SERVICE_KEY_HEADER]: "z".repeat(40) }), ["reviewer"], { env, audit });
    expect(result).toEqual({ ok: false, status: 401 });
    expect(events[0].reason).toBe("unknown_key");
  });

  test("answers 403 for a valid key on a route that service may not call", async () => {
    const { events, audit } = recorder();
    const result = await guard(request({ [SERVICE_KEY_HEADER]: STATS_KEY }), ["reviewer"], { env, audit });
    expect(result).toEqual({ ok: false, status: 403 });
    expect(events).toEqual([
      { reason: "not_permitted", method: "GET", path: "/api/v1/*", service: "stats-job" },
    ]);
  });

  test("never puts the key in the audit event", async () => {
    const { events, audit } = recorder();
    await guard(request({ [SERVICE_KEY_HEADER]: STATS_KEY }), ["reviewer"], { env, audit });
    await guard(request({ [SERVICE_KEY_HEADER]: "bad".repeat(12) }), ["reviewer"], { env, audit });
    expect(JSON.stringify(events)).not.toContain(STATS_KEY);
    expect(JSON.stringify(events)).not.toContain("bad".repeat(12));
  });

  test("still rejects when the audit write fails", async () => {
    const result = await guard(request(), ["reviewer"], {
      env,
      audit: async () => {
        throw new Error("database down");
      },
    });
    expect(result).toEqual({ ok: false, status: 401 });
  });

  test("trims whitespace around the header value", async () => {
    const result = await guard(request({ [SERVICE_KEY_HEADER]: `  ${REVIEWER_KEY}  ` }), ["reviewer"], {
      env,
      audit: async () => undefined,
    });
    expect(result).toEqual({ ok: true, service: "reviewer" });
  });

  test("audits a flood of bad keys once a minute per client address, not once per request", async () => {
    const { events, audit } = recorder();
    const throttle = createRateLimiter({ limit: 1, windowMs: 60_000 });
    for (let i = 0; i < 25; i++) {
      const result = await requireServiceKey(request({ [SERVICE_KEY_HEADER]: `bad-${i}`.padEnd(40, "z") }), ["slack-bot"], { env, audit, throttle });
      expect(result).toEqual({ ok: false, status: 401 });
    }
    expect(events).toHaveLength(1);
  });

  test("never records attacker-chosen path text", async () => {
    const { events, audit } = recorder();
    await guard(request({}, "https://loadout.test/api/internal/bot/tickets/%3Cscript%3Ealert(1)%3C"), ["slack-bot"], { env, audit });
    await guard(request({}, "https://loadout.test/api/internal/bot/helpers/UABCDEFGHI"), ["slack-bot"], { env, audit });
    await guard(request({}, "https://loadout.test/somewhere/odd?x=1"), ["slack-bot"], { env, audit });
    expect(events.map((e) => e.path)).toEqual(["/api/internal/bot/tickets/:id", "/api/internal/bot/helpers/:slackId", "unmatched"]);
    expect(JSON.stringify(events)).not.toContain("script");
  });
});

describe("auditPathOf", () => {
  test("reports the route pattern, never the raw path", () => {
    expect(auditPathOf("https://x.test/api/internal/bot/outbox/abc123/ack")).toBe("/api/internal/bot/outbox/:id/ack");
    expect(auditPathOf("https://x.test/nothing/here")).toBe("unmatched");
    expect(auditPathOf("not a url")).toBe("unmatched");
  });
});
