import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { noStore, notFoundJson } from "./apiGuard";

const GUARD = readFileSync(join(import.meta.dir, "ticketsApi.ts"), "utf8");

// Every tickets endpoint is supposed to enter through the same guard. This is the audit path: host check, role check, then a
// response that no shared cache may keep. A route that adds its own check could quietly skip the no-store wrapper.
const ROUTES = [
  "app/api/tickets/route.ts",
  "app/api/tickets/[ts]/thread/route.ts",
  "app/api/tickets/[ts]/reply/route.ts",
  "app/api/tickets/[ts]/resolve/route.ts",
];

describe("ticket API guard", () => {
  test("the guarded path checks the host, the role, then wraps the handler answer", () => {
    expect(GUARD).toMatch(/isReviewHost\(\(await headers\(\)\)\.get\("host"\)\)/);
    expect(GUARD).toMatch(/getAccess\(\)/);
    expect(GUARD).toMatch(/!access \|\| !can\(access, req\)/);
    expect(GUARD).toMatch(/noStore\(await fn\(access, request, ctx\)\)/);
  });

  test("the 404 exit and a successful answer carry private, never-cached headers", async () => {
    for (const response of [notFoundJson(), noStore(new Response("ok"))]) {
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("vary")).toContain("Cookie");
    }
  });

  test("every tickets endpoint enters through this guard", () => {
    for (const file of ROUTES) {
      const source = readFileSync(join(import.meta.dir, "..", "..", file), "utf8");
      expect(source).toContain('from "@/reviewer-dash/lib/ticketsApi"');
      expect(source).toMatch(/guardedRoute(?:<[^>]*>)?\(/);
    }
  });
});
