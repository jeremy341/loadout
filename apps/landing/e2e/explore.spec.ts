import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Explore: the search-first header with live rows, the track and Saved chips, the rails, the paged results page that works with
// no script, the Save star on cards and the project page. Local development opens as the builder test account (handle
// test_builder). Seeded: handles test_builder, juniper_dev, kestrel, pixel-fox, bolt_nine; the builder has saved Tinyparse,
// Orbit Sim and Tape Deck. Saving changes the local database, so each test that saves puts the seeded state back.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const results = (page: Page) => page.locator(".pf-explore-results");
const grid = (page: Page) => page.locator(".pf-explore-grid");

async function type(page: Page, text: string) {
  const box = page.getByRole("searchbox", { name: "Search" });
  await box.fill(text);
  return box;
}

// Puts the Lamp Bus star back to "not saved" through the page, whatever state a failed test left.
async function unsaveLampBus(page: Page) {
  await page.goto("/dashboard/explore/seed-lamp-bus");
  const star = page.getByRole("button", { name: "Save Lamp Bus" });
  await expect(star).toBeVisible({ timeout: 30000 });
  if ((await star.getAttribute("aria-pressed")) === "true") {
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await page.waitForTimeout(500);
  }
}

test("the rails render: Saved, New, Used most and one per track, with a Saved chip count", async ({ page }) => {
  await page.goto("/dashboard/explore");
  for (const name of ["Saved", "New", "Used most", "Tools", "Systems", "Compute", "Hardware"]) {
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible({ timeout: 30000 });
  }
  await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 3");
  const saved = page.getByRole("region", { name: "Saved" });
  await expect(saved.getByText("Only you can see this list.")).toBeVisible();
  await expect(saved.getByRole("link", { name: /Tinyparse/ })).toBeVisible();
  await expect(saved.getByRole("link", { name: /Orbit Sim/ })).toBeVisible();
  await expect(saved.getByRole("link", { name: /Tape Deck/ })).toBeVisible();
  // a card has a foot line with the handle and no depth chip
  await expect(saved.getByRole("link", { name: /Tinyparse/ })).toContainText("by juniper_dev");
  await expect(saved.getByRole("link", { name: /Tinyparse/ })).toContainText("Used by 1");
  await expect(page.locator(".pf-explore-card .pf-core-depth")).toHaveCount(0);
  // a track rail offers See all {track}
  await expect(page.getByRole("link", { name: "See all Hardware" })).toHaveAttribute("href", "/dashboard/explore?track=hardware");
});

test("the New strip scrolls with its arrow buttons at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/explore");
  const right = page.getByRole("button", { name: "Scroll New right" });
  await expect(right).toBeVisible({ timeout: 30000 });
  await expect(right).toBeEnabled();
  await expect(page.getByRole("button", { name: "Scroll New left" })).toBeDisabled();
  await right.click();
  await expect(page.getByRole("button", { name: "Scroll New left" })).toBeEnabled();
});

test("live search by title shows rows and a polite count, and Enter opens the full results page", async ({ page }) => {
  await page.goto("/dashboard/explore");
  const box = await type(page, "tinyp");
  await expect(results(page).getByRole("link", { name: /Tinyparse/ })).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".pf-explore-status")).toHaveText("1 project.");
  await expect(page.locator(".pf-explore-status")).toHaveAttribute("aria-live", "polite");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/dashboard\/explore\?q=tinyp$/);
  await expect(grid(page).getByRole("link", { name: /Tinyparse/ })).toBeVisible();
  await expect(page.locator(".pf-explore-count")).toContainText("1 project.");
});

test("search by handle and by:handle, and the track: filter", async ({ page }) => {
  await page.goto("/dashboard/explore");
  await type(page, "kestrel");
  await expect(results(page).getByRole("link", { name: /Orbit Sim/ })).toBeVisible({ timeout: 15000 });
  await expect(results(page).getByRole("link", { name: /Gridlock/ })).toBeVisible();
  await expect(results(page).getByRole("link", { name: /Tinyparse/ })).toHaveCount(0);

  await type(page, "by:pixel-fox");
  await expect(results(page).getByRole("link", { name: /Lamp Bus/ })).toBeVisible({ timeout: 15000 });
  await expect(results(page).getByRole("link", { name: /Orbit Sim/ })).toHaveCount(0);

  await type(page, "track:hardware");
  await expect(results(page).getByRole("link", { name: /Pocket Synth/ })).toBeVisible({ timeout: 15000 });
  await expect(results(page).getByRole("link", { name: /Lamp Bus/ })).toBeVisible();
  await expect(results(page).getByRole("link", { name: /Tinyparse/ })).toHaveCount(0);
});

