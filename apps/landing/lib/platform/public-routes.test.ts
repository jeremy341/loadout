import { describe, expect, test } from "bun:test";
import { existsSync } from "fs";
import { join, sep } from "path";
import {
  API_KEY_ROUTES,
  classifyRoute,
  hasExplicitRule,
  PUBLIC_ROUTES,
  routePatternOf,
  routePathFromFile,
  SERVICE_ROUTES,
  SESSION_ROUTES,
} from "./public-routes";

const API_DIR = join(import.meta.dir, "..", "..", "app", "api");

// Every route.ts under app/api, as a path relative to app/api.
async function routeFilesOnDisk(): Promise<string[]> {
  const found: string[] = [];
  for await (const file of new Bun.Glob("**/route.ts").scan({ cwd: API_DIR })) {
    found.push(file.split(sep).join("/"));
  }
  return found.sort();
}

describe("routePathFromFile", () => {
  test("turns dynamic segments into :name", () => {
    expect(routePathFromFile("projects/[id]/commits/[sha]/route.ts")).toBe("/api/projects/:id/commits/:sha");
  });

  test("keeps static segments and drops route groups", () => {
    expect(routePathFromFile("auth/hackclub/start/route.ts")).toBe("/api/auth/hackclub/start");
    expect(routePathFromFile("(group)/news/route.ts")).toBe("/api/news");
  });

  test("turns a catch-all into *", () => {
    expect(routePathFromFile("files/[...slug]/route.ts")).toBe("/api/files/*");
  });

  test("maps the root api route", () => {
    expect(routePathFromFile("route.ts")).toBe("/api");
  });
});

describe("classifyRoute", () => {
  test("OAuth start and callback are public", () => {
    expect(classifyRoute("GET", "/api/auth/hackclub/start")).toBe("public");
    expect(classifyRoute("GET", "/api/auth/hackclub/callback")).toBe("public");
  });

  test("session routes need a session", () => {
    expect(classifyRoute("GET", "/api/search")).toBe("session");
    expect(classifyRoute("GET", "/api/projects/export")).toBe("session");
    expect(classifyRoute("GET", "/api/projects/abc/commits/0123abc")).toBe("session");
    expect(classifyRoute("POST", "/api/tickets/123/reply")).toBe("session");
  });

  test("/api/v1 routes need a user API key", () => {
    expect(classifyRoute("GET", "/api/v1/me")).toBe("api-key");
    expect(classifyRoute("GET", "/api/v1/projects/abc/journal")).toBe("api-key");
  });

  test("an unlisted route falls back to session, never public", () => {
    expect(classifyRoute("GET", "/api/brand-new")).toBe("session");
    expect(classifyRoute("GET", "/api/v1")).toBe("session");
  });

  test("a public route is public only for its method", () => {
    expect(classifyRoute("POST", "/api/auth/hackclub/start")).toBe("session");
  });

  test("ignores case and one trailing slash, as Next does", () => {
    expect(classifyRoute("GET", "/API/Auth/HackClub/Start/")).toBe("public");
  });

  test("HEAD is answered like GET", () => {
    expect(classifyRoute("HEAD", "/api/auth/hackclub/start")).toBe("public");
  });

  test("does not match a longer or shorter path", () => {
    expect(classifyRoute("GET", "/api/auth/hackclub/start/extra")).toBe("session");
    expect(classifyRoute("GET", "/api/auth/hackclub")).toBe("session");
    expect(classifyRoute("GET", "/api/projects/abc/commits")).toBe("session");
  });

  test("an empty dynamic segment does not match", () => {
    expect(classifyRoute("GET", "/api/projects//commits")).toBe("session");
  });
});

describe("hasExplicitRule", () => {
  test("is true for a listed path and false otherwise", () => {
    expect(hasExplicitRule("/api/search")).toBe(true);
    expect(hasExplicitRule("/api/v1/me")).toBe(true);
    expect(hasExplicitRule("/api/not-listed")).toBe(false);
  });
});

describe("route lists", () => {
  test("every list is frozen", () => {
    for (const list of [PUBLIC_ROUTES, SESSION_ROUTES, API_KEY_ROUTES, SERVICE_ROUTES]) {
      expect(Object.isFrozen(list)).toBe(true);
    }
  });

  test("no path appears in two lists", () => {
    const all = [...PUBLIC_ROUTES, ...SESSION_ROUTES, ...API_KEY_ROUTES, ...SERVICE_ROUTES].map((r) => r.pattern);
    expect(new Set(all).size).toBe(all.length);
  });

  test("every listed pattern points at a route file that exists", async () => {
    const files = new Set((await routeFilesOnDisk()).map(routePathFromFile));
    const listed = [...PUBLIC_ROUTES, ...SESSION_ROUTES].map((r) => r.pattern);
    for (const pattern of listed) {
      expect(files.has(pattern)).toBe(true);
    }
  });
});

describe("routePatternOf", () => {
  test("prefers a static rule over a dynamic one in the same list", () => {
    expect(routePatternOf("/api/cron/fraud-precheck")).toBe("/api/cron/fraud-precheck");
    expect(routePatternOf("/api/internal/bot/tickets/open")).toBe("/api/internal/bot/tickets/open");
    expect(routePatternOf("/api/internal/bot/tickets/similar")).toBe("/api/internal/bot/tickets/similar");
  });

  test("prefers a static rule from another list over a dynamic one", () => {
    // /api/cron/:job is public and /api/cron/fraud-robert-sync is also public; the static rule must win.
    expect(routePatternOf("/api/cron/fraud-robert-sync")).toBe("/api/cron/fraud-robert-sync");
  });

  test("still reports a parameter rule for a real id", () => {
    expect(routePatternOf("/api/internal/bot/tickets/abc123")).toBe("/api/internal/bot/tickets/:id");
    expect(routePatternOf("/api/cron/nightly")).toBe("/api/cron/:job");
  });

  test("reports a catch-all and null when nothing matches", () => {
    expect(routePatternOf("/api/v1/me")).toBe("/api/v1/*");
    expect(routePatternOf("/api/brand-new")).toBeNull();
  });
});

describe("app/api coverage", () => {
  test("the app/api folder exists", () => {
    expect(existsSync(API_DIR)).toBe(true);
  });

  test("every route file on disk has an explicit access rule", async () => {
    const files = await routeFilesOnDisk();
    expect(files.length).toBeGreaterThan(0);
    const unclassified = files.filter((file) => !hasExplicitRule(routePathFromFile(file)));
    // A new route must be added to a list in public-routes.ts before it ships.
    expect(unclassified).toEqual([]);
  });
});
