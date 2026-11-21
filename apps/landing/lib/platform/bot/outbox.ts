// Pure rules for the outbox: the messages the site wants the Slack bot to send. No database; every function has a bun test
// (outbox.test.ts). The database wrappers are in outbox-data.ts.
//
// API:
//   OUTBOX_TEXT_MAX = 600, OUTBOX_CLAIM_MAX = 20, OUTBOX_LEASE_MS = 120000 (a claimed item is hidden this long)
//   BACKOFF_MINUTES = [1, 5, 30]               the wait after the 1st, 2nd and 3rd failed try; a 4th failure is final
//   FINAL_CODES = ["user_not_found", "cannot_dm_bot"]
//   siteBase(env?) -> string                   NEXT_PUBLIC_LOADOUT_SITE_URL or SITE_BASE_URL, without a trailing slash
//   clipOutbox(text) -> string                 600 characters at most
//   checkHref(href, base) -> Check<string | null>    a site path (starting with a single "/") or a link under the site
//   failDecision(attempts, code, final) -> { status: "pending", delayMs } | { status: "failed" }
//                                              attempts counts this failure (1 for the first)
//   notificationText(title, body?) -> string
//   noticeKind(kind) -> string                 "notice:<kind>", the outbox kind for a site notification
//   ticketReplyKind(ticketId) -> string        "ticket-reply:<ticketId>"
//   ticketReplyDedupe(ticketId, messageId) -> string
//   messageIdFromDedupe(dedupeKey) -> string | null    the TicketMessage id of a ticket reply, or null
import type { Check } from "./auth";
import { clipText } from "./tickets";

export const OUTBOX_TEXT_MAX = 600;
export const OUTBOX_CLAIM_MAX = 20;
export const OUTBOX_LEASE_MS = 120_000;
export const BACKOFF_MINUTES = [1, 5, 30] as const;
export const FINAL_CODES = ["user_not_found", "cannot_dm_bot"] as const;
const HREF_MAX = 300;

export function siteBase(env: Record<string, string | undefined> = process.env): string {
  return (env.NEXT_PUBLIC_LOADOUT_SITE_URL ?? env.SITE_BASE_URL ?? "").replace(/\/+$/, "");
}

export function clipOutbox(text: string): string {
  return clipText(text, OUTBOX_TEXT_MAX);
}

export function checkHref(href: string | null | undefined, base: string): Check<string | null> {
  if (href === null || href === undefined || href === "") return { ok: true, value: null };
  if (href.length > HREF_MAX) return { ok: false, message: `href must be at most ${HREF_MAX} characters` };
  const onSite = href.startsWith("/") && !href.startsWith("//");
  const underBase = base !== "" && href.startsWith(`${base}/`);
  if (onSite || underBase) return { ok: true, value: href };
  return { ok: false, message: "href must be a path on the site" };
}

// The first failure waits 1 minute, the second 5, the third 30. The fourth failure is final. A code in FINAL_CODES, or a bot
// that says so with `final`, ends the item at once.
export function failDecision(attempts: number, code: string, final: boolean): { status: "pending"; delayMs: number } | { status: "failed" } {
  const finalCode = (FINAL_CODES as readonly string[]).includes(code);
  if (final || finalCode || attempts > BACKOFF_MINUTES.length) return { status: "failed" };
  return { status: "pending", delayMs: BACKOFF_MINUTES[attempts - 1] * 60_000 };
}

export function notificationText(title: string, body?: string): string {
  return clipOutbox(body ? `${title}\n${body}` : title);
}

export function noticeKind(kind: string): string {
  return `notice:${kind}`;
}

export function ticketReplyKind(ticketId: string): string {
  return `ticket-reply:${ticketId}`;
}

export function ticketReplyDedupe(ticketId: string, messageId: string): string {
  return `ticket-reply:${ticketId}:${messageId}`;
}

export function messageIdFromDedupe(dedupeKey: string): string | null {
  const match = /^ticket-reply:[^:]+:(.+)$/.exec(dedupeKey);
  return match ? match[1] : null;
}
