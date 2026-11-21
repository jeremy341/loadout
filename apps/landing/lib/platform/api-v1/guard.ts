// The one wrapper every /api/v1 route is built with. It assigns the request id, reads the bearer key, applies the rate limits,
// checks the scope, adds the X-Request-Id and X-RateLimit headers and turns every failure into { error: { code, message } }.
// The API is read only: a route built with apiRoute exports GET only (api-v1 route test enforces that).
//
// Order for each request:
//   1. A bearer key that is refused (unknown, revoked, expired, banned or erased) is audited at most once a minute per IP, then
//      the IP limit applies, then 401 (403 for a banned or erased account).
//   2. No bearer: the IP limit applies, then 401 unless the route is `anonymous` (docs and the OpenAPI document).
//   3. A good key: API_KEY_MINUTE and API_KEY_DAY (and EXPORT_DAY for `exportLimit` routes), then the scope check (403).
//   4. The handler runs. An unexpected error is a 500 with a generic message; the error text is never returned or logged.
//
// API:
//   apiRoute({ scope?, anonymous?, exportLimit? }, handler) -> (request, context?) => Promise<Response>
//   clientIp(request) -> string                 re-exported from ../client-ip: forwarding headers count only behind a trusted proxy
//   personOf(call) -> string                    the key owner on a scoped route (throws if the guard was bypassed)
//   apiError(status, code, message) -> Response { error: { code, message } }
//   pickLimitHeaders(results) -> Record<string, string>   the most constrained limit (or the one that refused)
//   withHeaders(response, headers) -> Response
//   exportLimitKey(personId) -> string            the one daily export counter, shared with the Settings download
//
// Every response carries Cache-Control: no-store unless the handler set its own (the public OpenAPI and docs routes do).
import { recordAudit } from "../audit";
import { authenticateBearer, recordKeyRejection, type AuthFailure } from "../api-keys-data";
import { hasScope, type ApiScope } from "../api-keys";
import { db } from "../db";
import { dataExportAudit } from "../privacy-data";
import { checkLimit, rateLimitHeaders, RATE_LIMIT_PRESETS, type LimitResult } from "../rate-limit-db";
import { createRateLimiter } from "../rate-limit";
import { clientIp } from "../client-ip";
import { auditPathOf } from "../service-keys";
import { logLine, REQUEST_ID_HEADER, requestId } from "../request-id";

export type ApiCall = {
  requestId: string;
  url: URL;
  params: Record<string, string>;
  // The person the key belongs to. Null only on an `anonymous` route called without a key.
  personId: string | null;
};

export type ApiRouteOptions = {
  scope?: ApiScope;
  anonymous?: boolean;
  exportLimit?: boolean;
};

type RouteContext = { params: Promise<Record<string, string | string[] | undefined>> } | undefined;

const AUDIT_EVERY_MS = 60_000;
// One refused-key audit row per IP per minute, so a flood of bad keys cannot fill the audit table.
const rejectionAudit = createRateLimiter({ limit: 1, windowMs: AUDIT_EVERY_MS });

export { clientIp };

// Settings and /api/v1/me/export count against the same two-a-day allowance. Moving this key is a quota change for both.
export function exportLimitKey(personId: string): string {
  return `export:${personId}:day`;
}

export function apiError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

// The limit that matters most to the caller: a refused one first, then the one with the fewest requests left.
export function pickLimitHeaders(results: readonly LimitResult[]): Record<string, string> {
  if (results.length === 0) return {};
  const refused = results.find((r) => !r.ok);
  const chosen = refused ?? [...results].sort((a, b) => a.remaining - b.remaining)[0];
  return rateLimitHeaders(chosen);
}

export function withHeaders(response: Response, headers: Record<string, string>): Response {
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}

const AUTH_MESSAGES: Record<AuthFailure, string> = {
  missing_key: "Send your API key as Authorization: Bearer <key>.",
  invalid_key: "That API key is not valid.",
  revoked_key: "That API key was revoked.",
  expired_key: "That API key has expired. Make a new one in Settings.",
  account_disabled: "This account cannot use the API.",
};

const SCOPE_MESSAGE = "This key does not have the permission this route needs.";

function limitedResponse(headers: Record<string, string>): Response {
  return withHeaders(apiError(429, "rate_limited", "Too many requests. Wait a little and try again."), headers);
}

