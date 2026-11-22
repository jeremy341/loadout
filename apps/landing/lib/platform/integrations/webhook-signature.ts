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

export function verifyWebhook(input: {
  secret: string | undefined;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  now?: Date;
}): WebhookVerdict {
  const secret = (input.secret ?? "").trim();
  if (secret.length < WEBHOOK_MIN_SECRET_LENGTH) return { ok: false, reason: "not_configured" };
  if (!input.timestamp || !input.signature) return { ok: false, reason: "missing" };
  if (!/^\d{1,12}$/.test(input.timestamp) || !/^sha256=[0-9a-f]{64}$/.test(input.signature)) return { ok: false, reason: "malformed" };
  const now = (input.now ?? new Date()).getTime() / 1000;
  if (Math.abs(now - Number(input.timestamp)) > WEBHOOK_TOLERANCE_SECONDS) return { ok: false, reason: "stale" };
  const expected = Buffer.from(signWebhook(secret, input.timestamp, input.rawBody));
  const given = Buffer.from(input.signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? { ok: true } : { ok: false, reason: "mismatch" };
}
