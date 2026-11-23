import { describe, expect, test } from "bun:test";
import { buildOutcomeRequest, recordRobertOutcome, writebackEnabled } from "./outbound";

const ON = { LOADOUT_TELESCREEN_URL: "https://telescreen.example/api/v1/ysws", LOADOUT_TELESCREEN_KEY: "key-123", LOADOUT_TELESCREEN_WRITEBACK: "on" };

describe("Telescreen write-back gate", () => {
  test("off by default: nothing is sent, even when Telescreen is configured", async () => {
    let calls = 0;
    const fetch = async () => {
      calls += 1;
      return new Response("", { status: 200 });
    };
    const env = { ...ON, LOADOUT_TELESCREEN_WRITEBACK: undefined };
    const result = await recordRobertOutcome({ robertProjectId: "abc", status: "approved" }, { env, fetch });
    expect(result).toMatchObject({ ok: false, state: "disabled" });
    expect(calls).toBe(0);
  });
  test("the flag must be exactly on", () => {
    expect(writebackEnabled({ ...ON, LOADOUT_TELESCREEN_WRITEBACK: "true" })).toBe(false);
    expect(writebackEnabled({ ...ON, LOADOUT_TELESCREEN_WRITEBACK: " on " })).toBe(true);
  });
  test("on without the address and key is not configured", async () => {
    const result = await recordRobertOutcome({ robertProjectId: "abc", status: "approved" }, { env: { LOADOUT_TELESCREEN_WRITEBACK: "on" } });
    expect(result).toMatchObject({ ok: false, state: "not_configured" });
  });
});

describe("Telescreen write-back request", () => {
  test("posts the decision with the bearer key and a clamped reason", () => {
    const built = buildOutcomeRequest({ robertProjectId: "proj_1", status: "rejected", reason: "x".repeat(400) }, ON);
    if (!("url" in built)) throw new Error("expected a request");
    expect(built.url).toBe("https://telescreen.example/api/v1/ysws/projects/proj_1/outcome");
    const headers = built.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer key-123");
    const body = JSON.parse(String(built.init.body));
    expect(body.status).toBe("rejected");
    expect(body.reason.length).toBe(300);
  });
  test("refuses an id that is not a plain token, and a bad status", () => {
    expect(buildOutcomeRequest({ robertProjectId: "../x", status: "approved" }, ON)).toEqual({ error: "That Telescreen project id is not valid." });
    expect(buildOutcomeRequest({ robertProjectId: "ok", status: "maybe" as "approved" }, ON)).toEqual({ error: "Outcome must be approved or rejected." });
  });
  test("with the flag on, a 409 is reported as final, not as a failure", async () => {
    const fetch = async () => new Response("", { status: 409 });
    expect(await recordRobertOutcome({ robertProjectId: "abc", status: "approved" }, { env: ON, fetch })).toMatchObject({ ok: false, state: "final" });
  });
  test("with the flag on, a success returns ok, and a network error does not throw", async () => {
    expect(await recordRobertOutcome({ robertProjectId: "abc", status: "approved" }, { env: ON, fetch: async () => new Response("", { status: 200 }) })).toEqual({ ok: true });
    const failing = async () => {
      throw new Error("offline");
    };
    expect(await recordRobertOutcome({ robertProjectId: "abc", status: "approved" }, { env: ON, fetch: failing })).toMatchObject({ ok: false, state: "failed" });
  });
});
