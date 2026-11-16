// The reviewer site's route matrix: every page and every API route, with the access it enforces. This is the one list the role
// model is checked against. lib/reviewer/route-matrix.test.ts reads the real page and route files and fails when:
//   - a page or route file exists that is not listed here (a new route must state who may open it),
//   - a listed file no longer exists,
//   - the file's own guard call (requirePage / requireAccess / reviewApi / guardedRoute) disagrees with `guard`,
//   - a page has no guard at all.
// The browser sweep (scratchpad role-sweep) requests every entry as every role and compares with `access`.
//
// Two columns, because Pixl does some of its checks inside the page:
//   guard  what the page's own requirePage(...) asks for.
//   access who actually gets the page. Often the same. A page such as Spot check asks for a reviewer and then sends a reviewer who
//          is not a final reviewer back to /review; `access` is the stricter one and `inPage` says how the page enforces it.
// Someone with a role who fails `access` is redirected to their own landing page (landingFor), except where `inPage` sends them to /review.
// Someone with no role at all (a builder, nobody signed in) gets the plain 404 on every entry, pages and APIs alike.
import { satisfies, type Requirement, type ReviewerAccess } from "./access";

export type GuardArg = "owner" | "reviewer" | "staff" | "helper" | "fulfiller" | { review: "second_pass" } | { review: "fraud" };

export type RouteEntry = {
  /** The browser address on the review host (the proxy maps review.<host>/x to /reviewer/x). */
  path: string;
  kind: "page" | "api";
  /** The source file, relative to apps/landing. */
  file: string;
  /** What the file's own guard call asks for. */
  guard: GuardArg;
  /** Who actually gets the page or the data. */
  access: Requirement;
  /** How the page narrows the guard, when `access` is stricter than `guard`. */
  inPage?: string;
  /** An address with real sample ids, for the browser sweep, where `path` has brackets. */
  sample?: string;
  /** Pixl redirects here for the allowed roles instead of rendering (the sweep expects a 3xx). */
  redirectsTo?: string;
  /** API routes only: the HTTP method the sweep uses (default GET). */
  method?: "GET" | "POST";
  /** API routes only: what a person who holds a role but not this one gets (default 403, as Pixl). The tickets routes answer 404. */
  denied?: 403 | 404;
};

const P = "app/(reviewer)/reviewer/";
const page = (path: string, file: string, guard: GuardArg, access: Requirement = guard, extra: Partial<RouteEntry> = {}): RouteEntry => ({
  path,
  kind: "page",
  file: `${P}${file}`,
  guard,
  access,
  ...extra,
});
const api = (path: string, file: string, guard: GuardArg, extra: Partial<RouteEntry> = {}): RouteEntry => ({ path, kind: "api", file: `app/api/${file}`, guard, access: guard, ...extra });

const FINAL = { review: "second_pass" } as const;
const FRAUD = { review: "fraud" } as const;

