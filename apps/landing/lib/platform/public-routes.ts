// Who may call each route under app/api. Modelled on references/pixl/apps/server/src/http/publicRoutes.ts.
// Every route file must have an explicit rule here (lib/platform/public-routes.test.ts scans app/api and fails
// otherwise). A path with no rule is answered as "session" at request time, so the default is closed.
//
// Adding a route to PUBLIC_ROUTES, API_KEY_ROUTES or SERVICE_ROUTES is a security decision: keep the lists short.
//
// API:
//   classifyRoute(method, path) -> "public" | "session" | "api-key" | "service"
//   hasExplicitRule(path) -> boolean (path only; the test uses this to catch unclassified route files)
//   routePatternOf(path) -> the matching rule's pattern or null (a safe string to audit; never the raw path)
//   routePathFromFile(relativeFile) -> "/api/..." (app/api/x/[id]/route.ts -> /api/x/:id)
//
// Pattern syntax: `:name` matches one non-empty segment; a trailing `*` matches one or more segments.
// Method "GET" also covers HEAD; "*" is any method.

export type RouteAccess = "public" | "session" | "api-key" | "service";

export interface RouteRule {
  readonly method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "*";
  readonly pattern: string;
}

// Answers without any session.
export const PUBLIC_ROUTES: readonly RouteRule[] = Object.freeze([
  { method: "GET", pattern: "/api/review/queue" },
  // The OAuth endpoints themselves.
  { method: "GET", pattern: "/api/auth/hackclub/start" },
  { method: "GET", pattern: "/api/auth/hackclub/callback" },
  // The shared platform password check that comes before Hack Club Auth (no session yet).
  { method: "POST", pattern: "/api/auth/platform-gate" },
  // Static API documentation: no data about anyone, no script, no key needed.
  { method: "GET", pattern: "/api/v1/docs" },
  { method: "GET", pattern: "/api/v1/openapi.yaml" },
  // The cron endpoints (lib/platform/jobs, lib/platform/fraud). No session and no service key: each handler
  // answers only a Bearer CRON_SECRET request and 403s when the env is unset (fail closed), so the route layer
  // stays public the way the OAuth endpoints do. One entry per route file, like the bot list below.
  { method: "*", pattern: "/api/cron/:job" },
  { method: "*", pattern: "/api/cron/fraud-precheck" },
  { method: "*", pattern: "/api/cron/fraud-robert-sync" },
  // Signed fraud-outcome webhook. No session: the handler verifies an HMAC shared secret and answers 503 while it is unset.
  { method: "POST", pattern: "/api/fraud-outcome" },
] as const);

// Needs a signed-in session cookie. Reviewer and admin routes also check the role inside the handler.
export const SESSION_ROUTES: readonly RouteRule[] = Object.freeze([
  // Ends the signed in session (same-origin POST only, checked in the handler).
  { method: "POST", pattern: "/api/auth/signout" },
  { method: "*", pattern: "/api/journal-media" },
  { method: "*", pattern: "/api/journal-media/:id" },
  { method: "GET", pattern: "/api/projects/export" },
  { method: "GET", pattern: "/api/projects/:id/commits" },
  { method: "GET", pattern: "/api/projects/:id/commits/:sha" },
  { method: "GET", pattern: "/api/projects/:id/readme" },
  { method: "GET", pattern: "/api/review/pending" },
  { method: "GET", pattern: "/api/search" },
  // Session, plus the reviewer role checked in the handler.
  { method: "*", pattern: "/api/tickets" },
  { method: "*", pattern: "/api/tickets/:ts/thread" },
  { method: "*", pattern: "/api/tickets/:ts/reply" },
  { method: "*", pattern: "/api/tickets/:ts/resolve" },
] as const);

// Needs a user API key sent as a bearer token (the /api/v1/* wildcard covers every v1 route). Read only: GET only.
export const API_KEY_ROUTES: readonly RouteRule[] = Object.freeze([
  { method: "GET", pattern: "/api/v1/*" },
] as const);

// Needs a service key (`x-loadout-service-key`, lib/platform/service-keys.ts). The Slack bot's routes (app/api/internal/bot) take
// the slack-bot key, which each handler checks with requireBot. One rule per path: the methods are the handler's own.
export const SERVICE_ROUTES: readonly RouteRule[] = Object.freeze([
  { method: "*", pattern: "/api/internal/bot/tickets" },
  { method: "*", pattern: "/api/internal/bot/tickets/:id" },
  { method: "*", pattern: "/api/internal/bot/tickets/:id/messages" },
  { method: "*", pattern: "/api/internal/bot/tickets/open" },
  { method: "*", pattern: "/api/internal/bot/tickets/similar" },
  { method: "*", pattern: "/api/internal/bot/helpers" },
  { method: "*", pattern: "/api/internal/bot/helpers/:slackId" },
  { method: "*", pattern: "/api/internal/bot/person" },
  { method: "*", pattern: "/api/internal/bot/ships/last" },
  { method: "*", pattern: "/api/internal/bot/ships/approved" },
  { method: "*", pattern: "/api/internal/bot/outbox" },
  { method: "*", pattern: "/api/internal/bot/outbox/:id/ack" },
  { method: "*", pattern: "/api/internal/bot/outbox/:id/fail" },
  { method: "*", pattern: "/api/internal/bot/qa" },
  { method: "*", pattern: "/api/internal/bot/jobs" },
  { method: "*", pattern: "/api/internal/bot/jobs/:id" },
] as const);

