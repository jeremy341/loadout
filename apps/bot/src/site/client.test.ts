import { describe, expect, test } from "bun:test";
import { SiteError } from "../types";
import { createSiteClient } from "./client";

type Seen = { url: string; method: string; headers: Record<string, string>; body: unknown };

// A scripted fetch: each entry answers one call in order. "throw" simulates a network failure,
// "hang" never answers (used for the timeout test).
type Step = { status: number; body?: unknown; text?: string } | "throw" | "hang";

function scripted(steps: Step[]) {
  const seen: Seen[] = [];
  let i = 0;
  const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>));
    seen.push({
      url: String(input),
      method: init?.method ?? "GET",
      headers,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const step = steps[Math.min(i, steps.length - 1)] ?? { status: 200, body: null };
    i++;
    if (step === "throw") throw new TypeError("fetch failed");
    if (step === "hang") {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    }
    const text = step.text ?? (step.body === undefined ? "" : JSON.stringify(step.body));
    return new Response(text, { status: step.status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { fakeFetch, seen };
}

function client(steps: Step[], extra: { timeoutMs?: number } = {}) {
  const { fakeFetch, seen } = scripted(steps);
  const site = createSiteClient({
    baseUrl: "https://site.example.test/",
    serviceKey: "s".repeat(40),
    fetch: fakeFetch,
    retryDelayMs: 1,
    ...extra,
  });
  return { site, seen };
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (err) {
    if (err instanceof SiteError) return err.code;
    throw err;
  }
  return "no-error";
}

describe("createSiteClient", () => {
  test("posts JSON to the bot route with the service key header", async () => {
    const ticket = { id: "t1", status: "open" };
    const { site, seen } = client([{ status: 200, body: { ticket, linked: true } }]);
    const result = await site.createTicket({ channelId: "C0000000001", messageTs: "1.2", authorSlackId: "U0000000001", text: "hi" });
    expect(result.linked).toBe(true);
    expect(seen[0]?.url).toBe("https://site.example.test/api/internal/bot/tickets");
    expect(seen[0]?.method).toBe("POST");
    expect(seen[0]?.headers["x-loadout-service-key"]).toBe("s".repeat(40));
    expect(seen[0]?.body).toEqual({ channelId: "C0000000001", messageTs: "1.2", authorSlackId: "U0000000001", text: "hi" });
  });

  test("a missing ticket is null, not an error", async () => {
    const { site } = client([{ status: 404, body: { error: "not_found" } }]);
    expect(await site.getTicket("nope")).toBeNull();
  });

  test("message lookups pass the channel and timestamp as query values", async () => {
    const { site, seen } = client([{ status: 200, body: null }]);
    expect(await site.findTicketByMessage("C0000000001", "1700000000.000100")).toBeNull();
    expect(seen[0]?.url).toBe(
      "https://site.example.test/api/internal/bot/tickets?channelId=C0000000001&messageTs=1700000000.000100",
    );
  });

  test("encodes ids in paths and keeps the admin id in the body", async () => {
    const { site, seen } = client([{ status: 200, text: "" }]);
    await site.removeHelper("U0000000009", "U 1/2");
    expect(seen[0]?.url).toBe("https://site.example.test/api/internal/bot/helpers/U%201%2F2");
    expect(seen[0]?.method).toBe("DELETE");
    expect(seen[0]?.body).toEqual({ adminSlackId: "U0000000009" });
  });

  test("retries a GET once after a 503 and then succeeds", async () => {
    const { site, seen } = client([{ status: 503, body: {} }, { status: 200, body: { helpers: ["U0000000001"] } }]);
    expect(await site.listHelpers()).toEqual(["U0000000001"]);
    expect(seen.length).toBe(2);
  });

  test("does not retry a write on a 5xx", async () => {
    const { site, seen } = client([{ status: 503, body: {} }, { status: 200, body: {} }]);
    expect(await codeOf(site.addTicketMessage("t1", { authorKind: "person", text: "x" }))).toBe("server_error");
    expect(seen.length).toBe(1);
  });

  test("retries a GET once on a network error and reports network when it keeps failing", async () => {
    const { site, seen } = client(["throw", "throw"]);
    expect(await codeOf(site.listOpenTickets())).toBe("network");
    expect(seen.length).toBe(2);
  });

  test("times out and reports timeout", async () => {
    const { site } = client(["hang", "hang"], { timeoutMs: 20 });
    expect(await codeOf(site.person("U0000000001"))).toBe("timeout");
  });

  test("uses the short error code from the body when it is well formed", async () => {
    const { site } = client([{ status: 422, body: { error: "title_too_long" } }]);
    try {
      await site.updateTicket("t1", { title: "x" });
      throw new Error("expected a failure");
    } catch (err) {
      expect(err).toBeInstanceOf(SiteError);
      expect((err as SiteError).code).toBe("title_too_long");
      expect((err as SiteError).status).toBe(422);
    }
  });

  test("falls back to a status code when the body has no usable error", async () => {
    const { site } = client([{ status: 403, text: "<html>no</html>" }]);
    expect(await codeOf(site.person("U0000000001"))).toBe("forbidden");
    const { site: other } = client([{ status: 418, text: "" }]);
    expect(await codeOf(other.person("U0000000001"))).toBe("http_418");
  });

  test("a body that is not JSON is a bad_response", async () => {
    const { site } = client([{ status: 200, text: "<html>oops</html>" }]);
    expect(await codeOf(site.person("U0000000001"))).toBe("bad_response");
  });

  test("a list route that returns a non-array is a bad_response", async () => {
    const { site } = client([{ status: 200, body: { helpers: "nope" } }]);
    expect(await codeOf(site.listHelpers())).toBe("bad_response");
  });

  test("countJobs counts the owner's pending jobs of one kind from the jobs list", async () => {
    const jobs = [
      { id: "a", kind: "reminder", ownerSlackId: "U0000000001", runAt: "2026-11-19T10:00:00Z", payload: {} },
      { id: "b", kind: "reminder", ownerSlackId: "U0000000001", runAt: "2026-11-19T11:00:00Z", payload: {} },
      { id: "c", kind: "countdown", ownerSlackId: "U0000000001", runAt: "2026-11-19T11:00:00Z", payload: {} },
      { id: "d", kind: "reminder", ownerSlackId: "U0000000002", runAt: "2026-11-19T11:00:00Z", payload: {} },
    ];
    const { site, seen } = client([{ status: 200, body: { jobs } }]);
    expect(await site.countJobs("U0000000001", "reminder")).toBe(2);
    expect(seen[0]?.url).toBe("https://site.example.test/api/internal/bot/jobs");
  });

  test("answers wrapped in a named field are unwrapped", async () => {
    const { site } = client([{ status: 200, body: { ticket: { id: "t1" }, linked: true, created: true } }]);
    const made = await site.createTicket({ channelId: "C0000000001", messageTs: "1700000000.000100", authorSlackId: "U0000000001", text: "hello there" });
    expect(made.ticket.id).toBe("t1");
    expect(made.linked).toBe(true);
  });
});