export const ROUTES: readonly RouteEntry[] = [
  // The Overview is the owner's. Everyone else is sent on: a reviewer to their stats, the rest to their own landing page.
  page("/", "page.tsx", "staff", "owner", { inPage: "redirects every non-owner to /review/stats (reviewer) or their landing page" }),
  page("/settings", "settings/page.tsx", "staff"),

  // Review area (Pixl's review tabs).
  page("/review", "review/(tabs)/page.tsx", "reviewer", "reviewer", { inPage: "lists only the viewer's queue (kind)" }),
  page("/review/hardware", "review/hardware/page.tsx", "reviewer", "reviewer", { redirectsTo: "/review?kind=hardware", inPage: "a software-only reviewer is sent to /review" }),
  page("/review/reviewed", "review/(tabs)/reviewed/page.tsx", "reviewer"),
  page("/review/stats", "review/(tabs)/stats/page.tsx", "reviewer"),
  page("/review/guidelines", "review/(tabs)/guidelines/page.tsx", "reviewer"),
  page("/review/spot-check", "review/(tabs)/spot-check/page.tsx", "reviewer", FINAL, { inPage: "owner or final reviewer, else redirect to /review" }),
  page("/review/proposed-bans", "review/(tabs)/proposed-bans/page.tsx", "reviewer", "owner", { inPage: "owner, else redirect to /review" }),
  page("/review/log", "review/(tabs)/log/page.tsx", "reviewer", "owner", { inPage: "owner, else redirect to /review" }),
  page("/review/audit", "review/(tabs)/audit/page.tsx", "reviewer", "owner", { inPage: "owner, else redirect to /review" }),
  page("/review/fraud-reviews", "review/(tabs)/fraud-reviews/page.tsx", FRAUD),
  page("/review/[id]", "review/[id]/page.tsx", "reviewer", "reviewer", {
    sample: "/review/2041",
    inPage: "404 for a ship outside the viewer's queue, for integrity and second-pass stages without the integrity tab, and for a queue page they may not open",
  }),
  page("/review/macros", "review/macros/page.tsx", "owner"),
  page("/review/pay", "review/pay/page.tsx", "owner"),
  page("/review/erasure", "review/erasure/page.tsx", "owner"),
  page("/review/age-exceptions", "review/age-exceptions/page.tsx", "owner"),

  // Projects: a reviewer reads them; a ship of the other queue is hidden from a one-queue reviewer.
  page("/projects", "projects/page.tsx", "reviewer"),
  page("/projects/[id]", "projects/[id]/page.tsx", "reviewer", "reviewer", { sample: "/projects/2041" }),

  // Owner pages.
  page("/players", "players/page.tsx", "owner"),
  page("/players/[id]", "players/[id]/page.tsx", "owner", "owner", { sample: "/players/u-kestrel42" }),
  page("/reviewers", "reviewers/page.tsx", "owner"),
  page("/reviewers/[id]", "reviewers/[id]/page.tsx", "owner", "owner", { sample: "/reviewers/tamsin" }),
  page("/admins", "admins/page.tsx", "owner"),
  page("/fulfillers/[id]", "fulfillers/[id]/page.tsx", "owner", "owner", { sample: "/fulfillers/deskcrate" }),
  page("/reports", "reports/page.tsx", "owner"),
  page("/reports/[id]", "reports/[id]/page.tsx", "owner", "owner", { sample: "/reports/312" }),
  page("/violations", "violations/page.tsx", "owner"),
  page("/bans", "bans/page.tsx", "owner"),
  page("/ideas", "ideas/page.tsx", "owner"),
  page("/notify", "notify/page.tsx", "owner"),
  page("/forms", "forms/page.tsx", "owner"),
  page("/budget", "budget/page.tsx", "owner"),
  page("/shop", "shop/page.tsx", "owner"),
  page("/shop-detail", "shop-detail/page.tsx", "owner"),
  page("/events", "events/page.tsx", "owner"),
  page("/referrals", "referrals/page.tsx", "owner"),
  page("/community-goals", "community-goals/page.tsx", "owner"),
  page("/show-n-tell", "show-n-tell/page.tsx", "owner"),
  page("/stats", "stats/page.tsx", "owner", "owner", { redirectsTo: "/review/stats", inPage: "the proxy sends the old address /stats to /review/stats (lib/reviewer/host.ts), so this page is never reached on the review host" }),

  // Queues of the helper and the fulfiller. Owners pass every gate.
  page("/tickets", "tickets/page.tsx", "helper"),
  page("/fulfillment", "fulfillment/page.tsx", "fulfiller", "fulfiller", { inPage: "the Fulfillers tab is the owner's (canOpenFulfillmentTab)" }),
  page("/fulfillment/label/[id]", "fulfillment/label/[id]/page.tsx", "fulfiller", "fulfiller", { sample: "/fulfillment/label/2001", inPage: "buyer details only for the fulfiller who claimed the order, or an owner" }),

  // JSON endpoints the review components call. Plain 404 without a role, 403 with a role that is not enough.
  api("/api/review/pending", "review/pending/route.ts", "reviewer"),
  api("/api/projects/export", "projects/export/route.ts", "owner"),
  api("/api/projects/[id]/commits", "projects/[id]/commits/route.ts", "reviewer", { sample: "/api/projects/2041/commits" }),
  api("/api/projects/[id]/commits/[sha]", "projects/[id]/commits/[sha]/route.ts", "reviewer", { sample: "/api/projects/2041/commits/abc1234" }),
  api("/api/projects/[id]/readme", "projects/[id]/readme/route.ts", "reviewer", { sample: "/api/projects/2041/readme" }),
  api("/api/search", "search/route.ts", "staff", { sample: "/api/search?q=ke" }),
  // The tickets endpoints use helperOnly (reviewer-dash/lib/ticketsApi.ts): helpers and owners, else a plain 404 for everyone else.
  api("/api/tickets", "tickets/route.ts", "helper", { denied: 404 }),
  api("/api/tickets/[ts]/thread", "tickets/[ts]/thread/route.ts", "helper", { sample: "/api/tickets/1794759095.100006/thread", denied: 404 }),
  api("/api/tickets/[ts]/reply", "tickets/[ts]/reply/route.ts", "helper", { sample: "/api/tickets/1794759095.100006/reply", method: "POST", denied: 404 }),
  api("/api/tickets/[ts]/resolve", "tickets/[ts]/resolve/route.ts", "helper", { sample: "/api/tickets/1794759095.100006/resolve", method: "POST", denied: 404 }),
];

export function routeFor(path: string): RouteEntry | undefined {
  return ROUTES.find((route) => route.path === path);
}

// Whether a viewer gets the entry (a role-holder who does not is redirected to their landing page; a person without a role gets 404).
export function mayOpen(access: ReviewerAccess | null, route: RouteEntry): boolean {
  return access !== null && satisfies(access, route.access);
}
