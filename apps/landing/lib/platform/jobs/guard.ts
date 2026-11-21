// The bearer guard for the cron endpoints (app/api/cron/[job]). CRON_SECRET is the only way in — no session, no service
// key, no query-string fallback — and the guard fails closed: with no secret in the environment every request is
// refused, so a deployment without the env var can never run a job. Vercel's cron sends
// `Authorization: Bearer CRON_SECRET` automatically once the variable is set.
//
// Pure: takes the header and the secret so the caller (and the tests) decide where they come from. The comparison
// hashes both sides and uses timingSafeEqual over the digests, the same shape as the service keys
// (lib/platform/service-keys.ts): constant time, and never an exception on unequal lengths.
//
// API:
//   cronBearerOk(header, secret)     true only for "Bearer <secret>" when the secret is set; false otherwise
import { createHash, timingSafeEqual } from "crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function cronBearerOk(header: string | null, secret: string | undefined): boolean {
  // An empty or missing secret means "not configured": nothing may run.
  if (!secret) return false;
  if (!header) return false;
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) return false;
  return timingSafeEqual(digest(match[1]), digest(secret));
}
