// Signature check for inbound webhooks. Scheme (same as Robert's documented webhooks): "sha256=" + hex HMAC-SHA256 of
// "<timestamp>.<raw body>", keyed by a shared secret. The raw bytes are signed, the comparison is constant time, and a timestamp
// more than five minutes from now is refused so a captured request cannot be replayed later.
//
// The secret comes from the caller (the route reads LOADOUT_FRAUD_WEBHOOK_SECRET). A missing or short secret means "not configured":
// nothing is accepted, and the route answers 503 rather than a false 401.
import { createHmac, timingSafeEqual } from "node:crypto";

export const WEBHOOK_TIMESTAMP_HEADER = "x-loadout-timestamp";
export const WEBHOOK_SIGNATURE_HEADER = "x-loadout-signature";
export const WEBHOOK_TOLERANCE_SECONDS = 300;
export const WEBHOOK_MIN_SECRET_LENGTH = 16;
export const WEBHOOK_MAX_BODY_BYTES = 64 * 1024;

export type WebhookVerdict = { ok: true } | { ok: false; reason: "not_configured" | "missing" | "malformed" | "stale" | "mismatch" };

export function signWebhook(secret: string, timestamp: string, rawBody: string): string {
  return "sha256=" + createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

type WebhookInput = {
  secret: string | undefined;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  now?: Date;
};

const fail = (reason: Extract<WebhookVerdict, { ok: false }>["reason"]): WebhookVerdict => ({ ok: false, reason });

function isMalformed(timestamp: string, signature: string): boolean {
  return !/^\d{1,12}$/.test(timestamp) || !/^sha256=[0-9a-f]{64}$/.test(signature);
}

function isStale(timestamp: string, now: Date | undefined): boolean {
  const seconds = (now ?? new Date()).getTime() / 1000;
  return Math.abs(seconds - Number(timestamp)) > WEBHOOK_TOLERANCE_SECONDS;
}

function signaturesMatch(expected: string, given: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyWebhook(input: WebhookInput): WebhookVerdict {
  const secret = (input.secret ?? "").trim();
  if (secret.length < WEBHOOK_MIN_SECRET_LENGTH) return fail("not_configured");
  const { timestamp, signature } = input;
  if (!timestamp || !signature) return fail("missing");
  if (isMalformed(timestamp, signature)) return fail("malformed");
  if (isStale(timestamp, input.now)) return fail("stale");
  return signaturesMatch(signWebhook(secret, timestamp, input.rawBody), signature) ? { ok: true } : fail("mismatch");
}
