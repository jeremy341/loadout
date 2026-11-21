// The reviewer site is a separate site on its own host, not a part of the participant dashboard. Any host whose first
// label is exactly "review" belongs to it: review.localhost:3011 while developing, a review.<domain> address in
// production. proxy.ts rewrites that host to the internal /reviewer route tree and answers 404 for /reviewer on every
// other host. Both checks use this one function so the rule lives in one place.

export const REVIEWER_PREFIX = "/reviewer";

// "review.localhost:3011" and "review.example.com" match. "reviewer.example.com", "localhost:3011", "www.example.com" and
// a bare "review" do not: the first label must be "review" and there must be a domain after it.
//
// The Host header is whatever the client sent, so on a deployment that fronts the app with its own routing, set
// LOADOUT_REVIEW_HOST to the one real review address (for example "review.example.com"; several may be comma separated). When it
// is set, only those hosts match and the "review." first-label rule no longer applies, so a forged Host cannot reach the tree.
// Production fails closed: with the variable unset no host matches, and the review site is unavailable until someone configures it.
// Locally the "review." rule still applies so review.localhost:3011 works without any setup. Every caller (proxy.ts, the layout,
// apiGuard.ts and ticketsApi.ts) uses this one function, so they all inherit the same rule.
export function isReviewHost(host: string | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  if (!host) return false;
  const full = host.trim().toLowerCase();
  const name = full.replace(/:\d+$/, "");
  const allowed = (env.LOADOUT_REVIEW_HOST ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
  if (allowed.length > 0) return allowed.some((entry) => entry === full || entry === name);
  if (env.NODE_ENV === "production") return false;
  const labels = name.split(".");
  return labels.length >= 2 && labels[0] === "review" && labels.slice(1).every((label) => label.length > 0);
}

// Pages whose HTML depends on who is signed in. They must never be stored by a shared cache or served to someone else.
const PRIVATE_PREFIXES = ["/dashboard", "/docs", "/review-queue"] as const;

export function isPrivatePagePath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

// The internal route for an address seen on the review host: "/" is the queue at /reviewer, "/ship/abc" is
// /reviewer/ship/abc. The search string is carried by the caller.
export function reviewerRoute(pathname: string): string {
  return pathname === "/" || pathname === "" ? REVIEWER_PREFIX : `${REVIEWER_PREFIX}${pathname}`;
}

// True for /reviewer and anything below it, which must not answer on a non-review host.
export function isReviewerRoute(pathname: string): boolean {
  return pathname === REVIEWER_PREFIX || pathname.startsWith(`${REVIEWER_PREFIX}/`);
}

// The address a visitor sees, from a path that may be either the browser's or the internal one (the client router can
// report either, depending on the render). "/reviewer/ship/abc" and "/ship/abc" both become "/ship/abc".
export function publicPath(pathname: string): string {
  if (!isReviewerRoute(pathname)) return pathname || "/";
  return pathname.slice(REVIEWER_PREFIX.length) || "/";
}

// Addresses the reviewer site used before it moved to Pixl's paths (the queue at /review, a desk at /review/[id], the tabs under
// /review, and Pixl's own names for community goals and show-n-tell). The proxy sends them to the new address so a saved link or
// an old bookmark still lands. "/" is not here: it is the Overview now, and the old queue answered at the same address.
const MOVED: Record<string, string> = {
  "/hardware": "/review/hardware",
  "/second-pass": "/review/second-pass",
  "/spot-check": "/review/second-pass",
  "/reviewed": "/review/reviewed",
  "/stats": "/review/stats",
  "/log": "/review/log",
  "/guidelines": "/review/guidelines",
  "/proposed-bans": "/review/proposed-bans",
  "/goals": "/community-goals",
  "/show-and-tell": "/show-n-tell",
};

// Where an old address now lives, or null when the address has not moved. A ship's address, /ship/abc, becomes /review/abc.
export function movedTo(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (Object.hasOwn(MOVED, path)) return MOVED[path];
  // Ship numbers follow Pixl's: sh-2041 is now 2041 (the desk is /review/2041), so the old sh- form still lands.
  const old = /^\/(?:ship|review)\/sh-(\d+)$/.exec(path);
  if (old) return `/review/${old[1]}`;
  const ship = /^\/ship\/([^/]+)$/.exec(path);
  return ship ? `/review/${ship[1]}` : null;
}

// The matcher for proxy.ts. It skips Next internals, API routes, anything with a dot (static files) and the sprite and
// shop artwork under /loadout. It has to be a constant there, so proxy.ts repeats it and a test keeps the two equal.
export const PROXY_MATCHER = "/((?!_next|api|loadout/|.*\\..*).*)";
