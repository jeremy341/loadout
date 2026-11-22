import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { landingFor, resolveAccess, satisfies, type ReviewerAccess } from "./access";
import { ROUTES, mayOpen, type GuardArg, type RouteEntry } from "./route-matrix";
import { buildNav } from "../../reviewer-dash/app/_ui/nav";
import type { AdminAccess } from "../../reviewer-dash/lib/roles";

const APP = join(import.meta.dir, "..", "..");
const rel = (file: string) => relative(APP, file).split(sep).join("/");

function walk(dir: string, names: string[]): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : walk(path, names);
    return names.includes(name) ? [path] : [];
  });
}

const pageFiles = walk(join(APP, "app", "(reviewer)", "reviewer"), ["page.tsx"]).map(rel);
// Public API routes that run before anyone has signed in, so they have no role guard by design. Each one is named here with its
// reason; a new unguarded route must be added to this list on purpose, not slip through.
const PUBLIC_API_ROUTES = new Set([
  "app/api/review/queue/route.ts", // public participant queue
  "app/api/auth/hackclub/start/route.ts", // starts the Hack Club Auth sign-in (no session yet)
  "app/api/auth/hackclub/callback/route.ts", // finishes it (it creates the session)
  "app/api/auth/signout/route.ts", // ends the session; same-origin POST, no role guard needed
  "app/api/auth/platform-gate/route.ts", // checks the shared platform password before Hack Club Auth starts (no session yet)
  // Participant routes, not reviewer routes: each checks the signed in builder and the project owner itself (journal photos and covers).
  "app/api/journal-media/route.ts", // POST: the owner uploads a photo or cover
  "app/api/journal-media/[id]/route.ts", // GET: a signed in builder reads an image; DELETE: the owner removes it
  // Cron jobs, not reviewer routes: each one answers only a Bearer CRON_SECRET request and 403s while the env is unset
  // (lib/platform/jobs and lib/platform/fraud own the guard; lib/platform/public-routes.ts lists them for the /api classifier).
  "app/api/cron/[job]/route.ts", // the generic job runner (hackatime-sync, stats-snapshot, queue-health)
  "app/api/cron/fraud-precheck/route.ts", // pre-check and Fraudy sweep of freshly shipped projects
  "app/api/cron/fraud-robert-sync/route.ts", // submits to the fraud desk and polls outcomes into FraudCheck rows
  "app/api/fraud-outcome/route.ts", // signed webhook: verifies an HMAC shared secret, no role guard, 503 while unconfigured
]);
// The public read-only API (/api/v1) is guarded by personal API keys, not roles; lib/platform/api-v1/routes.test.ts checks every one of its routes.
// The Slack bot's internal routes (app/api/internal/bot) take the bot's service key, not a role; lib/platform/public-routes.ts lists them.
const apiFiles = walk(join(APP, "app", "api"), ["route.ts"])
  .map(rel)
  .filter((file) => !PUBLIC_API_ROUTES.has(file) && !file.startsWith("app/api/v1/") && !file.startsWith("app/api/internal/bot/"));

