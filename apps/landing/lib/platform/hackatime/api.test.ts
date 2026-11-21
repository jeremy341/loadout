import { describe, expect, test } from "bun:test";
import {
  dailySecondsFor,
  fetchDailySeconds,
  fetchProjects,
  HackatimeApiError,
  isValidHackatimeUserId,
  splitSpanByDay,
} from "./api";

// A fake fetch that answers by path, so each test controls exactly what the "API" returns.
function fakeFetch(answer: (url: string) => { status?: number; body?: unknown; text?: string }) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    const reply = answer(url);
    const status = reply.status ?? 200;
    return new Response(reply.text ?? JSON.stringify(reply.body ?? {}), { status });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

async function errorCodeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (e) {
    if (e instanceof HackatimeApiError) return e.code;
    throw e;
  }
  return "no-error";
}

describe("isValidHackatimeUserId", () => {
  test("accepts slack style and numeric ids, rejects paths and blanks", () => {
    expect(isValidHackatimeUserId("U012ABC3")).toBe(true);
    expect(isValidHackatimeUserId("12345")).toBe(true);
    expect(isValidHackatimeUserId("")).toBe(false);
    expect(isValidHackatimeUserId("../admin")).toBe(false);
    expect(isValidHackatimeUserId("a".repeat(41))).toBe(false);
  });
});

describe("splitSpanByDay", () => {
  test("keeps a span inside one day whole", () => {
    expect(splitSpanByDay(1_700_000_000, 1_700_000_600)).toEqual([{ day: "2023-11-14", seconds: 600 }]);
  });

  test("splits a span across midnight UTC", () => {
    const midnight = Date.parse("2023-11-15T00:00:00Z") / 1000;
    expect(splitSpanByDay(midnight - 300, midnight + 100)).toEqual([
      { day: "2023-11-14", seconds: 300 },
      { day: "2023-11-15", seconds: 100 },
    ]);
  });
});

describe("fetchProjects", () => {
  test("reads the project list from data.projects and skips empty names", async () => {
    const { fn, calls } = fakeFetch(() => ({
      body: { data: { projects: [{ name: "pixel-app", total_seconds: 3600 }, { name: "  ", total_seconds: 5 }] } },
    }));
    const projects = await fetchProjects("12345", { fetch: fn, token: null });
    expect(projects).toEqual([{ name: "pixel-app", seconds: 3600 }]);
    expect(calls[0].url).toContain("/api/v1/users/12345/stats?features=projects");
    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  test("sends the bearer token when one is given, without echoing it in errors", async () => {
    const { fn, calls } = fakeFetch(() => ({ status: 401, body: { error: "secret-echo" } }));
    const code = await errorCodeOf(fetchProjects("12345", { fetch: fn, token: "svc-token" }));
    expect(code).toBe("unauthorized");
    expect(calls[0].headers.Authorization).toBe("Bearer svc-token");
  });

  test("maps status codes to short error codes", async () => {
    const cases: [number, string][] = [
      [401, "unauthorized"],
      [404, "not_found"],
      [429, "rate_limited"],
      [503, "upstream_error"],
      [418, "bad_request"],
    ];
    for (const [status, code] of cases) {
      const { fn } = fakeFetch(() => ({ status }));
      expect(await errorCodeOf(fetchProjects("12345", { fetch: fn, token: null }))).toBe(code);
    }
  });

  test("does not retry a 4xx answer", async () => {
    const { fn, calls } = fakeFetch(() => ({ status: 404 }));
    await errorCodeOf(fetchProjects("12345", { fetch: fn, token: null }));
    expect(calls.length).toBe(1);
  });

  test("rejects an unexpected shape with bad_response", async () => {
    const { fn } = fakeFetch(() => ({ body: { data: { projects: [{ name: 42 }] } } }));
    expect(await errorCodeOf(fetchProjects("12345", { fetch: fn, token: null }))).toBe("bad_response");
    const { fn: fn2 } = fakeFetch(() => ({ text: "<html>not json" }));
    expect(await errorCodeOf(fetchProjects("12345", { fetch: fn2, token: null }))).toBe("bad_response");
  });

  test("rejects an invalid user id before any request", async () => {
    const { fn, calls } = fakeFetch(() => ({ body: {} }));
    expect(await errorCodeOf(fetchProjects("../x", { fetch: fn, token: null }))).toBe("invalid_user_id");
    expect(calls.length).toBe(0);
  });

  test("times out with the timeout code when the request never answers", async () => {
    const hangs = ((_: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      })) as unknown as typeof fetch;
    expect(await errorCodeOf(fetchProjects("12345", { fetch: hangs, token: null, timeoutMs: 10 }))).toBe("timeout");
  });

  test("reports a connection failure as network", async () => {
    const broken = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    expect(await errorCodeOf(fetchProjects("12345", { fetch: broken, token: null }))).toBe("network");
  });
});

describe("dailySecondsFor and fetchDailySeconds", () => {
  test("turns project spans into per-day rows and clips to the window", async () => {
    const nov10 = Date.parse("2026-11-10T00:00:00Z") / 1000;
    const { fn } = fakeFetch((url) => {
      if (url.includes("/heartbeats/spans")) {
        return {
          body: {
            spans: [
              // 2 h on Nov 10
              { start_time: nov10 + 3600, end_time: nov10 + 3600 + 7200 },
              // 23:30 Nov 10 to 00:30 Nov 11: 30 min on each day
              { start_time: nov10 + 23 * 3600 + 1800, end_time: nov10 + 24 * 3600 + 1800 },
              // before the window: ignored
              { start_time: nov10 - 5000, end_time: nov10 - 1000 },
            ],
          },
        };
      }
      return { body: { data: { projects: [{ name: "pixel-app", total_seconds: 1 }] } } };
    });
    const rows = await fetchDailySeconds("12345", "2026-11-10", "2026-11-11", { fetch: fn, token: null });
    expect(rows).toEqual([
      { day: "2026-11-10", name: "pixel-app", seconds: 9000 },
      { day: "2026-11-11", name: "pixel-app", seconds: 1800 },
    ]);
  });

  test("returns nothing for a window with no spans", async () => {
    const { fn } = fakeFetch(() => ({ body: { spans: [] } }));
    const rows = await dailySecondsFor("12345", ["pixel-app"], "2026-11-10", "2026-11-10", { fetch: fn, token: null });
    expect(rows).toEqual([]);
  });

  test("rejects a reversed or malformed window", async () => {
    const { fn } = fakeFetch(() => ({ body: { spans: [] } }));
    expect(await errorCodeOf(dailySecondsFor("12345", [], "2026-11-12", "2026-11-10", { fetch: fn, token: null }))).toBe(
      "bad_request",
    );
    expect(await errorCodeOf(dailySecondsFor("12345", [], "10/11/2026", "2026-11-10", { fetch: fn, token: null }))).toBe(
      "bad_request",
    );
  });
});
