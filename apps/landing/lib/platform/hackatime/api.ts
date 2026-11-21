// Typed client for the Hackatime API (hackatime.hackclub.com). Server only.
// Shapes follow Pixl's reference (references/pixl/apps/internal-dashboard/lib/hackatime.ts). Per-user endpoints answer without a
// token; HACKATIME_API_TOKEN is sent as a bearer when set. Tokens and response bodies never appear in errors or logs.
//
// API:
//   fetchProjects(hackatimeUserId, deps?)                 -> { name, seconds }[]   /users/{id}/stats?features=projects
//   fetchDailySeconds(hackatimeUserId, fromDay, toDay, deps?) -> DailyRow[]      projects, then their spans split by UTC day
//   dailySecondsFor(hackatimeUserId, names, fromDay, toDay, deps?) -> DailyRow[] same, for project names already fetched
//   splitSpanByDay(startUnix, endUnix)                    -> { day, seconds }[]   pure, UTC days
//   isValidHackatimeUserId(id)                            -> boolean
//   HackatimeApiError                                     .code is one of HackatimeErrorCode
//
// Errors: 401 unauthorized, 404 not_found, 429 rate_limited, 5xx upstream_error, other 4xx bad_request, no answer in 8 s timeout,
// connection failure network, unexpected shape bad_response. No retries.
// Env: HACKATIME_BASE (optional, default https://hackatime.hackclub.com), HACKATIME_API_TOKEN (optional bearer).

export type HackatimeErrorCode =
  | "invalid_user_id"
  | "unauthorized"
  | "not_found"
  | "rate_limited"
  | "upstream_error"
  | "bad_request"
  | "timeout"
  | "network"
  | "bad_response";

export class HackatimeApiError extends Error {
  code: HackatimeErrorCode;

  constructor(code: HackatimeErrorCode) {
    super(code);
    this.name = "HackatimeApiError";
    this.code = code;
  }
}

export type ProjectTotal = { name: string; seconds: number };
export type DailyRow = { day: string; name: string; seconds: number };

// fetch and the timeout can be replaced in tests; production uses the globals.
export type ApiDeps = { fetch?: typeof fetch; timeoutMs?: number; token?: string | null };

const DEFAULT_BASE = "https://hackatime.hackclub.com";
const TIMEOUT_MS = 8000;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_SECONDS = 86400;
const MAX_NAME_LENGTH = 200;

export function isValidHackatimeUserId(id: unknown): id is string {
  return typeof id === "string" && ID_PATTERN.test(id);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function statusError(status: number): HackatimeApiError {
  if (status === 401) return new HackatimeApiError("unauthorized");
  if (status === 404) return new HackatimeApiError("not_found");
  if (status === 429) return new HackatimeApiError("rate_limited");
  if (status >= 500) return new HackatimeApiError("upstream_error");
  return new HackatimeApiError("bad_request");
}

async function getJson(path: string, deps: ApiDeps): Promise<unknown> {
  const doFetch = deps.fetch ?? fetch;
  const base = (process.env.HACKATIME_BASE ?? DEFAULT_BASE).replace(/\/$/, "");
  const token = deps.token !== undefined ? deps.token : (process.env.HACKATIME_API_TOKEN ?? "").trim() || null;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // One timer covers the request and the body read. A controller timer rather than AbortSignal.timeout, which does not fire for
  // a hung request under bun.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await doFetch(base + path, { headers, signal: controller.signal });
    } catch (e) {
      const name = (e as { name?: unknown })?.name;
      throw new HackatimeApiError(name === "TimeoutError" || name === "AbortError" || controller.signal.aborted ? "timeout" : "network");
    }
    if (!res.ok) throw statusError(res.status);
    try {
      return await res.json();
    } catch {
      throw new HackatimeApiError(controller.signal.aborted ? "timeout" : "bad_response");
    }
  } finally {
    clearTimeout(timer);
  }
}

function parseProjects(body: unknown): ProjectTotal[] {
  const root = asRecord(body);
  const data = asRecord(root?.data);
  const raw = Array.isArray(data?.projects) ? data.projects : Array.isArray(root?.projects) ? root.projects : null;
  if (!raw) throw new HackatimeApiError("bad_response");
  const out: ProjectTotal[] = [];
  for (const item of raw) {
    const p = asRecord(item);
    if (!p || (p.name !== undefined && typeof p.name !== "string")) throw new HackatimeApiError("bad_response");
    const name = typeof p.name === "string" ? p.name.trim() : "";
    if (name === "" || name.length > MAX_NAME_LENGTH) continue;
    const seconds = Number(p.total_seconds ?? p.seconds ?? 0);
    out.push({ name, seconds: Number.isFinite(seconds) ? seconds : 0 });
  }
  return out;
}

