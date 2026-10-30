import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// M1 participant platform. Local development opens without sign-in as the builder test account; the server reads
// LOADOUT_PREVIEW_ROLE from .env.local. Staff pages are checked only when the server runs in staff mode:
//   LOADOUT_PREVIEW_ROLE=staff bun run dev   and then   LOADOUT_E2E_STAFF=true bunx playwright test e2e/platform.spec.ts
// Needs a local Postgres with the migrations applied and the local test accounts seeded.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VIEWPORTS = [
  [375, 812],
  [1440, 900],
] as const;
const SCHEMES = ["dark", "light"] as const;
const PARTICIPANT_PAGES = [
  "/dashboard",
  "/dashboard/projects",
  "/dashboard/settings",
  "/dashboard/shop",
  "/dashboard/explore",
  "/dashboard/community",
  "/dashboard/expeditions",
];
const STAFF_PAGES = ["/dashboard/staff/users", "/dashboard/staff/audit", "/dashboard/staff/flags"];
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";

async function setTheme(page: Page, width: number, height: number, scheme: (typeof SCHEMES)[number]) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
}

test("the dashboard opens without sign-in locally", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible({ timeout: 30000 });
});

test("participants get a 404 on staff pages", async ({ page }) => {
  test.skip(STAFF_MODE, "the server runs as staff in this mode");
  const response = await page.goto("/dashboard/staff/users");
  expect(response?.status()).toBe(404);
});

test("the participant view shows no staff group", async ({ page }) => {
  test.skip(STAFF_MODE, "the server runs as staff in this mode");
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "Participant" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
});

for (const path of PARTICIPANT_PAGES) {
  for (const [width, height] of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      test(`${path} has no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
        test.skip(STAFF_MODE, "participant pages are checked in builder mode");
        await setTheme(page, width, height, scheme);
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      });
    }
  }
}

for (const path of STAFF_PAGES) {
  for (const [width, height] of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      test(`${path} has no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
        test.skip(!STAFF_MODE, "staff pages are checked only in staff mode");
        await setTheme(page, width, height, scheme);
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      });
    }
  }
}

test("platform pages do not scroll sideways at phone width", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setTheme(page, 375, 812, "dark");
  for (const path of PARTICIPANT_PAGES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
