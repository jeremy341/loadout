import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Redesign phase 1 and its follow-up: the grouped sidebar (900px and up), the top bar with Ore and the account menu at the top right,
// the drawer (under 900px), the one modal (the Projects filter) and the old addresses. Local development
// opens without sign-in as the builder test account (see platform.spec.ts).
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const WIDTHS = [320, 390, 471, 700, 900, 1440] as const;
const SHOTS = process.env.LOADOUT_SHOT_DIR ?? "C:\\Users\\jerem\\AppData\\Local\\Temp\\loadout-shots";
mkdirSync(SHOTS, { recursive: true });

async function setup(page: Page, width: number, height: number, scheme: "dark" | "light" = "dark") {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
}

async function openProjects(page: Page) {
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
}

async function openDrawer(page: Page) {
  const menu = page.getByRole("button", { name: "Menu" });
  await expect(async () => {
    await menu.click();
    await expect(page.getByRole("complementary", { name: "Site" })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
}

// The Edit profile modal is the vehicle for the one-modal checks (the New project dialog became a page in phase 2).
async function openModal(page: Page) {
  await page.goto("/dashboard/profile");
  const trigger = page.getByRole("button", { name: "Edit profile" });
  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  await expect(trigger).toBeVisible({ timeout: 30000 });
  await expect(async () => {
    await trigger.click();
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  return { trigger, dialog };
}

test("at 1440 the sidebar holds the grouped links and the theme switch, and the top bar holds Ore and Account at the top right", async ({ page }) => {
  await setup(page, 1440, 900);
  await openProjects(page);
  const side = page.getByRole("complementary", { name: "Site" });
  await expect(side).toBeVisible();
  const nav = side.getByRole("navigation", { name: "Participant" });
  await expect(nav.getByRole("link")).toHaveText(["Projects", "Review Queue", "Explore", "Ideas", "Community", "Docs", "Shop", "Expeditions", "Orders", "Profile", "Ledger", "Settings"]);
  for (const [group, labels] of [["Build", ["Projects", "Review Queue"]], ["Discover", ["Explore", "Ideas", "Community", "Docs"]], ["Shop", ["Shop", "Expeditions", "Orders"]], ["Me", ["Profile", "Ledger", "Settings"]]] as const) {
    await expect(nav.getByRole("list", { name: group }).getByRole("link")).toHaveText([...labels]);
  }
  await expect(nav.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveCount(0);
  await expect(side.getByRole("switch", { name: "Light mode" })).toBeVisible();
  // Ore and Account are not in the sidebar any more.
  await expect(side.getByRole("button", { name: "Account" })).toHaveCount(0);
  await expect(side.locator("a.pf-ore")).toHaveCount(0);
  const bar = page.locator(".pf-strip");
  await expect(bar.locator("a.pf-ore")).toHaveAttribute("href", "/dashboard/ledger");
  const account = bar.getByRole("button", { name: "Account" });
  await expect(account).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
  for (const gone of ["Referrals"]) await expect(nav.getByRole("link", { name: gone })).toHaveCount(0);
  const box = await side.boundingBox();
  // 232px of sidebar plus the 44px rail kept for the accessibility tab, which sits on the left window edge.
  expect(box?.width).toBe(276);
  expect(box?.x).toBe(0);
  const tabBox = await page.locator(".a11y-tab").boundingBox();
  expect(tabBox).not.toBeNull();
  // The tab is in the rail: it never reaches a navigation link.
  for (const link of await nav.getByRole("link").all()) {
    const linkBox = await link.boundingBox();
    expect(linkBox && tabBox && linkBox.x >= tabBox.x + tabBox.width, "nav link clear of the accessibility tab").toBe(true);
  }
  const accountBox = await account.boundingBox();
  const barBox = await bar.boundingBox();
  expect(accountBox && barBox && accountBox.x + accountBox.width <= barBox.x + barBox.width + 1 && accountBox.x + accountBox.width >= barBox.x + barBox.width - 40).toBe(true);
  expect(accountBox && accountBox.x > 240).toBe(true);
  await page.screenshot({ path: join(SHOTS, "shell-fu-1440-dark.png") });
});

for (const [width, height] of [[1440, 900], [390, 800]] as const) {
  test(`the account menu opens downward at the top right at ${width} and Escape returns focus to its button`, async ({ page }) => {
    await setup(page, width, height);
    await openProjects(page);
    const button = page.getByRole("button", { name: "Account" });
    await expect(async () => {
      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
    }).toPass({ timeout: 15000 });
    const panel = page.getByRole("navigation", { name: "Account" });
    await expect(panel.getByRole("link")).toHaveText(["Profile", "Ledger", "Notifications", "Orders", "Referrals", "Settings"]);
    const panelBox = await panel.boundingBox();
    const buttonBox = await button.boundingBox();
    expect(panelBox && buttonBox && panelBox.y >= buttonBox.y + buttonBox.height).toBe(true);
    expect(panelBox && panelBox.x >= 0 && panelBox.x + panelBox.width <= width).toBe(true);
    await page.screenshot({ path: join(SHOTS, `shell-fu-account-open-${width}-dark.png`) });
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(button).toBeFocused();
  });
}

test("at 390 the top bar holds Menu on the left, Ore and Account on the right, and the drawer is closed", async ({ page }) => {
  await setup(page, 390, 800);
  await openProjects(page);
  const strip = page.locator(".pf-strip");
  await expect(strip).toBeVisible();
  await expect(strip.getByRole("button", { name: "Account" })).toBeVisible();
  await expect(strip.locator("a.pf-ore")).toBeVisible();
  const menuBox = await strip.getByRole("button", { name: "Menu" }).boundingBox();
  const accountBox = await strip.getByRole("button", { name: "Account" }).boundingBox();
  expect(menuBox && accountBox && menuBox.x < 40 && accountBox.x + accountBox.width > 390 - 40).toBe(true);
  await expect(page.getByRole("complementary", { name: "Site" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  await page.screenshot({ path: join(SHOTS, "shell-fu-390-closed-dark.png") });
});

for (const [width, height] of [[1440, 900], [390, 800]] as const) {
  test(`the skip link is the first Tab stop at ${width} and moves focus to the main region`, async ({ page }) => {
    await setup(page, width, height);
    await openProjects(page);
    const skip = page.getByRole("link", { name: "Skip to content" });
    // Only the skip link comes before the accessibility tab in the DOM and in the Tab order.
    const order = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll<HTMLElement>("a[href], button, [tabindex]")).filter((element) => element.tabIndex >= 0);
      const skipLink = document.querySelector<HTMLElement>(".pf-skip");
      const tab = document.querySelector<HTMLElement>(".a11y-tab");
      return { skipIndex: skipLink ? all.indexOf(skipLink) : -1, tabIndex: tab ? all.indexOf(tab) : -1 };
    });
    expect(order.skipIndex).toBe(0);
    expect(order.tabIndex).toBeGreaterThan(order.skipIndex);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#platform-main$/);
  });
}

test("at 320 the Ore chip, Menu and Account all fit inside the top bar without overlapping", async ({ page }) => {
  await setup(page, 320, 700);
  await openProjects(page);
  const strip = page.locator(".pf-strip");
  const stripBox = await strip.boundingBox();
  expect(stripBox).not.toBeNull();
  const boxes = [];
  for (const locator of [strip.getByRole("button", { name: "Menu" }), strip.locator("a.pf-ore"), strip.getByRole("button", { name: "Account" })]) {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(stripBox!.x - 0.5);
    expect(box!.x + box!.width).toBeLessThanOrEqual(stripBox!.x + stripBox!.width + 0.5);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    boxes.push(box!);
  }
  // Left to right: Menu, Ore, Account, with no overlap between neighbours.
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index].x).toBeGreaterThanOrEqual(boxes[index - 1].x + boxes[index - 1].width - 0.5);
  }
  const chipOverflow = await strip.locator("a.pf-ore").evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(chipOverflow).toBeLessThanOrEqual(0);
});

test("the drawer opens, keeps Tab inside, closes on Escape and gives focus back to Menu", async ({ page }) => {
  await setup(page, 390, 800);
  await openProjects(page);
  const menu = page.getByRole("button", { name: "Menu" });
  await openDrawer(page);
  const side = page.getByRole("complementary", { name: "Site" });
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(side.getByRole("button", { name: "Close" })).toBeFocused();
  await expect(page.locator("#platform-main")).toHaveAttribute("inert", "");
  await expect(side.getByRole("navigation", { name: "Participant" }).getByRole("link")).toHaveText(["Projects", "Review Queue", "Explore", "Ideas", "Community", "Docs", "Shop", "Expeditions", "Orders", "Profile", "Ledger", "Settings"]);
  await expect(side.getByText("Build", { exact: true })).toBeHidden();
  await page.screenshot({ path: join(SHOTS, "shell-fu-390-drawer-dark.png") });
  // Tab never leaves the drawer, in either direction.
  for (let step = 0; step < 16; step += 1) {
    await page.keyboard.press("Tab");
    expect(await side.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  for (let step = 0; step < 16; step += 1) {
    await page.keyboard.press("Shift+Tab");
    expect(await side.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(side).toBeHidden();
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#platform-main")).not.toHaveAttribute("inert", "");
});

test("the drawer closes on Close, on a press on the scrim and when a section is chosen", async ({ page }) => {
  await setup(page, 390, 800);
  await openProjects(page);
  const side = page.getByRole("complementary", { name: "Site" });
  await openDrawer(page);
  await side.getByRole("button", { name: "Close" }).click();
  await expect(side).toBeHidden();
  await openDrawer(page);
  await page.mouse.click(385, 400);
  await expect(side).toBeHidden();
  await openDrawer(page);
  await side.getByRole("navigation", { name: "Participant" }).getByRole("link", { name: "Explore" }).click();
  await expect(page).toHaveURL(/\/dashboard\/explore$/);
  await expect(side).toBeHidden();
});

for (const width of WIDTHS) {
  test(`no horizontal scroll at ${width}px, drawer closed and open`, async ({ page }) => {
    await setup(page, width, 800);
    await openProjects(page);
    const overflow = () =>
      page.evaluate(() => {
        const extra = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          return element ? element.scrollWidth - element.clientWidth : 0;
        };
        return {
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          body: document.body.scrollWidth - document.documentElement.clientWidth,
          strip: extra(".pf-strip"),
          side: extra(".pf-side"),
          main: extra("#platform-main"),
        };
      });
    const closed = await overflow();
    expect(closed).toEqual({ page: 0, body: 0, strip: 0, side: 0, main: 0 });
    if (width < 900) {
      await openDrawer(page);
      const open = await overflow();
      expect(open.page).toBeLessThanOrEqual(0);
      expect(open.side).toBeLessThanOrEqual(0);
    }
    await page.screenshot({ path: join(SHOTS, `redesign-p1-width-${width}-dark.png`) });
  });
}

for (const scheme of ["dark", "light"] as const) {
  test(`axe finds no WCAG 2.2 AA violation on the sidebar at 1440, ${scheme}`, async ({ page }) => {
    await setup(page, 1440, 900, scheme);
    await openProjects(page);
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    if (scheme === "light") await page.screenshot({ path: join(SHOTS, "shell-fu-1440-light.png") });
  });

  test(`axe finds no WCAG 2.2 AA violation on Projects and the open account menu at 1440, ${scheme}`, async ({ page }) => {
    await setup(page, 1440, 900, scheme);
    await page.goto("/dashboard/projects");
    await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    let result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    const button = page.getByRole("button", { name: "Account" });
    await expect(async () => {
      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
    }).toPass({ timeout: 15000 });
    result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    if (scheme === "light") await page.screenshot({ path: join(SHOTS, "shell-fu-account-open-1440-light.png") });
  });

  test(`axe finds no WCAG 2.2 AA violation on the strip and the open drawer at 390, ${scheme}`, async ({ page }) => {
    await setup(page, 390, 800, scheme);
    await openProjects(page);
    let result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    await openDrawer(page);
    result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    if (scheme === "light") await page.screenshot({ path: join(SHOTS, "shell-fu-390-drawer-light.png") });
  });
}

test("Escape closes the one modal and focus goes back to the button that opened it", async ({ page }) => {
  await setup(page, 1440, 900);
  const { trigger, dialog } = await openModal(page);
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.screenshot({ path: join(SHOTS, "redesign-p1-modal-1440-dark.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});



test("Overview is gone: /dashboard redirects to Projects, which is the Stasis project grid", async ({ page, request }) => {
  const home = await request.get("/dashboard", { maxRedirects: 0 });
  expect(home.status()).toBe(308);
  await setup(page, 1440, 900);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Overview" })).toHaveCount(0);
  await expect(page.getByTestId("overview-ore")).toHaveCount(0);
  await expect(page.getByText("Next up")).toHaveCount(0);
  await expect(page.locator(".pf-track-list")).toHaveCount(0);
  await expect(page.getByTestId("new-project")).toBeVisible();
  await page.screenshot({ path: join(SHOTS, "shell-fu-projects-1440-dark.png"), fullPage: true });
});

test("old Expedition addresses answer a permanent redirect", async ({ request }) => {
  const expeditions = await request.get("/dashboard/expeditions?track=tools&status=locked", { maxRedirects: 0 });
  expect(expeditions.status()).toBe(308);
  expect(expeditions.headers()["location"]).toBe("/dashboard/shop/expeditions?track=tools&status=locked");
  const mission = await request.get("/dashboard/expeditions/bare-metal", { maxRedirects: 0 });
  expect(mission.status()).toBe(308);
  expect(mission.headers()["location"]).toBe("/dashboard/shop/expeditions/bare-metal");
});

test("Expeditions is its own sidebar link, under Build, and the current link on its pages", async ({ page }) => {
  await setup(page, 1440, 900);
  await page.goto("/dashboard/shop");
  await page.getByRole("main").getByRole("link", { name: "Expeditions" }).click();
  await expect(page).toHaveURL(/\/dashboard\/shop\/expeditions$/);
  await expect(page.getByRole("heading", { level: 1, name: "Expeditions" })).toBeAttached({ timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Participant" }).getByRole("link", { name: "Expeditions" })).toHaveAttribute("aria-current", "page");
});
