import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// M1 participant platform. Local development opens without sign-in as the builder test account; the server reads
// LOADOUT_PREVIEW_ROLE from .env.local. The staff, reviewer and admin pages are NOT part of this site: they live on the
// review host and are covered by e2e/reviewer.spec.ts and e2e/reviewer-roles.spec.ts. Here we only check that a staff person sees what a builder sees and
// that the staff addresses are closed on the main host.
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
  "/dashboard/shop/raspberry-pi-5",
  "/dashboard/explore",
  "/dashboard/community",
  "/dashboard/expeditions",
  "/dashboard/tracks/tools",
  "/dashboard/tracks/compute",
];
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
  await expect(page.getByRole("link", { name: /^Systems, level 3 of 15, 0\.7% off Systems prizes/ })).toContainText("0.7% off / 10 H to LV.4");
  await expect(page.getByRole("heading", { name: /^(Your projects|Milestone map|Start here)$/ })).toHaveCount(0);
  await expect(page.getByText(/sample/i)).toHaveCount(0);
});

test("pressing a track card opens its levels", async ({ page }) => {
  await page.goto("/dashboard");
  const card = page.getByRole("link", { name: /^Tools, level/ });
  await expect(card).toBeVisible({ timeout: 30000 });
  await card.click();
  await expect(page.getByRole("heading", { level: 1, name: "Tools" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("img", { name: /^3\.1% off Tools prizes, at level 6/ })).toHaveText("3.1%");
  await expect(page.locator(".pf-strip-n")).toHaveText("LV.6");
  await expect(page.locator(".pf-strip-next")).toHaveText("12 H to LV.7");
  await expect(page.locator(".pf-strip-hint")).toHaveText("6 H waiting for review");
  const cells = page.locator(".pf-strip-cells li");
  await expect(cells).toHaveCount(15);
  await expect(page.locator('.pf-strip-cells li[data-state="done"]')).toHaveCount(6);
  await expect(cells.nth(6)).toHaveAttribute("data-state", "next");
  await expect(page.locator(".pf-strip-pending")).toHaveCount(1);
  const flags = page.locator(".pf-strip-flags li");
  await expect(flags).toHaveCount(4);
  await expect(flags.first()).toContainText("LV.5 / 23 H");
  await expect(flags.first()).toHaveAttribute("data-reached", "true");
  await expect(flags.nth(1)).toHaveAttribute("data-reached", "false");
  await expect(flags.last()).toContainText("Max level");
  // No level cell carries a percentage; only the reward flags below the cells name a coupon.
  await expect(page.locator(".pf-strip-cells").getByText(/%/)).toHaveCount(0);
  await expect(page.locator(".pf-track-page h2")).toHaveText(["Level and discount", "Tools projects"]);
  const switcher = page.getByRole("navigation", { name: "Switch track" }).getByRole("link");
  await expect(switcher).toHaveText(["Tools", "Systems", "Compute", "Hardware"]);
  await expect(switcher.first()).toHaveAttribute("aria-current", "page");
  await switcher.nth(2).click();
  await expect(page).toHaveURL(/\/dashboard\/tracks\/compute$/);
  await expect(page.getByRole("heading", { level: 1, name: "Compute" })).toBeVisible({ timeout: 30000 });
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1, name: "Tools" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("link", { name: "How levels work" })).toHaveAttribute("href", "/docs/progress#levels");
  await expect(page.getByRole("link", { name: "What counts in Tools" })).toHaveAttribute("href", "/docs/tracks");
  await expect(page.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");
});

test("a level cell gives its hours by keyboard and by tap, and the row is one tab stop", async ({ page }) => {
  await page.goto("/dashboard/tracks/tools");
  const cells = page.locator(".pf-strip-cell");
  await expect(cells).toHaveCount(15, { timeout: 30000 });
  await expect(cells.nth(8)).toHaveAttribute("aria-label", "Level 9, 112 hours, locked");
  await expect(page.locator('.pf-strip-cell[tabindex="0"]')).toHaveCount(1);
  await expect(cells.nth(6)).toHaveAttribute("tabindex", "0");

  const tip = page.locator(".pf-strip-tip");
  await cells.nth(6).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tip).toHaveText("LV.8 / 58 H");
  await expect(cells.nth(7)).toBeFocused();
  await page.keyboard.press("End");
  await expect(tip).toHaveText("LV.15 / 178 H");
  await page.keyboard.press("Escape");
  await expect(tip).toHaveCount(0);

  // A mouse shows it on hover, a click keeps it, and moving away hides it.
  await cells.nth(2).click();
  await expect(tip).toHaveText("LV.3 / 9 H");
  await cells.nth(2).click();
  await expect(tip).toHaveText("LV.3 / 9 H");
  await page.mouse.move(0, 0);
  await expect(tip).toHaveCount(0);
});

test.describe("on a touch screen", () => {
  test.use({ hasTouch: true });

  test("tapping a level cell shows its hours, a second tap or a tap elsewhere hides them", async ({ page }) => {
    await page.goto("/dashboard/tracks/tools");
    const cells = page.locator(".pf-strip-cell");
    await expect(cells).toHaveCount(15, { timeout: 30000 });
    const tip = page.locator(".pf-strip-tip");
    await cells.nth(8).tap();
    await expect(tip).toHaveText("LV.9 / 72 H");
    await cells.nth(8).tap();
    await expect(tip).toHaveCount(0);
    await cells.nth(10).tap();
    await expect(tip).toHaveText("LV.11 / 104 H");
    await page.getByRole("heading", { level: 1, name: "Tools" }).tap();
    await expect(tip).toHaveCount(0);
  });
});

test("the Shop lists the proposed items with track tags, discounts and a plain notice that nothing can be ordered", async ({ page }) => {
  await page.goto("/dashboard/shop");
  await expect(page.getByText("Ordering opens in a later release. These are proposed items at draft prices.")).toBeVisible({ timeout: 30000 });
  const cards = page.locator(".pf-shop-card");
  await expect(cards).toHaveCount(72);
  await expect(page.getByRole("button", { name: /buy|order now|checkout/i })).toHaveCount(0);

  // Your Ore and the discount earned in each track.
  const discounts = page.getByRole("region", { name: "Your Ore and discounts" });
  await expect(discounts).toContainText("10 Ore per approved hour");
  await expect(discounts.getByRole("link", { name: /Tools.*3\.1% off/ })).toHaveAttribute("href", "/dashboard/tracks/tools");
  await expect(discounts.getByRole("link", { name: /Hardware.*0\.1% off/ })).toBeVisible();

  // The tag chips: the four tracks and General.
  const tags = page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link");
  await expect(tags).toHaveText(["All items", "Tools", "Systems", "Compute", "Hardware", "General"]);
  await expect(tags.first()).toHaveAttribute("aria-current", "page");

  // A multi-track item shows under every track it relates to.
  await tags.filter({ hasText: "Systems" }).click();
  await expect(page).toHaveURL(/\/dashboard\/shop\?tag=systems$/);
  await expect(cards).toHaveCount(16);
  await expect(cards.filter({ hasText: "Raspberry Pi 5" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "Hardware security key" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "Framework 16 laptop" })).toHaveCount(1);
  // The best related track's discount applies: Systems LV.3 is 0.7%, which takes the Pi from 490 to 487 Ore.
  const pi = cards.filter({ hasText: "Raspberry Pi 5" });
  await expect(pi).toContainText("Was 490");
  await expect(pi).toContainText("now 487");

  // General items are open to everyone at the full price.
  await page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link", { name: "General" }).click();
  await expect(cards).toHaveCount(10);
  await expect(cards.first().locator("h3")).toHaveText("$50 technical conference grant");
  await expect(cards.filter({ hasText: "Electric precision screwdriver set" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "Cable and adapter kit" })).toHaveCount(1);

  // Search, sort and the affordable filter live in the address, with a message when nothing matches.
  await page.goto("/dashboard/shop?sort=high");
  await expect(cards.first().locator("h3")).toHaveText("Framework 16 laptop", { timeout: 30000 });
  await page.goto("/dashboard/shop?afford=1");
  await expect(page.getByText(/Nothing you can afford yet/)).toBeVisible({ timeout: 30000 });
  await page.goto("/dashboard/shop?q=zzzz");
  await expect(page.getByText("No items match.")).toBeVisible({ timeout: 30000 });
  await page.getByRole("link", { name: "Clear the filters" }).click();
  await expect(cards).toHaveCount(72);
});

test("a Shop item shows how its price is worked out and nothing to buy, and an unknown item is a 404", async ({ page }) => {
  await page.goto("/dashboard/shop");
  await page.locator(".pf-shop-card").filter({ hasText: "Enclosed 3D printer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Enclosed 3D printer" })).toBeVisible({ timeout: 30000 });
  const price = page.getByRole("region", { name: "Your price" });
  await expect(price).toContainText("Base price1,020 Ore");
  await expect(price).toContainText("Hardware level discount−0.1%");
  await expect(price).toContainText("You pay1,044 Ore");
  await expect(price).toContainText("With a Field Requisition this would be 917 Ore");
  await expect(price).toContainText("Ordering opens in a later release");
  await expect(page.getByRole("button", { name: /buy|order|checkout/i })).toHaveCount(0);

  // A General item has no level discount and no Requisition.
  await page.goto("/dashboard/shop/conference-grant");
  await expect(page.getByRole("heading", { level: 1, name: /technical conference grant/ })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("region", { name: "Your price" })).toContainText("General itemNo discount");
  await expect(page.getByRole("region", { name: "Your price" })).toContainText("You pay120 Ore");
  await expect(page.getByText(/With a Field Requisition/)).toHaveCount(0);

  // A gated item shows what it needs, on its card and on its page, and still shows the price.
  await page.goto("/dashboard/shop?q=oscilloscope");
  const scope = page.locator(".pf-shop-card");
  await expect(scope).toHaveCount(1, { timeout: 30000 });
  await expect(scope).toContainText("Needs Hardware LV.8");
  await scope.click();
  await expect(page.getByRole("heading", { level: 1, name: "Digital oscilloscope" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("note")).toContainText("Needs Hardware LV.8. 88 more approved hours in Hardware to unlock it.");
  // A photo taken from Wikimedia Commons is credited on the item page; one from Pixl's shop has no credit line.
  await page.goto("/dashboard/shop/nas");
  await expect(page.getByRole("heading", { level: 1, name: "2-bay NAS" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Photo: DYVER, CC BY-SA 4.0, via")).toBeVisible();
  await expect(page.getByRole("link", { name: "Wikimedia Commons" })).toHaveAttribute("href", /commons[.]wikimedia[.]org[/]wiki[/]File:Synology_Disk_Station/);
  await page.goto("/dashboard/shop/flipper-zero");
  await expect(page.getByRole("heading", { level: 1, name: "Flipper Zero" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/^Photo: /)).toHaveCount(0);

  const response = await page.goto("/dashboard/shop/not-an-item");
  expect(response?.status()).toBe(404);
});

test("Explore has a search box, the track filters and a message when nothing is published", async ({ page }) => {
  await page.goto("/dashboard/explore");
  await expect(page.getByRole("search")).toBeVisible({ timeout: 30000 });
  const filters = page.getByRole("navigation", { name: "Filter by track" }).getByRole("link");
  await expect(filters).toHaveText(["All tracks", "Tools", "Systems", "Compute", "Hardware"]);
  await expect(filters.first()).toHaveAttribute("aria-current", "page");

  await filters.nth(1).click();
  await expect(page).toHaveURL(/\/dashboard\/explore\?track=tools$/);
  await expect(page.getByRole("link", { name: "Tools", exact: true })).toHaveAttribute("aria-current", "page");

  await page.getByRole("searchbox").fill("zzzz nothing matches this");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=zzzz\+nothing\+matches\+this&track=tools/);
  await expect(page.getByText("No projects match.")).toBeVisible();
  await page.getByRole("link", { name: "Clear the search" }).click();
  await expect(page).toHaveURL(/\/dashboard\/explore$/);
});

test("a draft is not public: its Explore page is a 404, and so is an unknown id", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await openFirstProject(page);
  const id = new URL(page.url()).pathname.split("/").pop();
  const draft = await page.goto(`/dashboard/explore/${id}`);
  expect(draft?.status()).toBe(404);
  const unknown = await page.goto("/dashboard/explore/not-a-project");
  expect(unknown?.status()).toBe(404);
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

// The old staff addresses are gone, and /reviewer answers 404 on any host that is not review.<domain>, staff or not.
for (const path of ["/dashboard/staff/users", "/dashboard/review", "/dashboard/reviewers", "/reviewer", "/reviewer/users", "/reviewer/ship/sh-2041"]) {
  test(`${path} is a 404 on the participant site`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  });
}

// The top bar has seven tabs and no staff group, whoever is signed in. A staff person sees what a builder sees.
test("the top bar has the seven participant tabs and no staff tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Participant" });
  await expect(nav).toBeVisible({ timeout: 30000 });
  await expect(nav.getByRole("link")).toHaveText(["Overview", "Projects", "Shop", "Explore", "Community", "Expeditions", "Docs"]);
  for (const name of ["Users", "Review", "Reviewers", "Audit log", "Feature flags", "Flags", "Events", "Referrals"]) {
    await expect(nav.getByRole("link", { name, exact: true })).toHaveCount(0);
  }
  await expect(page.getByText("Staff", { exact: true })).toHaveCount(0);
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
  // The title arrives with the page's metadata, a moment after the content; axe flags a missing title if it runs first.
  await expect(page).toHaveTitle("Project - LOADOUT");
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
