import AxeBuilder from "@axe-core/playwright";
import { createProjectViaWizard, openProjectTab, saveProjectSettings } from "./new-project-helper";
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
  "/dashboard/projects",
  "/dashboard/settings",
  "/dashboard/shop",
  "/dashboard/shop/raspberry-pi-5",
  "/dashboard/explore",
  "/dashboard/community",
  "/dashboard/ideas",
  "/dashboard/notifications",
  "/dashboard/shop/expeditions",
  "/dashboard/tracks/tools",
  "/dashboard/tracks/compute",
];
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";

async function setTheme(page: Page, width: number, height: number, scheme: (typeof SCHEMES)[number]) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
}

test("the dashboard home is gone: /dashboard redirects to Projects with a permanent redirect", async ({ page, request }) => {
  const response = await request.get("/dashboard", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(/\/dashboard\/projects$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
});

test("Projects is the Stasis grid: no Next up box and no track levels, the Docs link is in the sidebar", async ({ page }) => {
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Next up")).toHaveCount(0);
  await expect(page.locator(".pf-track-list")).toHaveCount(0);
  await expect(page.getByTestId("new-project")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Participant" }).getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs/start");
  await expect(page.getByRole("heading", { name: /^(Overview|Recent|Milestone map|Start here)$/ })).toHaveCount(0);
});

test("a track page opens its levels", async ({ page }) => {
  await page.goto("/dashboard/tracks/tools");
  await expect(page.getByRole("heading", { level: 1, name: "Tools" })).toBeVisible({ timeout: 30000 });
  // The Tools sample is 58 approved hours: level 8 of 20 (LV.8 starts at 58 H), 14 H short of LV.9 (72 H).
  await expect(page.getByRole("img", { name: /^4\.8% off Tools prizes, at level 8/ })).toHaveText("4.8%");
  await expect(page.locator(".pf-strip-n")).toHaveText("LV.8");
  await expect(page.locator(".pf-strip-next")).toHaveText("14 H to LV.9");
  await expect(page.locator(".pf-strip-hint")).toHaveText("6 H waiting for review");
  const cells = page.locator(".pf-strip-cells li");
  await expect(cells).toHaveCount(20);
  await expect(page.locator('.pf-strip-cells li[data-state="done"]')).toHaveCount(8);
  await expect(cells.nth(8)).toHaveAttribute("data-state", "next");
  await expect(page.locator(".pf-strip-pending")).toHaveCount(1);
  const flags = page.locator(".pf-strip-rewards li");
  // Reward flags at LV.5, 8, 11, 15, 18 and 20. LV.5 and LV.8 are reached at 58 H; LV.11 is not.
  await expect(flags).toHaveCount(6);
  await expect(flags.first()).toContainText("LV.5 / 23 H");
  await expect(flags.first()).toHaveAttribute("data-reached", "true");
  await expect(flags.nth(1)).toContainText("LV.8 / 58 H");
  await expect(flags.nth(1)).toHaveAttribute("data-reached", "true");
  await expect(flags.nth(2)).toContainText("LV.11 / 104 H");
  await expect(flags.nth(2)).toHaveAttribute("data-reached", "false");
  await expect(flags.last()).toContainText("LV.20 / 275 H");
  await expect(flags.last()).toContainText("10% coupon");
  await expect(page.locator(".pf-strip-max")).toHaveCount(0);
  // No level cell carries a percentage; only the coupon list below the cells name a coupon.
  await expect(page.locator(".pf-strip-cells").getByText(/%/)).toHaveCount(0);
  // The page ends with the Docs links; the builder's projects live on Projects, not here.
  await expect(page.locator(".pf-track-page h2")).toHaveText(["Level and discount"]);
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
  await expect(page.getByRole("navigation", { name: "Participant" }).getByRole("link", { name: "Projects", exact: true })).toHaveAttribute("aria-current", "page");
});

test("a level cell gives its hours by keyboard and by tap, and the row is one tab stop", async ({ page }) => {
  await page.goto("/dashboard/tracks/tools");
  const cells = page.locator(".pf-strip-cell");
  await expect(cells).toHaveCount(20, { timeout: 30000 });
  // At 58 H the Tools level is 8, so the next cell (LV.9, 72 H) is the one tab stop and LV.13 (140 H) is locked.
  await expect(cells.nth(12)).toHaveAttribute("aria-label", "Level 13, 140 hours, locked");
  await expect(cells.nth(8)).toHaveAttribute("aria-label", "Level 9, 72 hours, next level");
  await expect(page.locator('.pf-strip-cell[tabindex="0"]')).toHaveCount(1);
  await expect(cells.nth(8)).toHaveAttribute("tabindex", "0");

  const tip = page.locator(".pf-strip-tip");
  await cells.nth(8).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tip).toHaveText("LV.10 / 87 H");
  await expect(cells.nth(9)).toBeFocused();
  await page.keyboard.press("End");
  await expect(tip).toHaveText("LV.20 / 275 H");
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
    await expect(cells).toHaveCount(20, { timeout: 30000 });
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
  await expect(page.getByText("Ordering opens in a later release.")).toHaveCount(0, { timeout: 30000 });
  // The hub lists 24 items at a time; the rest come with Show more. The layout is covered in e2e/shop.spec.ts.
  const cards = page.locator(".pf-shop-grid .pf-shop-card");
  await expect(cards).toHaveCount(24);
  await expect(page.getByRole("button", { name: /buy|order now|checkout/i })).toHaveCount(0);

  // The discount earned in each track. The Your Ore panel was removed on purpose: the Ore chip in the top bar is the one place.
  await expect(page.getByLabel("Your Ore")).toHaveCount(0);
  const discounts = page.getByRole("list", { name: "Your level discount by track" });
  await expect(discounts.getByRole("link", { name: /Tools.*\d(\.\d)?% off/ })).toHaveAttribute("href", "/dashboard/tracks/tools");
  await expect(discounts.getByRole("link", { name: /Hardware.*\d(\.\d)?% off/ })).toBeVisible();

  // The category tiles were removed on purpose; the tag chips filter by tag.
  await expect(page.getByRole("navigation", { name: "Shop categories" })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link", { name: "Systems" }).click();
  await expect(page).toHaveURL(/\/dashboard\/shop\?tag=systems$/);
  const tags = page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link");
  await expect(tags).toHaveText(["All items", "Tools", "Systems", "Compute", "Hardware", "General"]);
  await expect(tags.nth(2)).toHaveAttribute("aria-current", "page");

  // A multi-track item shows under every track it relates to, at the best related track discount.
  await expect(cards).toHaveCount(16);
  await expect(cards.filter({ hasText: "Raspberry Pi 5" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "Hardware security key" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "Framework 16 laptop" })).toHaveCount(1);
  const pi = cards.filter({ hasText: "Raspberry Pi 5" });
  await expect(pi).toContainText("Was 490");
  await expect(pi).toContainText(/now \d+/);

  // General items are open to everyone at the full price.
  await tags.filter({ hasText: "General" }).click();
  await expect(cards).toHaveCount(10);
  await expect(cards.first().locator("h3")).toHaveText("$50 technical conference grant");
  await expect(cards.filter({ hasText: "Electric precision screwdriver set" })).toHaveCount(1);
  await expect(cards.filter({ hasText: "Cable and adapter kit" })).toHaveCount(1);

  // Sort and the affordable filter live in the address, with a message when nothing matches.
  await page.goto("/dashboard/shop?sort=high");
  await expect(cards.first().locator("h3")).toHaveText("Framework 16 laptop", { timeout: 30000 });
  await page.goto("/dashboard/shop?afford=1");
  await expect(page.getByText(/Nothing you can afford yet/)).toBeVisible({ timeout: 30000 });
  await page.goto("/dashboard/shop?q=zzzz");
  await expect(page.getByText("No items match.")).toBeVisible({ timeout: 30000 });
  await page.getByRole("link", { name: "Clear the filters" }).click();
  await expect(cards).toHaveCount(24);
});

test("a Shop item shows how its price is worked out and nothing to buy, and an unknown item is a 404", async ({ page }) => {
  await page.goto("/dashboard/shop?q=enclosed");
  await page.locator(".pf-shop-card").filter({ hasText: "Enclosed 3D printer" }).getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1, name: "Enclosed 3D printer" })).toBeVisible({ timeout: 30000 });
  const price = page.getByRole("region", { name: "Your price" });
  await expect(price).toContainText("Base price1,020 Ore");
  await expect(price).toContainText(/Hardware level discount−\d+(\.\d)?%/);
  await expect(price).toContainText(/You pay[\d,]+ Ore/);
  await expect(price.getByRole("checkbox", { name: /Field Requisition/ })).toBeVisible();
  await expect(price).toContainText("How prices are worked out");
  // The only order control is closed, with its reason.
  await expect(page.getByRole("button", { name: "Order opens later" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("button", { name: /buy|checkout/i })).toHaveCount(0);

  // A General item has no level discount and no Requisition.
  await page.goto("/dashboard/shop/conference-grant");
  await expect(page.getByRole("heading", { level: 1, name: /technical conference grant/ })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("region", { name: "Your price" })).toContainText("General itemNo discount");
  await expect(page.getByText(/With a Field Requisition/)).toHaveCount(0);

  // A gated item shows what it needs, on its card and on its page, and still shows the price.
  await page.goto("/dashboard/shop?q=oscilloscope");
  const scope = page.locator(".pf-shop-card");
  await expect(scope).toHaveCount(1, { timeout: 30000 });
  await expect(scope).toContainText("Needs Hardware LV.8");
  await scope.getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1, name: "Digital oscilloscope" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("note")).toContainText(/Needs Hardware LV\.8\. \d+ more approved hours in Hardware to unlock it\./);
  // A photo taken from Wikimedia Commons is credited on the item page; one from the Pixl shop has no credit line.
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
  await expect(filters).toHaveText(["All tracks", "Tools", "Systems", "Compute", "Hardware", /^Saved \d+$/]);
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

test("a draft is public: its Explore page opens with a draft notice, and an unknown id is a 404", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await openFirstProject(page);
  const id = new URL(page.url()).pathname.split("/").pop();
  const draft = await page.goto(`/dashboard/explore/${id}`);
  expect(draft?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
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

// The top bar has four tabs and the account menu, and no staff group, whoever is signed in. A staff person sees what a builder sees.
test("the sidebar has the grouped participant links and no staff links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/projects");
  const nav = page.getByRole("navigation", { name: "Participant" });
  await expect(nav).toBeVisible({ timeout: 30000 });
  await expect(nav.getByRole("link")).toHaveText(["Projects", "Review Queue", "Explore", "Ideas", "Community", "Docs", "Shop", "Expeditions", "Orders", "Profile", "Ledger", "Settings"]);
  for (const name of ["Referrals", "Events", "Users", "Review", "Reviewers", "Audit log", "Feature flags", "Flags"]) {
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

// An idea's page needs an idea. Open the first one on the list; when the list is empty, share one first (the form is the page's own).
async function openFirstIdea(page: Page) {
  await page.goto("/dashboard/ideas");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
  const links = page.locator("h2.pf-id-title a");
  if ((await links.count()) === 0) {
    await page.getByRole("button", { name: "Share an idea" }).click();
    await page.getByLabel("Title").fill(`Axe check idea ${Date.now()}`);
    await page.getByLabel(/What do you want to build/).fill("A small tool that checks the page for accessibility problems, written so that anyone on the team can run it. ".repeat(3));
    await page.getByRole("button", { name: "Share idea" }).click();
    await page.goto("/dashboard/ideas");
    await expect(links.first()).toBeVisible({ timeout: 30000 });
  }
  await links.first().click();
  await expect(page).toHaveURL(/\/dashboard\/ideas\/[^/?]+$/, { timeout: 30000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
}

for (const [width, height] of VIEWPORTS) {
  for (const scheme of SCHEMES) {
    test(`an idea page has no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
      test.skip(STAFF_MODE, "participant pages are checked in builder mode");
      await setTheme(page, width, height, scheme);
      await openFirstIdea(page);
      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

// The project page needs a project. This test makes one through the creation wizard when the test account has none, so it works on a fresh database too.
async function openFirstProject(page: Page) {
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
  const cards = page.locator("a.pf-sg-card");
  if ((await cards.count()) === 0) {
    await createProjectViaWizard(page, "Axe check project");
    await page.goto("/dashboard/projects");
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
  }
}

test("a builder can edit a project and then delete it", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const stamp = Date.now();
  const first = `Edit check ${stamp}`;
  const renamed = `Edited ${stamp}`;

  await createProjectViaWizard(page, first);

  // Edit in the Settings tab: new name, a description and the Tools track. There is no Edit project dialog any more.
  await expect(page.getByRole("button", { name: "Edit project" })).toHaveCount(0);
  await saveProjectSettings(page, { name: renamed, description: "A short note.", track: "Tools" });
  await expect(page.getByRole("heading", { level: 1, name: renamed })).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".pf-project-lead")).toHaveText("A short note.");
  await expect(page.locator(".pf-column-tag")).toHaveText("Tools");

  // Delete: the button stays off until the name is typed back, and the project is gone afterwards.
  await openProjectTab(page, "settings");
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
