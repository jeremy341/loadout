// Pure parsing for /loadout-remind, /loadout-countdown and /loadout-poll (spec section 7).
// API: parseDuration(text) -> { ms } | { error }, parsePoll(text) -> { question, options, durationMs? } | { error }.
// Why: the parsing is the part most likely to be wrong, so it has no Slack or site dependency and is tested alone.

export const MIN_DURATION_MS = 1000;
export const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
export const MAX_POLL_OPTIONS = 9;
export const MAX_POLL_QUESTION = 280;

export type DurationError = "empty" | "format" | "too_short" | "too_long";
export type DurationResult = { ms: number } | { error: DurationError };

// Accepts "90s", "10min", "2h", "1h30min", "1h 30min 15s". Units are fixed: s, min, h.
const DURATION_RE = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?\s*(?:(\d+)\s*s)?$/;

export function parseDuration(text: string): DurationResult {
  const cleaned = text.trim().toLowerCase();
  if (cleaned.length === 0) return { error: "empty" };
  const match = DURATION_RE.exec(cleaned);
  // A bare "" after trimming means nothing matched a unit, so reject it as a format error.
  if (!match || (match[1] === undefined && match[2] === undefined && match[3] === undefined)) return { error: "format" };
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const ms = (hours * 3600 + minutes * 60 + seconds) * 1000;
  if (ms < MIN_DURATION_MS) return { error: "too_short" };
  if (ms > MAX_DURATION_MS) return { error: "too_long" };
  return { ms };
}

export type PollError = "empty" | "no_question" | "question_too_long" | "too_few_options" | "too_many_options";
export type PollParse = { question: string; options: string[]; durationMs?: number };
export type PollResult = PollParse | { error: PollError };

// "Question; A, B, C [, 10min]". The first ';' ends the question. If the last comma part parses as a duration
// it is the close time, not an option, so a poll option cannot be a bare duration like "5s".
export function parsePoll(text: string): PollResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { error: "empty" };
  const semi = trimmed.indexOf(";");
  if (semi === -1) return { error: "no_question" };
  const question = trimmed.slice(0, semi).trim();
  if (question.length === 0) return { error: "no_question" };
  if (question.length > MAX_POLL_QUESTION) return { error: "question_too_long" };

  const parts = trimmed
    .slice(semi + 1)
    .split(",")
    .map((p) => p.trim());
  // A trailing comma is harmless, so drop empty tail parts before looking for the duration.
  while (parts.length > 0 && parts[parts.length - 1] === "") parts.pop();
  let durationMs: number | undefined;
  const last = parts[parts.length - 1];
  if (parts.length > 1 && last !== undefined) {
    const parsed = parseDuration(last);
    if ("ms" in parsed) {
      durationMs = parsed.ms;
      parts.pop();
    }
  }
  const options = parts.filter((p) => p.length > 0);
  if (options.length < 2) return { error: "too_few_options" };
  if (options.length > MAX_POLL_OPTIONS) return { error: "too_many_options" };
  return durationMs === undefined ? { question, options } : { question, options, durationMs };
}

export const POLL_ERROR_TEXT: Record<PollError, string> = {
  empty: "Use: /loadout-poll Question; A, B, C [, 10min]",
  no_question: "Put the question first, then a semicolon, then the options.",
  question_too_long: "The question must be 280 characters or fewer.",
  too_few_options: "A poll needs at least 2 options.",
  too_many_options: "A poll can have at most 9 options.",
};

export const DURATION_ERROR_TEXT: Record<DurationError, string> = {
  empty: "Give a time, like 10min, 90s, 2h or 1h30min.",
  format: "I could not read that time. Use s, min or h, like 10min, 90s, 2h or 1h30min.",
  too_short: "The shortest time is 1 second.",
  too_long: "The longest time is 24 hours.",
};

// Payload guards for jobs read back from the site, so a bad row is skipped rather than crashing the scheduler.
export type ReminderPayload = { text: string; channelId?: string };
export type CountdownPayload = { label: string; channelId: string };
export type PollPayload = { question: string; options: string[]; channelId: string; messageTs: string };

export function isReminderPayload(p: Record<string, unknown>): p is Record<string, unknown> & ReminderPayload {
  return typeof p.text === "string";
}

export function isCountdownPayload(p: Record<string, unknown>): p is Record<string, unknown> & CountdownPayload {
  return typeof p.label === "string" && typeof p.channelId === "string";
}

export function isPollPayload(p: Record<string, unknown>): p is Record<string, unknown> & PollPayload {
  return (
    typeof p.question === "string" &&
    typeof p.channelId === "string" &&
    typeof p.messageTs === "string" &&
    Array.isArray(p.options) &&
    p.options.every((o) => typeof o === "string")
  );
}