test("no results: the live line, the full page message and the Clear link", async ({ page }) => {
  await page.goto("/dashboard/explore");
  const box = await type(page, "zzzz nothing matches");
  await expect(page.locator(".pf-explore-status")).toHaveText("No projects match. Clear the search.", { timeout: 15000 });
  await expect(results(page)).toHaveCount(0);
  await box.press("Enter");
  await expect(page).toHaveURL(/q=zzzz\+nothing\+matches$/);
  await expect(page.locator(".pf-empty-line")).toContainText("No projects match.");
  await page.locator(".pf-empty-line").getByRole("link", { name: "Clear the search" }).click();
  await expect(page).toHaveURL(/\/dashboard\/explore$/);
  await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("");
});

test("the Clear button empties the field and hides the rows", async ({ page }) => {
  await page.goto("/dashboard/explore");
  const box = await type(page, "tiny");
  await expect(results(page).getByRole("link", { name: /Tinyparse/ })).toBeVisible({ timeout: 15000 });
  await page.locator(".pf-explore-field").getByRole("link", { name: "Clear" }).click();
  await expect(box).toHaveValue("");
  await expect(box).toBeFocused();
  await expect(results(page)).toHaveCount(0);
});

test("the Saved chip filters to the saved projects and says the list is private", async ({ page }) => {
  await page.goto("/dashboard/explore");
  await page.getByRole("link", { name: /^Saved \d+$/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/explore\?saved=1$/);
  await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveAttribute("aria-current", "page");
  await expect(grid(page).getByRole("link")).toHaveCount(3);
  for (const title of [/Tinyparse/, /Orbit Sim/, /Tape Deck/]) await expect(grid(page).getByRole("link", { name: title })).toBeVisible();
  await expect(page.locator(".pf-explore-count")).toContainText("3 projects.");
  await expect(page.getByText("Only you can see this list.")).toBeVisible();

  // saved plus a search that matches nothing
  await page.goto("/dashboard/explore?saved=1&q=zzzz");
  await expect(page.locator(".pf-empty-line")).toContainText("No saved projects match.");
  // saved plus a track keeps only the matching saved project
  await page.goto("/dashboard/explore?saved=1&track=tools");
  await expect(grid(page).getByRole("link")).toHaveCount(1);
  await expect(grid(page).getByRole("link", { name: /Tinyparse/ })).toBeVisible();
});

test("saving and unsaving from a card updates the count and survives a reload", async ({ page }) => {
  try {
    await page.goto("/dashboard/explore?track=hardware");
    const star = grid(page).getByRole("button", { name: "Save Lamp Bus" });
    await expect(star).toHaveAttribute("aria-pressed", "false", { timeout: 30000 });
    await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 3");

    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await expect(star).toBeFocused();
    await expect(page.locator(".pf-saved-status")).toHaveText("Saved.", { timeout: 10000 });
    await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 4", { timeout: 10000 });
    // the accessible name never changes with the state
    await expect(star).toHaveAccessibleName("Save Lamp Bus");

    await page.reload();
    await expect(grid(page).getByRole("button", { name: "Save Lamp Bus" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 4");

    await grid(page).getByRole("button", { name: "Save Lamp Bus" }).click();
    await expect(page.locator(".pf-saved-status")).toHaveText("Removed from Saved.", { timeout: 10000 });
    await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 3", { timeout: 10000 });
    await page.reload();
    await expect(grid(page).getByRole("button", { name: "Save Lamp Bus" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 3");
  } finally {
    await unsaveLampBus(page);
  }
});

test("the Save button on a project page toggles and keeps its name", async ({ page }) => {
  try {
    await page.goto("/dashboard/explore/seed-lamp-bus");
    const star = page.getByRole("button", { name: "Save Lamp Bus" });
    await expect(star).toHaveAttribute("aria-pressed", "false", { timeout: 30000 });
    await expect(star).toContainText("Save");
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await expect(star).toContainText("Saved");
    await expect(page.locator(".pf-saved-status")).toHaveText("Saved.", { timeout: 10000 });
  } finally {
    await unsaveLampBus(page);
  }
});

test("keyboard: type, Tab to a row, Enter opens the project; Enter in the field submits", async ({ page }) => {
  await page.goto("/dashboard/explore");
  const box = page.getByRole("searchbox", { name: "Search" });
  await expect(box).toBeVisible({ timeout: 30000 });
  await box.focus();
  await page.keyboard.type("tinyp");
  await expect(results(page).getByRole("link", { name: /Tinyparse/ })).toBeVisible({ timeout: 15000 });
  let reached = false;
  for (let i = 0; i < 8 && !reached; i += 1) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.closest(".pf-explore-results") !== null && document.activeElement?.tagName === "A");
  }
  expect(reached).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dashboard\/explore\/seed-tinyparse$/);

  // the star in a result row is a button after its link in the tab order
  await page.goto("/dashboard/explore");
  await type(page, "tinyp");
  const star = results(page).getByRole("button", { name: "Save Tinyparse" });
  await expect(star).toHaveAttribute("aria-pressed", "true", { timeout: 15000 });
});

test("the results page works with no script: ?q, ?track, ?saved and the form", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  try {
    await page.goto("/dashboard/explore?q=kestrel&track=compute");
    await expect(grid(page).getByRole("link", { name: /Orbit Sim/ })).toBeVisible({ timeout: 30000 });
    await expect(grid(page).getByRole("link")).toHaveCount(1);
    await expect(page.locator(".pf-explore-count")).toContainText("1 project.");
    await page.goto("/dashboard/explore?saved=1");
    await expect(grid(page).getByRole("link")).toHaveCount(3);
    await page.goto("/dashboard/explore?page=2&q=tiny");
    await expect(grid(page).getByRole("link", { name: /Tinyparse/ })).toBeVisible();

    await page.goto("/dashboard/explore");
    await page.getByRole("searchbox", { name: "Search" }).fill("pocket");
    await page.getByRole("searchbox", { name: "Search" }).press("Enter");
    await expect(page).toHaveURL(/\/dashboard\/explore\?q=pocket$/);
    await expect(grid(page).getByRole("link", { name: /Pocket Synth/ })).toBeVisible();
    // a chip is a plain link
    await page.getByRole("navigation", { name: "Filter by track" }).getByRole("link", { name: "Hardware" }).click();
    await expect(page).toHaveURL(/q=pocket&track=hardware$/);
  } finally {
    await context.close();
  }
});

test("a project page has the Save button, the plate, four stats, Source and the boxes", async ({ page }) => {
  await page.goto("/dashboard/explore/seed-tinyparse");
  await expect(page.getByRole("heading", { level: 1, name: "Tinyparse" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: "Save Tinyparse" })).toHaveAttribute("aria-pressed", "true");
  const stats = page.locator(".pf-explore-stats");
  for (const label of ["Approved hours", "Depth", "Journal entries", "Used by"]) await expect(stats).toContainText(label);
  await expect(page.getByRole("link", { name: /^Source github\.com\/example-handle\/tinyparse$/ })).toHaveAttribute("href", /^https:\/\//);
  for (const name of ["Used by", "Tools in this project", "Journal", "README"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "juniper_dev" })).toHaveAttribute("href", "/dashboard/builders/juniper_dev");
});

for (const [width, height] of [[390, 844], [1440, 900]] as const) {
  for (const path of ["/dashboard/explore", "/dashboard/explore?saved=1", "/dashboard/explore?q=zzzz", "/dashboard/explore/seed-tinyparse"]) {
    test(`axe finds nothing on ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible({ timeout: 30000 });
      const found = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }

  test(`axe finds nothing with live results open at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dashboard/explore");
    await type(page, "tiny");
    await expect(results(page).getByRole("link", { name: /Tinyparse/ })).toBeVisible({ timeout: 15000 });
    const found = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
}