// What a file's own guard call asks for, read from the source. Pages call requirePage (Pixl's copies) or requireAccess (older ones); routes
// call reviewApi or guardedRoute.
function guardIn(file: string, kind: "page" | "api"): GuardArg | null {
  const source = readFileSync(join(APP, file), "utf8");
  const match =
    kind === "page"
      ? source.match(/require(?:Access|Page)\(\s*((?:"[a-z_]*")|(?:\{[^}]*\}))?\s*\)/)
      : source.match(/(?:reviewApi|guardedRoute)(?:<[\s\S]*?>)?\(\s*"[^"]+"\s*,\s*("[a-z_]+"|\{[^}]*\})/);
  if (!match) {
    // The tickets routes guard with helperOnly() (helpers and owners).
    if (kind === "api" && /helperOnly()/.test(source)) return "helper";
    return null;
  }
  const arg = (match[1] ?? "").trim();
  if (arg === "") return "staff";
  if (arg.startsWith("{")) {
    if (arg.includes("second_pass")) return { review: "second_pass" };
    if (arg.includes("fraud")) return { review: "fraud" };
    throw new Error(`unknown requirement ${arg} in ${file}`);
  }
  return arg.replace(/"/g, "") as GuardArg;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

describe("the matrix covers every route, and only real ones", () => {
  test("every page.tsx under the reviewer tree has an entry", () => {
    const listed = new Set(ROUTES.map((route) => route.file));
    const missing = pageFiles.filter((file) => !listed.has(file));
    expect(missing, `pages with no matrix entry (add them to lib/reviewer/route-matrix.ts): ${missing.join(", ")}`).toEqual([]);
  });

  test("every api route has an entry", () => {
    const listed = new Set(ROUTES.map((route) => route.file));
    const missing = apiFiles.filter((file) => !listed.has(file));
    expect(missing, `api routes with no matrix entry: ${missing.join(", ")}`).toEqual([]);
  });

  test("every entry names a file that exists, and an address no other entry uses", () => {
    const files = new Set([...pageFiles, ...apiFiles]);
    for (const route of ROUTES) expect(files.has(route.file), `${route.path} -> ${route.file}`).toBe(true);
    expect(new Set(ROUTES.map((route) => route.path)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((route) => route.file)).size).toBe(ROUTES.length);
  });
});

describe("every route is guarded, and the matrix says what the guard says", () => {
  for (const route of ROUTES) {
    test(`${route.kind} ${route.path}`, () => {
      const found = guardIn(route.file, route.kind);
      expect(found, `${route.file} has no guard call`).not.toBeNull();
      expect(same(found, route.guard), `${route.file} asks for ${JSON.stringify(found)}, the matrix says ${JSON.stringify(route.guard)}`).toBe(true);
    });
  }

  test("no page imports data without a guard", () => {
    for (const file of pageFiles) {
      const source = readFileSync(join(APP, file), "utf8");
      const readsData = /from "@\/reviewer-dash\/lib\/(db|sample|tickets|operations|fulfillmentView)/.test(source);
      if (readsData) expect(guardIn(file, "page"), `${file} reads data and has no guard`).not.toBeNull();
    }
  });

  test("the guard is never stricter than the access: nobody is stopped by the guard who the page would let in", () => {
    const levels = everyLevel();
    for (const route of ROUTES) {
      for (const level of levels) {
        if (!level.access) continue;
        if (satisfies(level.access, route.access)) expect(satisfies(level.access, route.guard), `${level.name} on ${route.path}`).toBe(true);
      }
    }
  });

  test("a page whose access is stricter than its guard says how the page enforces it", () => {
    for (const route of ROUTES) if (!same(route.access, route.guard)) expect(route.inPage, route.path).toBeTruthy();
  });

  test("no page is open to every role except the settings and the search", () => {
    for (const route of ROUTES) {
      if (route.access === "staff") expect(["/settings", "/api/search"], route.path).toContain(route.path);
    }
  });

  test("owner-only tools stay owner-only", () => {
    const ownerOnly = ["/admins", "/reviewers", "/reviewers/[id]", "/players", "/budget", "/shop", "/review/macros", "/review/pay", "/review/erasure", "/review/age-exceptions", "/review/proposed-bans", "/review/log", "/review/audit", "/reports", "/bans", "/notify", "/stats"];
    for (const path of ownerOnly) expect(ROUTES.find((route) => route.path === path)?.access, path).toBe("owner");
  });
});

// ---- the levels ----
type Level = { name: string; roles: string[]; email: string; access: ReviewerAccess | null };
const OWNERS = ["owner@loadout.test"];
function everyLevel(): Level[] {
  const defs: [string, string[], string][] = [
    ["owner", [], "owner@loadout.test"],
    ["owner with no_review", ["no_review"], "owner@loadout.test"],
    ["reviewer", ["reviewer"], "r@loadout.test"],
    ["final reviewer", ["reviewer", "second_pass"], "f@loadout.test"],
    ["hardware-only reviewer", ["reviewer", "reviewer_hardware_only"], "h@loadout.test"],
    ["software-only reviewer", ["reviewer", "reviewer_software_only"], "s@loadout.test"],
    ["integrity reviewer", ["fraud_review"], "i@loadout.test"],
    ["helper", ["helper"], "he@loadout.test"],
    ["fulfiller", ["fulfiller"], "fu@loadout.test"],
    ["builder", [], "b@loadout.test"],
  ];
  return defs.map(([name, roles, email]) => ({ name, roles, email, access: resolveAccess({ id: email, email }, { ownerEmails: OWNERS, roles }) }));
}
const toAdmin = (access: ReviewerAccess): AdminAccess => ({ ...access, session: { slackId: "x", personId: "p1", name: "X" } });

// What each level may open, by address. A route is in the set when the matrix says the level gets it.
const opens = (level: Level) => ROUTES.filter((route) => route.kind === "page" && mayOpen(level.access, route)).map((route) => route.path);

describe("what each level may open (from the matrix)", () => {
  const by = (name: string) => everyLevel().find((level) => level.name === name) as Level;

  test("an owner may open every page", () => {
    expect(opens(by("owner")).length).toBe(ROUTES.filter((route) => route.kind === "page").length);
    expect(opens(by("owner with no_review")).length).toBe(opens(by("owner")).length);
  });

  test("a reviewer opens the review area and projects, and no owner page", () => {
    const paths = opens(by("reviewer"));
    for (const path of ["/review", "/review/reviewed", "/review/stats", "/review/guidelines", "/review/[id]", "/projects", "/projects/[id]", "/settings"]) expect(paths).toContain(path);
    for (const path of ["/", "/players", "/admins", "/review/second-pass", "/review/log", "/review/fraud-reviews", "/tickets", "/fulfillment", "/budget"]) expect(paths).not.toContain(path);
  });

  test("a final reviewer adds Second pass and the integrity tab, nothing else", () => {
    const reviewer = new Set(opens(by("reviewer")));
    const extra = opens(by("final reviewer")).filter((path) => !reviewer.has(path));
    expect(extra.sort()).toEqual(["/review/fraud-reviews", "/review/second-pass"]);
  });

  test("queue-limited reviewers open the same pages as a reviewer (the queue is narrowed inside the pages and actions)", () => {
    expect(opens(by("hardware-only reviewer")).sort()).toEqual(opens(by("reviewer")).sort());
    expect(opens(by("software-only reviewer")).sort()).toEqual(opens(by("reviewer")).sort());
  });

  test("the integrity reviewer opens the integrity tab and the settings, nothing else", () => {
    expect(opens(by("integrity reviewer")).sort()).toEqual(["/review/fraud-reviews", "/settings"].sort());
  });

  test("a helper opens Tickets and a fulfiller opens the order pages, nothing else", () => {
    expect(opens(by("helper")).sort()).toEqual(["/settings", "/tickets"].sort());
    expect(opens(by("fulfiller")).sort()).toEqual(["/fulfillment", "/fulfillment/airbridge-preview", "/fulfillment/label/[id]", "/settings"].sort());
  });

  test("a builder and nobody open nothing: the matrix has no access for them", () => {
    expect(by("builder").access).toBeNull();
    expect(opens(by("builder"))).toEqual([]);
  });

  test("a person with a role who is turned away lands on their own page; the landing pages exist in the matrix", () => {
    for (const level of everyLevel()) {
      if (!level.access) continue;
      const landing = landingFor(level.access);
      const route = ROUTES.find((entry) => entry.path === landing);
      expect(route, `${level.name} lands on ${landing}`).toBeDefined();
      expect(mayOpen(level.access, route as RouteEntry), `${level.name} may open their own landing page ${landing}`).toBe(true);
    }
  });
});

// ---- the nav the site really draws (Pixl's, edited for LOADOUT) ----
describe("the nav offers each level only pages it may open", () => {
  const links = (access: ReviewerAccess) => {
    const nav = buildNav(toAdmin(access));
    return [...nav.primary, ...nav.groups.flatMap((group) => group.items)];
  };

  for (const level of everyLevel()) {
    if (!level.access) continue;
    const access = level.access;
    test(level.name, () => {
      for (const item of links(access)) {
        const route = ROUTES.find((entry) => entry.path === item.href);
        expect(route, `${level.name}: nav link ${item.href} has no page in the matrix`).toBeDefined();
        expect(mayOpen(access, route as RouteEntry), `${level.name} is offered ${item.href} but may not open it`).toBe(true);
      }
      const hrefs = links(access).map((item) => item.href);
      expect(new Set(hrefs).size, `${level.name}: a link appears twice`).toBe(hrefs.length);
    });
  }

  test("what the bar shows per level", () => {
    const labels = (name: string) => buildNav(toAdmin(everyLevel().find((level) => level.name === name)?.access as ReviewerAccess)).primary.map((item) => item.label);
    expect(labels("owner")).toEqual(["Overview", "Review", "Projects", "Builders"]);
    expect(labels("reviewer")).toEqual(["My stats", "Review", "Projects"]);
    expect(labels("final reviewer")).toEqual(["My stats", "Review", "Projects"]);
    expect(labels("hardware-only reviewer")).toEqual(["My stats", "Review", "Projects"]);
    expect(labels("integrity reviewer")).toEqual(["Integrity reviews"]);
    expect(labels("helper")).toEqual(["Tickets"]);
    expect(labels("fulfiller")).toEqual(["Fulfillment"]);
  });

  test("only an owner has a More menu", () => {
    for (const level of everyLevel()) {
      if (!level.access) continue;
      const groups = buildNav(toAdmin(level.access)).groups;
      if (level.access.isOwner) expect(groups.length).toBeGreaterThan(0);
      else expect(groups, level.name).toEqual([]);
    }
  });

  test("the owner's More menu offers every owner page that has a place in it, and no page that does not exist", () => {
    const owner = everyLevel()[0].access as ReviewerAccess;
    const paths = new Set(ROUTES.filter((route) => route.kind === "page").map((route) => route.path));
    for (const item of links(owner)) expect(paths.has(item.href), item.href).toBe(true);
  });
});
