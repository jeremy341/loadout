import { expect, test, type APIRequestContext } from "@playwright/test";
import { ROUTES, type RouteEntry } from "../lib/reviewer/route-matrix";
import { actAs, reviewClient, REVIEW_BASE } from "./reviewer-helpers";

// Access by role on the reviewer site (review.<host>), checked against lib/reviewer/route-matrix.ts and .ulpi/design/reviewer-roles.md.
// The matrix unit test keeps the matrix in step with the route files; this file checks that the running site agrees with it.
test.use({ baseURL: REVIEW_BASE });
// The matrix visits every page, and a cold route on the dev server compiles on its first request.
test.setTimeout(120_000);

const pathOf = (route: RouteEntry) => route.sample ?? route.path;
// POST routes (reply, resolve) change the sample store when they are allowed, so an owner is never sent to them; a refusal changes nothing.
const safeFor = (route: RouteEntry) => route.method !== "POST";

async function call(client: APIRequestContext, route: RouteEntry, path = pathOf(route)) {
  return route.method === "POST" ? client.post(path, { data: {} }) : client.get(path);
}

test.describe("the route matrix", () => {
  test("an owner opens every page and API route", async () => {
    const client = await reviewClient("owner");
    // The sample tickets are stamped relative to the server's clock, so the matrix's fixed timestamp goes stale; use a live one.
    const tickets = (await (await client.get("/api/tickets")).json()) as { tickets: { msg_ts: string }[] };
    const liveTs = tickets.tickets[0]?.msg_ts;
    expect(liveTs, "the sample has tickets").toBeTruthy();
    for (const route of ROUTES.filter(safeFor)) {
      const path = pathOf(route).replace(/(\/api\/tickets\/)[\d.]+/, `$1${liveTs}`);
      const response = await call(client, route, path);
      const where = `${route.kind} ${pathOf(route)}`;
      if (route.redirectsTo) {
        expect(response.status(), where).toBeGreaterThanOrEqual(300);
        expect(response.status(), where).toBeLessThan(400);
        expect(response.headers().location ?? "", where).toContain(route.redirectsTo);
      } else if (route.path === "/superadmin") {
        // Nothing to find while LOADOUT_SUPERADMIN_BOOTSTRAP_SECRET is unset: the page is a deliberate 404, which local
        // development is. With the secret set it renders for a reviewer.
        expect([200, 404], where).toContain(response.status());
      } else {
        expect(response.status(), where).toBe(200);
      }
    }
  });

  for (const role of ["builder", "none"] as const) {
    test(`${role === "builder" ? "a builder" : "a signed-in person with no role"} gets a plain 404 on every route`, async () => {
      const client = await reviewClient(role);
      for (const route of ROUTES) {
        let response = await call(client, route);
        // The proxy moves the old /stats address to /review/stats before any role check; the page it lands on is the 404.
        if (response.status() === 308) response = await client.get(new URL(response.headers().location!, REVIEW_BASE).pathname);
        expect(response.status(), `${route.kind} ${pathOf(route)}`).toBe(404);
      }
    });
  }

  test("the main host does not serve the reviewer site", async ({ request }) => {
    const main = new URL(REVIEW_BASE.replace("review.", ""));
    for (const path of ["/reviewer", "/reviewer/review", "/dashboard/review"]) {
      expect((await request.get(`${main.origin}${path}`, { maxRedirects: 0 })).status(), path).toBe(404);
    }
  });
});

test.describe("roles with a landing page", () => {
  test("a reviewer is sent from owner-only pages to the queue and keeps the review pages", async ({ context, page }) => {
    await actAs(context, "reviewer");
    for (const path of ["/players", "/bans", "/shop", "/admins", "/review/proposed-bans", "/review/log", "/review/audit", "/review/macros"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/review$/);
    }
    await page.goto("/");
    await expect(page).toHaveURL(/\/review\/stats$/);
    for (const path of ["/review", "/review/reviewed", "/review/stats", "/review/guidelines", "/projects", "/settings"]) {
      expect((await page.goto(path))?.status(), path).toBe(200);
      expect(new URL(page.url()).pathname, path).toBe(path);
    }
  });

  test("a reviewer who is not a final reviewer is sent from Second pass to the queue; a final reviewer opens it", async ({ context, page }) => {
    await actAs(context, "reviewer");
    await page.goto("/review/second-pass");
    await expect(page).toHaveURL(/\/review$/);
    await actAs(context, "final-reviewer");
    expect((await page.goto("/review/second-pass"))?.status()).toBe(200);
    await expect(page).toHaveURL(/\/review\/second-pass$/);
  });

  test("a helper lands on Tickets and a fulfiller on Fulfillment", async ({ context, page }) => {
    await actAs(context, "helper");
    for (const path of ["/", "/review", "/players", "/fulfillment"]) {
      await page.goto(path);
      await expect(page, `helper ${path}`).toHaveURL(/\/tickets$/);
    }
    await actAs(context, "fulfiller");
    for (const path of ["/", "/review", "/players", "/tickets"]) {
      await page.goto(path);
      await expect(page, `fulfiller ${path}`).toHaveURL(/\/fulfillment$/);
    }
  });

  test("an integrity reviewer lands on the integrity tab and has no queue", async ({ context, page }) => {
    await actAs(context, "integrity-reviewer");
    for (const path of ["/", "/review", "/players", "/tickets"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/review\/fraud-reviews$/);
    }
    await expect(page.getByRole("tab", { name: /^Integrity reviews/ })).toBeVisible();
  });
});

test.describe("a hardware-only reviewer", () => {
  test("sees the hardware queue only and gets not-found for a software ship", async ({ context, page }) => {
    await actAs(context, "hardware-reviewer");
    await page.goto("/review");
    // A one-queue reviewer gets no software/hardware switch, only their own queue.
    await expect(page.getByRole("tab", { name: /^Needs review/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /queue$/ })).toHaveCount(0);
    const ships = await page.locator('main a[href^="/review/"]').evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(ships.length).toBeGreaterThan(0);
    // Ship 2043 is software. The dev server streams the not-found page after a 200 header, so the content is what is checked.
    await page.goto("/review/2043");
    await expect(page.getByText("#2043")).toHaveCount(0);
    await expect(page.getByText("Tiny bytecode VM in Rust")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Start reviewing" })).toHaveCount(0);
  });

  test("the API for a ship in the other queue is refused too", async () => {
    const client = await reviewClient("hardware-reviewer");
    expect((await client.get("/api/projects/2043/readme")).status()).not.toBe(200);
  });
});
