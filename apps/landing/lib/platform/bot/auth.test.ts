import { describe, expect, test } from "bun:test";
import {
  BOT_ROUTE_LIMIT,
  checkBool,
  checkCode,
  checkEnum,
  checkFields,
  checkOptionalSlackId,
  checkOptionalText,
  checkRouteId,
  checkSlackId,
  checkSlackTs,
  checkText,
  isSlackId,
  MAX_BODY_CHARS,
  nullableWith,
  optionalWith,
  readJson,
  requireBot,
  botInvalid,
} from "./auth";

const BOT_KEY = "b".repeat(40);
const REVIEWER_KEY = "r".repeat(40);
const env = { SERVICE_KEY_SLACK_BOT: BOT_KEY, SERVICE_KEY_REVIEWER: REVIEWER_KEY };
const noAudit = async () => {};
const request = (headers: Record<string, string> = {}, body?: string) =>
  new Request("https://site.test/api/internal/bot/person?slackId=U1", { method: body === undefined ? "GET" : "POST", headers, body });

describe("requireBot", () => {
  test("a missing key is 401", async () => {
    const res = await requireBot(request(), { env, audit: noAudit });
    expect(res?.status).toBe(401);
    expect(await res?.json()).toEqual({ error: "unauthorized" });
  });

  test("an unknown key is 401", async () => {
    const res = await requireBot(request({ "x-loadout-service-key": "z".repeat(40) }), { env, audit: noAudit });
    expect(res?.status).toBe(401);
  });

  test("a valid key for another service is 403", async () => {
    const res = await requireBot(request({ "x-loadout-service-key": REVIEWER_KEY }), { env, audit: noAudit });
    expect(res?.status).toBe(403);
    expect(await res?.json()).toEqual({ error: "forbidden" });
  });

  test("the slack-bot key lets the call through", async () => {
    expect(await requireBot(request({ "x-loadout-service-key": BOT_KEY }), { env, audit: noAudit })).toBeNull();
  });

  test("the per-route limit is 300 a minute", () => {
    expect(BOT_ROUTE_LIMIT).toBe(300);
  });
});

describe("Slack ids and timestamps", () => {
  test("accepts the Slack id shapes, rejects everything else", () => {
    expect(isSlackId("U0123ABCD")).toBe(true);
    expect(isSlackId("C0123456789")).toBe(true);
    expect(isSlackId("W01234567")).toBe(true);
    expect(isSlackId("B01234567")).toBe(true);
    expect(isSlackId("G01234567890123456789")).toBe(true);
    expect(isSlackId("X0123ABCD")).toBe(false);
    expect(isSlackId("u0123abcd")).toBe(false);
    expect(isSlackId("U0123ABC")).toBe(false);
    expect(isSlackId("U0123ABCD!")).toBe(false);
    expect(isSlackId(42)).toBe(false);
  });

  test("checkSlackId names the field in its error", () => {
    const bad = checkSlackId("nope", "authorSlackId");
    expect(bad).toEqual({ ok: false, message: "authorSlackId must be a Slack id" });
  });

  test("message timestamps are ten digits, a dot and six digits", () => {
    expect(checkSlackTs("1794759095.100006", "messageTs").ok).toBe(true);
    expect(checkSlackTs("1794759095.1000", "messageTs").ok).toBe(false);
    expect(checkSlackTs("179475909.100006", "messageTs").ok).toBe(false);
    expect(checkSlackTs(1794759095.100006, "messageTs").ok).toBe(false);
  });

  test("route ids and codes are strict", () => {
    expect(checkRouteId("clx9abc_-1", "id").ok).toBe(true);
    expect(checkRouteId("a/b", "id").ok).toBe(false);
    expect(checkRouteId("x".repeat(65), "id").ok).toBe(false);
    expect(checkCode("user_not_found", "code").ok).toBe(true);
    expect(checkCode("Not Found", "code").ok).toBe(false);
    expect(checkCode("1st", "code").ok).toBe(false);
  });
});

