// Pure rules for the Slack helper list and the bot admins. No database; every function has a bun test (helpers.test.ts).
// The writes are in helpers-data.ts.
//
// API:
//   parseAdminSlackIds(raw) -> string[]       BOT_ADMIN_SLACK_IDS as a comma list; blanks and malformed ids dropped
//   isBotAdmin(slackId, admins) -> boolean
//   checkHelperId(raw) -> Check<string>        a person's Slack id (U or W), never a bot or channel id
//   helperReason(change) -> string            the audit reason; always at least 10 characters
import type { Check } from "./auth";

const HUMAN_ID = /^[UW][A-Z0-9]{8,20}$/;

export function parseAdminSlackIds(raw: string | undefined): string[] {
  if (!raw) return [];
  const ids = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => HUMAN_ID.test(part));
  return [...new Set(ids)];
}

export function isBotAdmin(slackId: string, admins: readonly string[]): boolean {
  return admins.includes(slackId);
}

export function checkHelperId(raw: unknown): Check<string> {
  if (typeof raw === "string" && HUMAN_ID.test(raw)) return { ok: true, value: raw };
  return { ok: false, message: "slackId must be a person's Slack id" };
}

export function helperReason(change: "added" | "removed"): string {
  return `Slack helper list: a helper was ${change} by an admin in Slack`;
}
