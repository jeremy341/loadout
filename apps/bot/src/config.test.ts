import { describe, expect, test } from "bun:test";
import { ConfigError, loadConfig, redact } from "./config";

const KEY = "k".repeat(40);
const base = {
  SLACK_BOT_TOKEN: "xoxb-test-token",
  SLACK_SIGNING_SECRET: "0123456789abcdef0123456789abcdef",
  SITE_BASE_URL: "https://site.example.test/",
  SERVICE_KEY_SLACK_BOT: KEY,
};

function problemsOf(env: Record<string, string | undefined>): string[] {
  try {
    loadConfig(env);
  } catch (err) {
    if (err instanceof ConfigError) return err.problems;
    throw err;
  }
  return [];
}

describe("loadConfig", () => {
  test("applies defaults and strips the trailing slash from the site url", () => {
    const config = loadConfig({ ...base });
    expect(config.botName).toBe("Rig");
    expect(config.triggerWords).toEqual(["rig"]);
    expect(config.siteBaseUrl).toBe("https://site.example.test");
    expect(config.port).toBe(3000);
    expect(config.logLevel).toBe("info");
    expect(config.chatEnabled).toBe(false);
    expect(config.helpChannelId).toBe("");
    expect(config.emoji).toEqual({ open: "eyes", resolved: "white_check_mark" });
    expect(config.orphanReply).toBe("thx orphan");
  });

  test("reads optional ids, admin list and trigger words", () => {
    const config = loadConfig({
      ...base,
      BOT_NAME: "Bolt",
      BOT_TRIGGER_WORDS: "Bolt, helper ,",
      HELP_CHANNEL_ID: "C0000000001",
      ADMIN_SLACK_IDS: "U0000000001, U0000000002",
      PORT: "8080",
      LOG_LEVEL: "debug",
    });
    expect(config.triggerWords).toEqual(["bolt", "helper"]);
    expect(config.helpChannelId).toBe("C0000000001");
    expect(config.adminSlackIds).toEqual(["U0000000001", "U0000000002"]);
    expect(config.port).toBe(8080);
    expect(config.logLevel).toBe("debug");
  });

  test("reports every missing required value on its own line", () => {
    const problems = problemsOf({});
    expect(problems).toContain("SLACK_BOT_TOKEN is required");
    expect(problems).toContain("SLACK_SIGNING_SECRET is required");
    // A placeholder or a short signing secret is refused at startup, not accepted and left to fail every Slack request.
    expect(problemsOf({ ...base, SLACK_SIGNING_SECRET: "replace-with-signing-secret" })).toEqual([
      "SLACK_SIGNING_SECRET must be the 32-character signing secret from the Slack app, not a placeholder",
    ]);
    expect(problemsOf({ ...base, SLACK_SIGNING_SECRET: "short" })).toEqual([
      "SLACK_SIGNING_SECRET must be the 32-character signing secret from the Slack app, not a placeholder",
    ]);
    expect(problems).toContain("SITE_BASE_URL is required");
    expect(problems).toContain("SERVICE_KEY_SLACK_BOT is required");
    expect(problems.length).toBe(4);
  });

  test("the thrown message has one line per problem", () => {
    try {
      loadConfig({});
      throw new Error("expected failure");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as Error).message.split("\n").length).toBe(4);
    }
  });

  test("rejects short service keys without echoing them", () => {
    const problems = problemsOf({ ...base, SERVICE_KEY_SLACK_BOT: "short-secret-value" });
    expect(problems).toEqual(["SERVICE_KEY_SLACK_BOT must be at least 32 characters"]);
    expect(problems.join(" ")).not.toContain("short-secret-value");
  });

  test("checks Slack id shape for every id input", () => {
    const problems = problemsOf({
      ...base,
      HELP_CHANNEL_ID: "channel-one",
      ADMIN_SLACK_IDS: "U0000000001,nope",
      ORPHAN_BOT_ID: "B0",
    });
    expect(problems).toContain("HELP_CHANNEL_ID is not a valid Slack id");
    expect(problems).toContain("ADMIN_SLACK_IDS contains a value that is not a valid Slack id");
    expect(problems).toContain("ORPHAN_BOT_ID is not a valid Slack id");
  });

  test("validates the site url", () => {
    expect(problemsOf({ ...base, SITE_BASE_URL: "not a url" })).toEqual([
      "SITE_BASE_URL must be an http or https URL with no query string",
    ]);
    expect(problemsOf({ ...base, SITE_BASE_URL: "ftp://site.example.test" })).toHaveLength(1);
    expect(problemsOf({ ...base, SITE_BASE_URL: "https://site.example.test?x=1" })).toHaveLength(1);
  });

  test("validates booleans and numbers", () => {
    expect(problemsOf({ ...base, CHAT_CHIME: "maybe" })).toEqual(["CHAT_CHIME must be true or false"]);
    expect(problemsOf({ ...base, PORT: "70000" })).toEqual(["PORT must be a whole number from 1 to 65535"]);
    expect(problemsOf({ ...base, PORT: "3.5" })).toHaveLength(1);
    expect(loadConfig({ ...base, CHAT_CHIME: "YES" }).chatChime).toBe(true);
  });

  test("chat needs an Anthropic key when switched on", () => {
    expect(problemsOf({ ...base, CHAT_ENABLED: "true" })).toEqual(["CHAT_ENABLED=true needs ANTHROPIC_API_KEY"]);
    expect(loadConfig({ ...base, CHAT_ENABLED: "true", ANTHROPIC_API_KEY: "test-key" }).chatEnabled).toBe(true);
  });

  test("rejects an unknown log level and a bad emoji name", () => {
    expect(problemsOf({ ...base, LOG_LEVEL: "trace" })).toEqual([
      "LOG_LEVEL must be debug, info, warn or error",
    ]);
    expect(problemsOf({ ...base, DESK_EMOJI_OPEN: ":eyes:" })).toEqual([
      "DESK_EMOJI_OPEN must be a Slack emoji name (lower case, no colons)",
    ]);
  });
});

describe("redact", () => {
  test("keeps the shape and hides the middle", () => {
    expect(redact("C0000000001")).toBe("C0...001");
    expect(redact("U1")).toBe("****");
    expect(redact("")).toBe("");
  });
});