// "/api/news" -> ["api", "news"]. Empty segments are kept so they never match anything.
function segments(path: string): string[] {
  if (!path.startsWith("/")) return [""];
  return path === "/" ? [] : path.split("/").slice(1);
}

function matches(pattern: string, path: string): boolean {
  const want = segments(pattern);
  const have = segments(path);
  for (let i = 0; i < want.length; i++) {
    const w = want[i];
    if (w === "*" && i === want.length - 1) {
      return have.length > i && have.slice(i).every((s) => s !== "");
    }
    const h = have[i];
    if (h === undefined || h === "") return false;
    if (w.startsWith(":")) continue;
    if (w !== h) return false;
  }
  return have.length === want.length;
}

// Express and Next match case-insensitively and ignore one trailing slash, so the path is normalized the same way.
export function normalizePath(path: string): string {
  const lower = path.toLowerCase();
  return lower.length > 1 && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

function ruleMatches(rule: RouteRule, method: string, path: string): boolean {
  const m = method.toUpperCase();
  return (rule.method === "*" || rule.method === m || (rule.method === "GET" && m === "HEAD")) && matches(rule.pattern, path);
}

// The access class for a request. Anything without a rule falls back to "session".
export function classifyRoute(method: string, path: string): RouteAccess {
  const p = normalizePath(path);
  if (PUBLIC_ROUTES.some((r) => ruleMatches(r, method, p))) return "public";
  if (API_KEY_ROUTES.some((r) => ruleMatches(r, method, p))) return "api-key";
  if (SERVICE_ROUTES.some((r) => ruleMatches(r, method, p))) return "service";
  return "session";
}

// True when some rule names this path, whatever the method. Used by the test that guards against new routes
// added without a decision.
export function hasExplicitRule(path: string): boolean {
  const p = normalizePath(path);
  return [...PUBLIC_ROUTES, ...SESSION_ROUTES, ...API_KEY_ROUTES, ...SERVICE_ROUTES].some((r) => matches(r.pattern, p));
}

// How many caller-chosen segments a pattern has: a static segment costs 0, a :param 1 and a trailing * 2. Lower is more
// specific, so a static rule that also matches a path wins over a broad one no matter which list it was declared in.
function dynamicScore(pattern: string): number {
  return segments(pattern).reduce((score, s) => score + (s === "*" ? 2 : s.startsWith(":") ? 1 : 0), 0);
}

// The most specific rule that names this path (for example "/api/internal/bot/tickets/:id"), or null. Safe to store or log:
// it is one of our own strings, never the caller's text. A static rule beats a dynamic one: /api/cron/fraud-precheck reports
// itself rather than /api/cron/:job, and /api/internal/bot/tickets/open rather than /api/internal/bot/tickets/:id.
export function routePatternOf(path: string): string | null {
  const p = normalizePath(path);
  const matched = [...SERVICE_ROUTES, ...PUBLIC_ROUTES, ...API_KEY_ROUTES, ...SESSION_ROUTES].filter((r) => matches(r.pattern, p));
  matched.sort((a, b) => dynamicScore(a.pattern) - dynamicScore(b.pattern));
  return matched[0]?.pattern ?? null;
}

// "journal-media/[id]/route.ts" (relative to app/api) -> "/api/journal-media/:id".
// Dynamic [x] becomes :x, catch-all [...x] becomes *, and route groups (x) are not part of the URL.
export function routePathFromFile(relativeFile: string): string {
  const dirs = relativeFile
    .replace(/\\/g, "/")
    .replace(/(^|\/)route\.ts$/, "")
    .split("/")
    .filter((s) => s !== "" && !(s.startsWith("(") && s.endsWith(")")))
    .map((s) => {
      const catchAll = /^\[\.\.\.(\w+)\]$/.exec(s);
      if (catchAll) return "*";
      const dynamic = /^\[(\w+)\]$/.exec(s);
      return dynamic ? `:${dynamic[1]}` : s;
    });
  return `/api${dirs.length ? `/${dirs.join("/")}` : ""}`;
}
