// Auth, body checks and JSON helpers for the Slack bot's internal routes (app/api/internal/bot). Only the `slack-bot` service
// key may call them (lib/platform/service-keys.ts). The checks are pure and tested in auth.test.ts. The database modules load
// lazily, so the tests never reach Prisma.
//
// API:
//   BOT_SERVICE, BOT_ROUTE_LIMIT (300 a minute per route), MAX_BODY_CHARS (16000)
//   type Check<T> = { ok: true; value: T } | { ok: false; message: string }
//   isSlackId(raw), checkSlackId(raw, field), checkSlackTs(raw, field), checkRouteId(raw, field), checkCode(raw, field)
//   checkText(raw, field, max, required)       trimmed; counts characters, not bytes
//   checkOptionalText(raw, field, max)         undefined leaves a field alone; null or blank clears it
//   checkOptionalSlackId(raw, field)           undefined leaves a field alone; null clears it
//   checkEnum(raw, field, values), checkBool(raw, field)
//   optionalWith(raw, check)                   undefined stays undefined, otherwise the check runs
//   nullableWith(raw, check)                   undefined or null becomes null, otherwise the check runs
//   checkFields(body, allowed)                 a plain object with no unknown keys
//   queryText(url, name, max, required?)       one query parameter, trimmed
//   readJson(request, optional?)               at most MAX_BODY_CHARS; invalid JSON is refused
//   botJson(id, body, status?), botError(id, status, code, message?), botInvalid(id, message)
//   requireBot(request, deps?)                 401/403 JSON, or null when the caller may continue
//   botGuard(request, route, deps?)            requireBot, then the per-route minute limit (429)
import { requestId } from "../request-id";
import { requireServiceKey, type EnvSource, type ServiceKeyAudit } from "../service-keys";

export const BOT_SERVICE = "slack-bot" as const;
export const BOT_ROUTE_LIMIT = 300;
export const MAX_BODY_CHARS = 16_000;
const MINUTE_MS = 60_000;

export type Check<T> = { ok: true; value: T } | { ok: false; message: string };
export type BotAuthDeps = { env?: EnvSource; audit?: ServiceKeyAudit };

const SLACK_ID = /^[CGUBW][A-Z0-9]{8,20}$/;
const SLACK_TS = /^\d{10}\.\d{6}$/;
const ROUTE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const CODE = /^[a-z][a-z0-9_]{0,39}$/;

function fail(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

export function isSlackId(raw: unknown): raw is string {
  return typeof raw === "string" && SLACK_ID.test(raw);
}

export function checkSlackId(raw: unknown, field: string): Check<string> {
  return isSlackId(raw) ? { ok: true, value: raw } : fail(`${field} must be a Slack id`);
}

export function checkSlackTs(raw: unknown, field: string): Check<string> {
  return typeof raw === "string" && SLACK_TS.test(raw) ? { ok: true, value: raw } : fail(`${field} must be a Slack message timestamp`);
}

// Ids in our own tables (cuid-like). Anything else is refused before it reaches a query.
export function checkRouteId(raw: unknown, field: string): Check<string> {
  return typeof raw === "string" && ROUTE_ID.test(raw) ? { ok: true, value: raw } : fail(`${field} is not a valid id`);
}

// Short machine codes such as "channel_not_found". Lower case, no spaces.
export function checkCode(raw: unknown, field: string): Check<string> {
  return typeof raw === "string" && CODE.test(raw) ? { ok: true, value: raw } : fail(`${field} must be a short lower-case code`);
}

// Trimmed text, at most `max` characters (code points, so an emoji counts once).
export function checkText(raw: unknown, field: string, max: number, required: boolean): Check<string> {
  if (typeof raw !== "string") return fail(`${field} must be text`);
  const value = raw.trim();
  if (required && value === "") return fail(`${field} is required`);
  if (Array.from(value).length > max) return fail(`${field} must be at most ${max} characters`);
  return { ok: true, value };
}

export function checkOptionalText(raw: unknown, field: string, max: number): Check<string | null | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw === null) return { ok: true, value: null };
  const text = checkText(raw, field, max, false);
  if (!text.ok) return text;
  return { ok: true, value: text.value === "" ? null : text.value };
}

export function checkOptionalSlackId(raw: unknown, field: string): Check<string | null | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  if (raw === null) return { ok: true, value: null };
  return checkSlackId(raw, field);
}

export function checkEnum<T extends string>(raw: unknown, field: string, values: readonly T[]): Check<T> {
  return values.includes(raw as T) ? { ok: true, value: raw as T } : fail(`${field} must be one of ${values.join(", ")}`);
}

export function checkBool(raw: unknown, field: string): Check<boolean> {
  return typeof raw === "boolean" ? { ok: true, value: raw } : fail(`${field} must be true or false`);
}

export function optionalWith<T>(raw: unknown, check: (raw: unknown) => Check<T>): Check<T | undefined> {
  if (raw === undefined) return { ok: true, value: undefined };
  return check(raw);
}

export function nullableWith<T>(raw: unknown, check: (raw: unknown) => Check<T>): Check<T | null> {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  return check(raw);
}

// A plain JSON object with only the named keys. An unknown key is refused so a typo never gets silently dropped.
export function checkFields(body: unknown, allowed: readonly string[]): Check<Record<string, unknown>> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return fail("body must be a JSON object");
  const record = body as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) return fail(`unknown field: ${key.slice(0, 40)}`);
  }
  return { ok: true, value: record };
}

export function queryText(url: URL, name: string, max: number, required = true): Check<string> {
  return checkText(url.searchParams.get(name) ?? "", name, max, required);
}

// Reads the body as JSON. An empty body is `{}` when `optional` is set, otherwise refused.
export async function readJson(request: Request, optional = false): Promise<Check<unknown>> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return fail("body is too large");
  if (raw.trim() === "") return optional ? { ok: true, value: {} } : fail("body must be JSON");
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return fail("body must be valid JSON");
  }
}

export function botJson(id: string, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "x-request-id": id, "cache-control": "no-store" } });
}

export function botError(id: string, status: number, code: string, message?: string): Response {
  return botJson(id, message ? { error: code, message } : { error: code }, status);
}

export function botInvalid(id: string, message: string): Response {
  return botError(id, 400, "invalid_request", message);
}

async function authorise(request: Request, id: string, deps: BotAuthDeps): Promise<Response | null> {
  const result = await requireServiceKey(request, [BOT_SERVICE], deps);
  if (result.ok) return null;
  return result.status === 401 ? botError(id, 401, "unauthorized") : botError(id, 403, "forbidden");
}

// 401 for a missing or unknown key, 403 for a valid key that is not the bot's. Null means the caller may continue.
export async function requireBot(request: Request, deps: BotAuthDeps = {}): Promise<Response | null> {
  return authorise(request, requestId(request), deps);
}

// The auth check, then the per-route limit. Returns the request id so the route can echo it on its own responses.
export async function botGuard(request: Request, route: string, deps: BotAuthDeps = {}): Promise<{ id: string; denied: Response | null }> {
  const id = requestId(request);
  const denied = await authorise(request, id, deps);
  if (denied) return { id, denied };
  // Loaded lazily: the limiter needs the database client, which the pure tests must never reach.
  const limits = await import("../rate-limit-db");
  const result = await limits.checkLimit({ key: `bot:${route}:minute`, limit: BOT_ROUTE_LIMIT, windowMs: MINUTE_MS });
  if (!result.ok) {
    return { id, denied: Response.json({ error: "rate_limited" }, { status: 429, headers: { ...limits.rateLimitHeaders(result), "x-request-id": id } }) };
  }
  return { id, denied: null };
}
