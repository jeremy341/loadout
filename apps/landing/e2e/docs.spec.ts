import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the docs tab opens the participant guide and the sidebar switches topics", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open LOADOUT documentation" }).click();
  await expect(page).toHaveURL(/\/docs\/start$/);
  await expect(page.getByRole("heading", { level: 1, name: "What is LOADOUT?" })).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Documentation sections" });
  await expect(navigation.getByRole("link", { name: "What is LOADOUT?", exact: true })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "What can I build?", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/projects$/);
  await expect(page.getByRole("heading", { level: 1, name: "What can I build?" })).toBeVisible();
  await expect(page.locator(".docs-main")).toContainText("The four tracks");
  await expect(navigation).not.toContainText("Source library");
  await expect(navigation).not.toContainText("Repo workflow");
});

test("long docs scroll inside their panes instead of growing the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto("/docs/start");
  const desktop = await page.evaluate(() => ({
    viewport: innerHeight,
    page: document.documentElement.scrollHeight,
    mainClient: document.querySelector<HTMLElement>(".docs-main")!.clientHeight,
    mainScroll: document.querySelector<HTMLElement>(".docs-main")!.scrollHeight,
  }));
  expect(desktop.page).toBeLessThanOrEqual(desktop.viewport + 1);
  expect(desktop.mainScroll).toBeGreaterThan(desktop.mainClient);
  const main = page.locator(".docs-main");
  const bounds = await main.boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => main.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await main.focus();
  const beforeKeyScroll = await main.evaluate((node) => node.scrollTop);
  await page.keyboard.press("PageDown");
  await expect.poll(() => main.evaluate((node) => node.scrollTop)).toBeGreaterThan(beforeKeyScroll);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("mobile keeps the topic list and guide in bounded internal panes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/prizes");
  const dimensions = await page.evaluate(() => ({
    viewport: innerHeight,
    page: document.documentElement.scrollHeight,
    mainClient: document.querySelector<HTMLElement>(".docs-main")!.clientHeight,
    mainScroll: document.querySelector<HTMLElement>(".docs-main")!.scrollHeight,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.mainScroll).toBeGreaterThan(dimensions.mainClient);
  const toggle = page.getByRole("button", { name: "Browse topics" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const navigation = page.locator(".docs-nav");
  const navSizes = await navigation.evaluate((node) => ({ height: node.clientHeight, scroll: node.scrollHeight }));
  expect(navSizes.scroll).toBeGreaterThan(navSizes.height);
  await navigation.evaluate((node) => node.scrollTo(0, node.scrollHeight));
  await expect.poll(() => navigation.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const main = page.locator(".docs-main");
  await main.focus();
  await page.keyboard.press("PageDown");
  await expect.poll(() => main.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("internal routes are participant topics and meet automated contrast checks", async ({ page }) => {
  for (const route of ["/docs/start", "/docs/review", "/docs/prizes", "/docs/eras"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  }
  for (const route of ["/docs/contributing", "/docs/architecture", "/docs/references", "/docs/library", "/docs/source-plans-plan-02-loadout-economy-and-rewards"]) {
    expect((await page.request.get(route)).status()).toBe(404);
  }
});