describe("checkText", () => {
  test("trims, and refuses blank text when it is required", () => {
    expect(checkText("  hello  ", "text", 10, true)).toEqual({ ok: true, value: "hello" });
    expect(checkText("   ", "text", 10, true).ok).toBe(false);
    expect(checkText("", "text", 10, false)).toEqual({ ok: true, value: "" });
  });

  test("the ticket text limit is 4000 characters, inclusive", () => {
    expect(checkText("a".repeat(4000), "text", 4000, true).ok).toBe(true);
    expect(checkText("a".repeat(4001), "text", 4000, true).ok).toBe(false);
  });

  test("counts characters, so an emoji is one", () => {
    expect(checkText("😀".repeat(10), "title", 10, true).ok).toBe(true);
    expect(checkText("😀".repeat(11), "title", 10, true).ok).toBe(false);
  });

  test("refuses a non-string", () => {
    expect(checkText(12, "text", 10, true).ok).toBe(false);
  });
});

describe("optional fields", () => {
  test("a title: undefined leaves it, null or blank clears it, text is trimmed", () => {
    expect(checkOptionalText(undefined, "title", 100)).toEqual({ ok: true, value: undefined });
    expect(checkOptionalText(null, "title", 100)).toEqual({ ok: true, value: null });
    expect(checkOptionalText("  ", "title", 100)).toEqual({ ok: true, value: null });
    expect(checkOptionalText(" Billing ", "title", 100)).toEqual({ ok: true, value: "Billing" });
    expect(checkOptionalText("x".repeat(101), "title", 100).ok).toBe(false);
  });

  test("an optional Slack id: undefined and null pass through, a bad id is refused", () => {
    expect(checkOptionalSlackId(undefined, "claimedBy")).toEqual({ ok: true, value: undefined });
    expect(checkOptionalSlackId(null, "claimedBy")).toEqual({ ok: true, value: null });
    expect(checkOptionalSlackId("bad", "claimedBy").ok).toBe(false);
  });

  test("enum, boolean, optionalWith and nullableWith", () => {
    expect(checkEnum("open", "status", ["open", "closed"] as const)).toEqual({ ok: true, value: "open" });
    expect(checkEnum("gone", "status", ["open", "closed"] as const).ok).toBe(false);
    expect(checkBool(true, "keepOpen")).toEqual({ ok: true, value: true });
    expect(checkBool("yes", "keepOpen").ok).toBe(false);
    expect(optionalWith(undefined, checkBool)).toEqual({ ok: true, value: undefined });
    expect(nullableWith(undefined, (raw) => checkSlackId(raw, "x"))).toEqual({ ok: true, value: null });
  });
});

describe("checkFields", () => {
  test("a plain object with only allowed keys passes", () => {
    expect(checkFields({ text: "hi" }, ["text", "title"]).ok).toBe(true);
  });

  test("an unknown key is refused, so a typo is never dropped silently", () => {
    const result = checkFields({ text: "hi", titel: "x" }, ["text", "title"]);
    expect(result).toEqual({ ok: false, message: "unknown field: titel" });
  });

  test("a non-object body is refused", () => {
    expect(checkFields([], ["text"]).ok).toBe(false);
    expect(checkFields(null, ["text"]).ok).toBe(false);
    expect(checkFields("text", ["text"]).ok).toBe(false);
  });
});

describe("readJson", () => {
  test("parses a JSON body", async () => {
    expect(await readJson(request({}, '{"a":1}'))).toEqual({ ok: true, value: { a: 1 } });
  });

  test("invalid JSON is refused", async () => {
    expect((await readJson(request({}, "{nope"))).ok).toBe(false);
  });

  test("an empty body is refused unless optional", async () => {
    expect((await readJson(request({}, ""))).ok).toBe(false);
    expect(await readJson(request({}, ""), true)).toEqual({ ok: true, value: {} });
  });

  test("a body over the limit is refused", async () => {
    expect((await readJson(request({}, "x".repeat(MAX_BODY_CHARS + 1)))).ok).toBe(false);
  });

  test("botInvalid answers 400 with the message", async () => {
    const res = botInvalid("req-1", "text is required");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_request", message: "text is required" });
  });
});