type Span = { start: number; end: number };

function parseSpans(body: unknown): Span[] {
  const root = asRecord(body);
  if (!root) throw new HackatimeApiError("bad_response");
  if (root.spans === undefined) return [];
  if (!Array.isArray(root.spans)) throw new HackatimeApiError("bad_response");
  const spans: Span[] = [];
  for (const item of root.spans) {
    const s = asRecord(item);
    if (!s) continue;
    const start = Number(s.start_time) || 0;
    const end = Number(s.end_time) || 0;
    if (end > start) spans.push({ start, end });
  }
  return spans;
}

// Splits [startUnix, endUnix) into UTC calendar days. Seconds can be fractional; callers round.
export function splitSpanByDay(startUnix: number, endUnix: number): { day: string; seconds: number }[] {
  const out: { day: string; seconds: number }[] = [];
  let t = startUnix;
  while (t < endUnix) {
    const dayStart = Math.floor(t / DAY_SECONDS) * DAY_SECONDS;
    const segEnd = Math.min(endUnix, dayStart + DAY_SECONDS);
    out.push({ day: new Date(dayStart * 1000).toISOString().slice(0, 10), seconds: segEnd - t });
    t = segEnd;
  }
  return out;
}

export async function fetchProjects(hackatimeUserId: string, deps: ApiDeps = {}): Promise<ProjectTotal[]> {
  if (!isValidHackatimeUserId(hackatimeUserId)) throw new HackatimeApiError("invalid_user_id");
  const body = await getJson(`/api/v1/users/${encodeURIComponent(hackatimeUserId)}/stats?features=projects`, deps);
  return parseProjects(body);
}

// Spans for each project name, one request at a time, clipped to [fromDay, toDay] (both inclusive, UTC).
export async function dailySecondsFor(
  hackatimeUserId: string,
  names: string[],
  fromDay: string,
  toDay: string,
  deps: ApiDeps = {},
): Promise<DailyRow[]> {
  if (!isValidHackatimeUserId(hackatimeUserId)) throw new HackatimeApiError("invalid_user_id");
  if (!DAY_PATTERN.test(fromDay) || !DAY_PATTERN.test(toDay) || fromDay > toDay) {
    throw new HackatimeApiError("bad_request");
  }
  const fromUnix = Date.parse(`${fromDay}T00:00:00Z`) / 1000;
  const toUnix = Date.parse(`${toDay}T00:00:00Z`) / 1000 + DAY_SECONDS;
  const totals = new Map<string, number>();

  for (const name of [...new Set(names)]) {
    const path =
      `/api/v1/users/${encodeURIComponent(hackatimeUserId)}/heartbeats/spans` +
      `?filter_by_project=${encodeURIComponent(name)}`;
    const spans = parseSpans(await getJson(path, deps));
    for (const span of spans) {
      const lo = Math.max(span.start, fromUnix);
      const hi = Math.min(span.end, toUnix);
      if (hi <= lo) continue;
      for (const part of splitSpanByDay(lo, hi)) {
        const key = `${part.day}\u0000${name}`;
        totals.set(key, (totals.get(key) ?? 0) + part.seconds);
      }
    }
  }

  const rows: DailyRow[] = [];
  for (const [key, seconds] of totals) {
    const [day, name] = key.split("\u0000");
    const rounded = Math.round(seconds);
    if (rounded > 0) rows.push({ day, name, seconds: rounded });
  }
  return rows.sort((a, b) => (a.day === b.day ? a.name.localeCompare(b.name) : a.day < b.day ? -1 : 1));
}

export async function fetchDailySeconds(
  hackatimeUserId: string,
  fromDay: string,
  toDay: string,
  deps: ApiDeps = {},
): Promise<DailyRow[]> {
  const projects = await fetchProjects(hackatimeUserId, deps);
  return dailySecondsFor(hackatimeUserId, projects.map((p) => p.name), fromDay, toDay, deps);
}