// Runs one request through the checks. Returns the response and the rate limit headers to add to it.
async function run(
  request: Request,
  call: { requestId: string; url: URL; params: Record<string, string> },
  options: ApiRouteOptions,
  handler: (call: ApiCall) => Promise<Response>,
): Promise<{ response: Response; headers: Record<string, string> }> {
  const ip = clientIp(request);
  const method = request.method;
  // Audits store a route pattern, never the raw pathname: an id or other caller-chosen segment is attacker-controlled text.
  const path = auditPathOf(request.url);
  const bearer = request.headers.get("authorization");
  const hasBearer = bearer !== null && bearer.trim() !== "";

  // The per-IP limit applies to every request, including one with a key, and is checked before any key lookup. A flood of bad
  // keys therefore cannot skip the IP gate, and an over-limit IP is answered 429 without spending a database key read.
  const ipLimit = await checkLimit({ key: `api-ip:${ip}:minute`, ...RATE_LIMIT_PRESETS.API_IP_MINUTE });
  const ipHeaders = pickLimitHeaders([ipLimit]);
  if (!ipLimit.ok) return { response: limitedResponse(ipHeaders), headers: ipHeaders };

  if (!hasBearer) {
    if (!options.anonymous) {
      return { response: withHeaders(apiError(401, "missing_key", AUTH_MESSAGES.missing_key), ipHeaders), headers: ipHeaders };
    }
    return { response: await handler({ ...call, personId: null }), headers: ipHeaders };
  }

  const auth = await authenticateBearer(bearer);
  if (!auth.ok) {
    if (rejectionAudit.check(`audit:${ip}`).ok) {
      await recordKeyRejection({ code: auth.code, keyId: auth.keyId, personId: auth.personId, method, path }).catch(() => undefined);
    }
    return {
      response: withHeaders(apiError(auth.status, auth.code, AUTH_MESSAGES[auth.code]), ipHeaders),
      headers: ipHeaders,
    };
  }

  const personId = auth.person.id;
  const results = [
    await checkLimit({ key: `api-key:${auth.key.id}:minute`, ...RATE_LIMIT_PRESETS.API_KEY_MINUTE }),
    await checkLimit({ key: `api-key:${auth.key.id}:day`, ...RATE_LIMIT_PRESETS.API_KEY_DAY }),
  ];
  if (options.exportLimit) {
    results.push(await checkLimit({ key: exportLimitKey(personId), ...RATE_LIMIT_PRESETS.EXPORT_DAY }));
  }
  const headers = pickLimitHeaders(results);
  if (results.some((r) => !r.ok)) return { response: limitedResponse(headers), headers };

  if (options.scope && !hasScope(auth.key.scopes, options.scope)) {
    return { response: withHeaders(apiError(403, "insufficient_scope", SCOPE_MESSAGE), headers), headers };
  }
  const response = await handler({ ...call, personId });
  if (options.exportLimit && response.ok) {
    await recordAudit(db(), dataExportAudit(personId, "api", personId, auth.key.id));
  }
  return { response, headers };
}

// Builds a GET route. Next passes `context.params` as a promise in version 15 and later.
export function apiRoute(options: ApiRouteOptions, handler: (call: ApiCall) => Promise<Response>) {
  return async function route(request: Request, context?: RouteContext): Promise<Response> {
    const id = requestId(request);
    const url = new URL(request.url);
    const raw = context?.params ? await context.params : {};
    const params: Record<string, string> = {};
    for (const [name, value] of Object.entries(raw)) {
      if (typeof value === "string") params[name] = value;
    }
    const started = Date.now();
    let outcome: { response: Response; headers: Record<string, string> };
    try {
      outcome = await run(request, { requestId: id, url, params }, options, handler);
    } catch (error) {
      // Only the error name is logged: a message can carry database or key detail.
      console.error(logLine(id, "api.error", { method: request.method, path: url.pathname, name: (error as Error)?.name ?? "error" }));
      outcome = { response: apiError(500, "internal", "Something went wrong on our side. Try again."), headers: {} };
    }
    const response = withHeaders(outcome.response, { ...outcome.headers, [REQUEST_ID_HEADER]: id });
    // Key-bound data must never sit in a shared cache. A handler that set its own policy (the public docs) keeps it.
    if (!response.headers.has("cache-control")) response.headers.set("Cache-Control", "no-store");
    console.info(
      logLine(id, "api.request", {
        method: request.method,
        path: url.pathname,
        status: response.status,
        ms: Date.now() - started,
      }),
    );
    return response;
  };
}

// The signed-in person of a scoped route. The guard always sets it on those routes, so a missing one is a bug and a 500.
export function personOf(call: ApiCall): string {
  if (!call.personId) throw new Error("scoped API route reached without a person");
  return call.personId;
}
