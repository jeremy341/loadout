// Reads and validates the environment (spec section 2).
// API: loadConfig(env) -> AppConfig (the Config contract plus the desk emoji names), or throws ConfigError whose
// message has one readable line per problem. redact(id) shortens a Slack id for logs.
// Secret values are never echoed in an error message.
import type { Config } from "./types";

export type AppConfig = Config & { emoji: { open: string; resolved: string } };

export class ConfigError extends Error {
  constructor(public readonly problems: string[]) {
    super(problems.map((p) => `- ${p}`).join("\n"));
    this.name = "ConfigError";
  }
}

// Slack ids: C (channel), G (group), U (user), B (bot), W (workspace user), then 8 to 20 capitals or digits.
const SLACK_ID = /^[CGUBW][A-Z0-9]{8,20}$/;
// Slack emoji names are lower case words; the bot only ever uses them in reactions.
const EMOJI_NAME = /^[a-z0-9_+-]{1,64}$/;
const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
const TRUE_WORDS = ["true", "1", "yes", "on"];
const FALSE_WORDS = ["false", "0", "no", "off"];

type Env = Record<string, string | undefined>;

export function loadConfig(env: Env): AppConfig {
  const problems: string[] = [];
  const get = (name: string): string => (env[name] ?? "").trim();

  const required = (name: string): string => {
    const value = get(name);
    if (!value) problems.push(`${name} is required`);
    return value;
  };

  // Optional id: empty means the feature is off, otherwise it must look like a Slack id.
  const optionalId = (name: string): string => {
    const value = get(name);
    if (value && !SLACK_ID.test(value)) problems.push(`${name} is not a valid Slack id`);
    return value;
  };

  const idList = (name: string): string[] => {
    const items = get(name).split(",").map((s) => s.trim()).filter(Boolean);
    for (const item of items) {
      if (!SLACK_ID.test(item)) problems.push(`${name} contains a value that is not a valid Slack id`);
    }
    return items;
  };

  const bool = (name: string, fallback: boolean): boolean => {
    const value = get(name).toLowerCase();
    if (value === "") return fallback;
    if (TRUE_WORDS.includes(value)) return true;
    if (FALSE_WORDS.includes(value)) return false;
    problems.push(`${name} must be true or false`);
    return fallback;
  };

  const integer = (name: string, fallback: number, min: number, max: number): number => {
    const value = get(name);
    if (value === "") return fallback;
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) {
      problems.push(`${name} must be a whole number from ${min} to ${max}`);
      return fallback;
    }
    return n;
  };

  const siteBaseUrl = (() => {
    const value = required("SITE_BASE_URL");
    if (!value) return "";
    try {
      const url = new URL(value);
      if ((url.protocol !== "https:" && url.protocol !== "http:") || url.search || url.hash) throw new Error("bad");
      return value.replace(/\/+$/, "");
    } catch {
      problems.push("SITE_BASE_URL must be an http or https URL with no query string");
      return "";
    }
  })();

  const serviceKey = required("SERVICE_KEY_SLACK_BOT");
  if (serviceKey && serviceKey.length < 32) problems.push("SERVICE_KEY_SLACK_BOT must be at least 32 characters");

  const botName = get("BOT_NAME") || "Rig";
  const triggerWords = (() => {
    const words = get("BOT_TRIGGER_WORDS")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return words.length > 0 ? words : [botName.toLowerCase()];
  })();

  const anthropicApiKey = get("ANTHROPIC_API_KEY");
  const chatEnabled = bool("CHAT_ENABLED", false);
  if (chatEnabled && !anthropicApiKey) problems.push("CHAT_ENABLED=true needs ANTHROPIC_API_KEY");

  const orphanReply = get("ORPHAN_REPLY") || "thx orphan";
  if (orphanReply.length > 200) problems.push("ORPHAN_REPLY must be at most 200 characters");

  const emojiOpen = get("DESK_EMOJI_OPEN") || "eyes";
  const emojiResolved = get("DESK_EMOJI_RESOLVED") || "white_check_mark";
  for (const [name, value] of [["DESK_EMOJI_OPEN", emojiOpen], ["DESK_EMOJI_RESOLVED", emojiResolved]] as const) {
    if (!EMOJI_NAME.test(value)) problems.push(`${name} must be a Slack emoji name (lower case, no colons)`);
  }

  const logLevel = get("LOG_LEVEL") || "info";
  if (!(LOG_LEVELS as readonly string[]).includes(logLevel)) problems.push("LOG_LEVEL must be debug, info, warn or error");

  // Slack's signing secret is 32 hex characters. A placeholder or a short value would make every Slack request fail verification
  // in a confusing way, so the config refuses it at startup.
  const signingSecret = required("SLACK_SIGNING_SECRET");
  if (signingSecret && (signingSecret.length < 32 || /^replace[-_]/i.test(signingSecret))) {
    problems.push("SLACK_SIGNING_SECRET must be the 32-character signing secret from the Slack app, not a placeholder");
  }

  const config: AppConfig = {
    botName,
    triggerWords,
    slackBotToken: required("SLACK_BOT_TOKEN"),
    slackSigningSecret: signingSecret,
    siteBaseUrl,
    serviceKey,
    helpChannelId: optionalId("HELP_CHANNEL_ID"),
    communityChannelId: optionalId("COMMUNITY_CHANNEL_ID"),
    logChannelId: optionalId("LOG_CHANNEL_ID"),
    adminSlackIds: idList("ADMIN_SLACK_IDS"),
    orphanBotId: optionalId("ORPHAN_BOT_ID"),
    orphanReply,
    anthropicApiKey,
    chatEnabled,
    chatChime: bool("CHAT_CHIME", false),
    port: integer("PORT", 3000, 1, 65535),
    logLevel: (LOG_LEVELS as readonly string[]).includes(logLevel) ? (logLevel as Config["logLevel"]) : "info",
    emoji: { open: emojiOpen, resolved: emojiResolved },
  };

  if (problems.length > 0) throw new ConfigError(problems);
  return config;
}

// Keeps the Slack id shape so logs stay useful, hides the middle so the full id never appears.
export function redact(id: string): string {
  if (!id) return "";
  if (id.length <= 4) return "****";
  return `${id.slice(0, 2)}...${id.slice(-3)}`;
}
