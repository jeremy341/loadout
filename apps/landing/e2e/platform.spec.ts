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
  "/dashboard/tracks/tools",
  "/dashboard/tracks/compute",
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

test("the Overview is the next step, three numbers and the four tracks", async ({ page }) => {
  await page.goto("/dashboard");
  const next = page.getByRole("region", { name: /./ }).filter({ has: page.getByText("Next up") });
  await expect(next).toBeVisible({ timeout: 30000 });
  await expect(next.getByRole("link", { name: /^(Open project|New project)$/ })).toHaveAttribute("href", /^\/dashboard\/projects/);
  await expect(page.getByRole("img", { name: /^Depth -74 M/ })).toBeVisible();
  await expect(page.locator(".pf-stats dt")).toHaveText(["Depth", "Ore"]);
  await expect(page.getByText("Next event: dates coming soon.")).toBeVisible();
  await expect(page.locator(".pf-track-list li")).toHaveCount(4);
  await expect(page.getByRole("heading", { level: 2, name: "Recent" })).toBeVisible();
  await expect(page.locator(".pf-recent-text").first()).toHaveAttribute("href", /^\/dashboard\/projects\//);
  await expect(page.getByRole("navigation", { name: "Participant" }).getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs/start");
  await expect(page.getByRole("link", { name: /^Systems, level 3 of 15/ })).toContainText("10 H to LV.4");
  await expect(page.getByRole("heading", { name: /^(Your projects|Milestone map|Start here)$/ })).toHaveCount(0);
  await expect(page.getByText(/sample/i)).toHaveCount(0);
});

test("pressing a track card opens its levels", async ({ page }) => {
  await page.goto("/dashboard");
  const card = page.getByRole("link", { name: /^Tools, level/ });
  await expect(card).toBeVisible({ timeout: 30000 });
  await card.click();
  await expect(page.getByRole("heading", { level: 1, name: "Tools" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".pf-tile-next dt")).toHaveText("To LV.7");
  await expect(page.locator(".pf-tile-next dd").first()).toHaveText("12 H");
  await expect(page.getByRole("list").filter({ has: page.locator(".pf-core-row") }).getByRole("listitem")).toHaveCount(15);
  await expect(page.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
});

test("an unknown track is a 404", async ({ page }) => {
  const response = await page.goto("/dashboard/tracks/art");
  expect(response?.status()).toBe(404);
});

test("the light and dark switch works and the choice is kept", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard");
  const toggle = page.getByRole("switch", { name: "Light mode" });
  await expect(toggle).toBeVisible({ timeout: 30000 });
  await expect(page.locator("html")).toHaveAttribute("data-display-theme", "dark");
  await expect(async () => {
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-display-theme", "light", { timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-display-theme", "light");
});

test("the platform has no scroll-darkening layer", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".pf-depth")).toHaveCount(0);
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

// The project page and the New project dialog need a project. These tests make one through the dialog when the
// test account has none, so they work on a fresh database too.
async function openNewProjectDialog(page: Page) {
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
  await expect(async () => {
    await page.getByTestId("new-project").click();
    await expect(page.getByRole("dialog", { name: "New project" })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
}

async function openFirstProject(page: Page) {
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
  const cards = page.locator("a.pf-project-card");
  if ((await cards.count()) === 0) {
    await openNewProjectDialog(page);
    await page.getByLabel("Project name").fill("Axe check project");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(cards.first()).toBeVisible({ timeout: 30000 });
  }
  // The oldest project: the edit and delete test works on a new one in parallel, so this one is never deleted under us.
  await cards.last().click();
  await expect(page.getByRole("link", { name: "Back to projects" })).toBeVisible({ timeout: 30000 });
}

for (const [width, height] of VIEWPORTS) {
  for (const scheme of SCHEMES) {
    test(`a project page has no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
      test.skip(STAFF_MODE, "participant pages are checked in builder mode");
      await setTheme(page, width, height, scheme);
      await openFirstProject(page);
      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`the New project dialog has no WCAG 2.2 AA violations at ${width}px, ${scheme}, both steps`, async ({ page }) => {
      test.skip(STAFF_MODE, "participant pages are checked in builder mode");
      await setTheme(page, width, height, scheme);
      await openNewProjectDialog(page);
      let result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      await page.getByLabel("Project name").fill("Dialog check");
      await page.getByRole("button", { name: "Next" }).click();
      await expect(page.getByText("Which track is this build in?")).toBeVisible();
      result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    });
  }
}

test("a builder can edit a project and then delete it", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const stamp = Date.now();
  const first = `Edit check ${stamp}`;
  const renamed = `Edited ${stamp}`;

  await openNewProjectDialog(page);
  await page.getByLabel("Project name").fill(first);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("link", { name: new RegExp(first) }).click();
  await expect(page.getByRole("heading", { level: 1, name: first })).toBeVisible({ timeout: 30000 });

  // Edit: new name, a description and the Tools track.
  await page.getByRole("button", { name: "Edit project" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit project" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Project name").fill(renamed);
  await dialog.getByLabel("Description").fill("A short note.");
  await dialog.getByRole("radio", { name: /^Tools/ }).check();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden({ timeout: 15000 });
  await expect(page.getByRole("heading", { level: 1, name: renamed })).toBeVisible();
  await expect(page.locator(".pf-project-lead")).toHaveText("A short note.");
  await expect(page.locator(".pf-side-name")).toHaveText("Tools");

  // Delete: the button stays off until the name is typed back, and the project is gone afterwards.
  await page.getByRole("button", { name: "Delete project..." }).click();
  const confirm = page.getByRole("button", { name: "Permanently delete project" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel(/to confirm/).fill(renamed.toLowerCase());
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
  await expect(page.getByRole("link", { name: new RegExp(renamed) })).toHaveCount(0);
});

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
