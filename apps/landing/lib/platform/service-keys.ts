// Service-to-server authentication for the platform API. Each named caller has its own key in env, sent as the
// `x-loadout-service-key` header. No shared admin key and no query-string key.
// Modelled on references/pixl/apps/server/src/http/serviceKeys.ts.
//
// API:
//   SERVICE_KEY_HEADER                       "x-loadout-service-key"
//   SERVICE_KEY_ENV                          service name -> env var name
//   MIN_SERVICE_KEY_LENGTH                   32; shorter keys count as unset
//   matchServiceKey(given, env?) -> ServiceName | null
//   requireServiceKey(request, allowed, { env?, audit?, throttle? }) -> Promise<{ ok: true, service } | { ok: false, status: 401 | 403 }>
//   auditPathOf(url) -> string               the route pattern a URL matched (for example "/api/internal/bot/tickets/:id"), or "unmatched"
//
// A rejected key writes an AuditEvent (action `auth.service_key_rejected`), at most one a minute per client address so a flood of
// bad keys cannot fill the audit table. The key itself is never written, and neither is attacker-chosen path text: the row holds
// the route pattern the request matched, or "unmatched".
import { createHash, timingSafeEqual } from "crypto";
import { recordAudit } from "./audit";
import { clientIp } from "./client-ip";
import { routePatternOf } from "./public-routes";
import { createRateLimiter, type RateLimiter } from "./rate-limit";

export const SERVICE_KEY_HEADER = "x-loadout-service-key";

export type ServiceName = "reviewer" | "slack-bot" | "stats-job";

export const SERVICE_KEY_ENV: Readonly<Record<ServiceName, string>> = Object.freeze({
  reviewer: "SERVICE_KEY_REVIEWER",
  "slack-bot": "SERVICE_KEY_SLACK_BOT",
  "stats-job": "SERVICE_KEY_STATS_JOB",
});

// A key shorter than this is treated as unset, so a placeholder like "x" in an env file can never authenticate.
export const MIN_SERVICE_KEY_LENGTH = 32;

export type EnvSource = Record<string, string | undefined>;

export type ServiceAuthResult = { ok: true; service: ServiceName } | { ok: false; status: 401 | 403 };

export type RejectedServiceKey = {
  reason: "missing_key" | "unknown_key" | "not_permitted";
  method: string;
  path: string;
  service: ServiceName | null;
};

export type ServiceKeyAudit = (event: RejectedServiceKey) => Promise<void>;

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

// Compares sha256 digests so timingSafeEqual always sees equal-length buffers and the key length does not leak.
function keyMatches(given: string, expected: string | undefined): boolean {
  if (!expected || expected.length < MIN_SERVICE_KEY_LENGTH) return false;
  return timingSafeEqual(digest(given), digest(expected));
}

// Which service a key belongs to, or null. Every configured key is checked (no early exit) so the timing does
// not say which one matched.
export function matchServiceKey(given: string, env: EnvSource = process.env): ServiceName | null {
  if (!given) return null;
  let found: ServiceName | null = null;
  for (const name of Object.keys(SERVICE_KEY_ENV) as ServiceName[]) {
    if (keyMatches(given, env[SERVICE_KEY_ENV[name]]) && found === null) found = name;
  }
  return found;
}

// Default audit writer. The database module is loaded lazily so tests and key checks never touch Prisma.
async function auditRejection(event: RejectedServiceKey): Promise<void> {
  const { db } = await import("./db");
  await recordAudit(db(), {
    actorId: event.service ? `service:${event.service}` : "service:unknown",
    action: "auth.service_key_rejected",
    targetType: "http_request",
    targetId: `${METHODS.has(event.method.toUpperCase()) ? event.method.toUpperCase() : "OTHER"} ${event.path}`,
    reason: "Service key rejected",
    after: { reason: event.reason },
  });
}

// One audit row per client address per minute (per instance).
const rejectionAudit: RateLimiter = createRateLimiter({ limit: 1, windowMs: 60_000 });

// The route pattern a URL belongs to, never the raw path: a dynamic segment such as an id or a Slack id is attacker-chosen text.
export function auditPathOf(url: string): string {
  try {
    return routePatternOf(new URL(url).pathname) ?? "unmatched";
  } catch {
    return "unmatched";
  }
}

const METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

// Authenticates the caller as one of `allowed`. A missing or unknown key is 401; a valid key for a service that
// is not allowed on this route is 403. Both write an audit row. An audit failure is swallowed so a database
// outage cannot turn a clean 401 into a 500.
export async function requireServiceKey(
  request: Pick<Request, "headers" | "method" | "url">,
  allowed: readonly ServiceName[],
  options: { env?: EnvSource; audit?: ServiceKeyAudit; throttle?: RateLimiter } = {},
): Promise<ServiceAuthResult> {
  const env = options.env ?? process.env;
  const audit = options.audit ?? auditRejection;
  const given = (request.headers.get(SERVICE_KEY_HEADER) ?? "").trim();
  const service = matchServiceKey(given, env);
  const base = { method: request.method, path: auditPathOf(request.url) };
  const throttle = options.throttle ?? rejectionAudit;
  const mayAudit = () => throttle.check(`service-key:${clientIp(request)}`).ok;

  if (!service) {
    if (mayAudit()) await audit({ ...base, reason: given ? "unknown_key" : "missing_key", service: null }).catch(() => undefined);
    return { ok: false, status: 401 };
  }
  if (!allowed.includes(service)) {
    if (mayAudit()) await audit({ ...base, reason: "not_permitted", service }).catch(() => undefined);
    return { ok: false, status: 403 };
  }
  return { ok: true, service };
}
