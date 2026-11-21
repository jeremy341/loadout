import { describe, expect, test } from "bun:test";
import { createLogger, scrubFields } from "./log";

describe("scrubFields", () => {
  test("drops keys that look like secrets or message text", () => {
    const out = scrubFields({
      serviceKey: "abc",
      SLACK_BOT_TOKEN: "xoxb",
      authorization: "Bearer x",
      password: "p",
      text: "hello there",
      messageText: "hi",
      ticketId: "tk_1",
      keepOpen: false,
    });
    expect(out).toEqual({ ticketId: "tk_1", keepOpen: false });
  });

  test("keeps the error name and code but not the message", () => {
    const err = Object.assign(new Error("secret detail"), { code: "network" });
    expect(scrubFields({ error: err })).toEqual({ error: { errorName: "Error", errorCode: "network" } });
  });

  test("truncates long strings", () => {
    const out = scrubFields({ note: "x".repeat(400) });
    expect(String(out.note).length).toBe(303);
  });
});

describe("createLogger", () => {
  test("writes one JSON line per event at or above the level", () => {
    const lines: string[] = [];
    const log = createLogger("info", (l) => lines.push(l), () => new Date("2026-11-18T00:00:00.000Z"));
    log.debug("hidden");
    log.info("started", { port: 3000, token: "nope" });
    expect(lines.length).toBe(1);
    const parsed = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(parsed).toEqual({ port: 3000, ts: "2026-11-18T00:00:00.000Z", level: "info", event: "started" });
  });

  test("a field cannot overwrite the event name", () => {
    const lines: string[] = [];
    const log = createLogger("debug", (l) => lines.push(l));
    log.warn("real_event", { event: "fake", level: "error" });
    const parsed = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(parsed.event).toBe("real_event");
    expect(parsed.level).toBe("warn");
  });
});
