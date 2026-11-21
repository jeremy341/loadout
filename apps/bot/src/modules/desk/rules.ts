// Pure help-desk rules, no I/O.
// API: eligible(message) -> is this a new question; isOnlyEmoji(text); parseMacro(text, isHelper) -> resolve | reopen | faq | null;
//      shouldAutoClose(ticket, now) -> quiet for 5 days; looksNonEnglish(text); parseMuteCommand(text, botName) -> stop | start | null;
//      escapeMrkdwn(text) for Slack mrkdwn bodies.
import type { TicketRow } from "../../types";

export type MessageLike = {
  subtype?: string;
  bot_id?: string;
  user?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
};

// Spec section 3: a human, top-level message of at least 8 characters that is not only emoji or whitespace.
export function eligible(message: MessageLike): boolean {
  if (message.subtype) return false; // edits, joins, bot_message and the like
  if (message.bot_id || !message.user) return false;
  if (message.thread_ts && message.thread_ts !== message.ts) return false;
  const text = (message.text ?? "").trim();
  if ([...text].length < 8) return false;
  return !isOnlyEmoji(text);
}

// Slack shortcodes (:eyes:), unicode pictographs, skin tones, joiners and whitespace are all removed. What is left
// must have a letter or digit, or the message counts as emoji only.
const SHORTCODE = /:[a-z0-9_+-]+(?:::skin-tone-\d)?:/gi;
const EMOJI_PARTS = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\u{FE0F}\u{200D}\u{20E3}\s]/gu;

export function isOnlyEmoji(text: string): boolean {
  const rest = text.replace(SHORTCODE, "").replace(EMOJI_PARTS, "");
  return rest.length === 0;
}

export type Macro = "resolve" | "reopen" | "faq";

const MACROS = new Map<string, Macro>([
  ["?resolve", "resolve"],
  ["?close", "resolve"],
  ["?reopen", "reopen"],
  ["?faq", "faq"],
]);

// Only helpers may run a macro, and only the first word counts. The rest of the message is ignored.
export function parseMacro(text: string, isHelper: boolean): Macro | null {
  if (!isHelper) return null;
  const first = text.trim().split(/\s+/)[0]?.toLowerCase();
  if (!first) return null;
  return MACROS.get(first) ?? null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const AUTO_CLOSE_IDLE_DAYS = 5;

// Spec section 3: open for 5 days or more, the last thread message is 5 days or older, and not marked keep open.
export function shouldAutoClose(
  ticket: Pick<TicketRow, "status" | "keepOpen" | "createdAt" | "lastMessageAt">,
  now: Date | number,
): boolean {
  if (ticket.status !== "open" || ticket.keepOpen) return false;
  const at = typeof now === "number" ? now : now.getTime();
  const idle = AUTO_CLOSE_IDLE_DAYS * DAY_MS;
  const created = Date.parse(ticket.createdAt);
  const lastMessage = Date.parse(ticket.lastMessageAt);
  if (Number.isNaN(created) || Number.isNaN(lastMessage)) return false;
  return at - created >= idle && at - lastMessage >= idle;
}

// Spec section 3: a question that is clearly not English gets a "please write in English" placeholder.
// Judged on letters only: if most letters are not basic Latin, it is not English.
export function looksNonEnglish(text: string): boolean {
  const letters = [...text].filter((c) => /\p{L}/u.test(c));
  if (letters.length < 8) return false;
  const latin = letters.filter((c) => /[A-Za-z]/.test(c)).length;
  return latin / letters.length < 0.6;
}

export type MuteCommand = "stop" | "start";

// Spec section 6: the message is exactly the bot's name followed by STOP or START.
export function parseMuteCommand(text: string, botName: string): MuteCommand | null {
  const said = text.trim().toUpperCase();
  const name = botName.toUpperCase();
  if (said === `${name}STOP`) return "stop";
  if (said === `${name}START`) return "start";
  return null;
}

// Slack mrkdwn treats &, < and > as control characters, so bodies built from site or model text escape them.
export function escapeMrkdwn(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
