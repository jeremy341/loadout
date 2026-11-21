import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createProjectViaWizard, openProjectTab, type WizardTrack } from "./new-project-helper";

// The own projects page, laid out after Stasis: header, stage and track rows as plain links, a grid with the dashed New project
// tile first, cards that are one link each. Local development opens as the builder test account. Every project made here is
// made through the wizard and deleted through the project page, so no rows are left behind.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function makeProject(page: Page, name: string, track: WizardTrack) {
  await createProjectViaWizard(page, name, { track });
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible({ timeout: 30000 });
}

async function deleteProject(page: Page, name: string) {
  await page.goto("/dashboard/projects");
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
  await openProjectTab(page, "settings");
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name.toLowerCase());
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

test("the dashed New project tile is the last tile and the card follows the Stasis anatomy", async ({ page }) => {
  const name = `Grid check ${Date.now()}`;
  await makeProject(page, name, "Hardware");
  try {
    const grid = page.locator(".pf-sg-grid");
    await expect(grid.locator("li").last().getByTestId("new-project")).toBeVisible();
    const card = grid.getByRole("link", { name: new RegExp(name) });
    await expect(card).toHaveAttribute("href", /^\/dashboard\/projects\/.+/);
    // The Stasis card: the stage tag on the cover at the top left, the track at the top right, then the title, one hours line.
    await expect(card.locator(".pf-badge")).toHaveText(["Draft", "Hardware"]);
    await expect(card.locator(".pf-sp-tag")).toHaveCount(0);
    await expect(card.locator(".pf-sg-hours")).toHaveText("0.0h");
    await expect(card).toHaveAccessibleDescription("0 H approved, 0 H pending");
    await expect(card).not.toContainText("H logged");
    // The Next up box and the four track levels are gone from this page.
    await expect(page.getByText("Next up")).toHaveCount(0);
    await expect(page.locator(".pf-next, .pf-track-list")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Tools, level/ })).toHaveCount(0);
    await expect(card).not.toContainText("Pinned");
    await expect(card).not.toContainText("Private until approved");
    await expect(page.getByText("Only approved projects are public")).toHaveCount(0);
    // The page is the title and the cards: no lead line and no hours strip.
    await expect(page.getByText("Hours approved")).toHaveCount(0);

    await expect(page.getByTestId("projects-filter")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Project stage" })).toHaveCount(0);
    await expect(card).toBeVisible();

    await page.getByRole("link", { name: new RegExp(name) }).click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
  } finally {
    await deleteProject(page, name);
  }
});


for (const [width, height] of [
  [390, 844],
  [1440, 900],
] as const) {
  test(`the projects page has no WCAG 2.2 AA violations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const name = `Axe grid ${Date.now()}`;
    await makeProject(page, name, "Tools");
    try {
      await page.goto("/dashboard/projects");
      await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    } finally {
      await deleteProject(page, name);
    }
  });
}

// The whole card is one link named by the project title: the owner opens the workspace page, a visitor the public page.
test("a profile card is one link: the owner opens the workspace page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/profile");
  const card = page.locator(".pf-sp-grid a.pf-sp-project").first();
  await expect(card).toBeVisible({ timeout: 30000 });
  const href = await card.getAttribute("href");
  expect(href).toMatch(/^\/dashboard\/projects\/[^/]+$/);
  // One link per card, and one tab stop.
  await expect(card.locator("a")).toHaveCount(0);
  const name = (await card.locator(".pf-sp-project-title").textContent())?.trim() ?? "";
  await expect(page.getByRole("link", { name, exact: true }).first()).toHaveAttribute("href", href!);
  // No repeated tags: no Approved or Pinned tag, and one hours line.
  for (const tag of await card.locator(".pf-sp-tag").allInnerTexts()) expect(tag).not.toMatch(/^(approved|pinned)$/i);
  await expect(card.locator(".pf-sp-foot")).toHaveText(/^[\d.]+ H approved, [\d.]+ H pending$/);
  await card.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/\//g, "\\/") + "$"), { timeout: 30000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("tab", { name: "Journal", exact: true })).toBeVisible();
});

test("a visitor's profile card is one link to the public project page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/builders/juniper_dev");
  const card = page.locator(".pf-sp-grid a.pf-sp-project", { hasText: "Tinyparse" });
  await expect(card).toBeVisible({ timeout: 30000 });
  await expect(card).toHaveAttribute("href", "/dashboard/explore/seed-tinyparse");
  await expect(card.locator("a")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Tinyparse", exact: true })).toHaveAttribute("href", "/dashboard/explore/seed-tinyparse");
  await expect(card.locator(".pf-sp-foot")).toContainText("H approved, ");
  await card.click();
  await expect(page).toHaveURL(/\/dashboard\/explore\/seed-tinyparse$/, { timeout: 30000 });
  await expect(page.getByRole("heading", { level: 1, name: "Tinyparse" })).toBeVisible({ timeout: 30000 });
});
