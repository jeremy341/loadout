import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The pull cord at the bottom of the footer opens a hidden level, -1404 M (.ulpi/design/pull-cord.md). The ring is pulled
// up like the Docs tab; it is also an ordinary button, so a click, Enter or Space does the same without dragging.
const ring = (page: Page) => page.getByRole("button", { name: /Dig deeper/ });
const panel = (page: Page) => page.locator("#sohle");
const pullOf = (page: Page) => ring(page).evaluate((element) => parseFloat(element.style.getPropertyValue("--pull") || "0"));

async function toRing(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await ring(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
}

async function pullUp(page: Page, distance: number, release = true) {
  const box = (await ring(page).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - distance, { steps: 8 });
  if (release) await page.mouse.up();
  return { x, y };
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await toRing(page);
});

test("the level is closed at first, with a ring that says what it does", async ({ page }) => {
  await expect(panel(page)).toBeHidden();
  await expect(ring(page)).toHaveAttribute("aria-expanded", "false");
  await expect(ring(page)).toHaveAttribute("aria-controls", "sohle");
});

test("a click, Enter and Space open and close the level, with no drag needed", async ({ page }) => {
  await ring(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(ring(page)).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("heading", { name: "You found the bottom." })).toBeFocused();
  await expect(panel(page)).toContainText("The only way back is up.");
  await ring(page).click();
  await expect(panel(page)).toBeHidden();
  await ring(page).focus();
  await page.keyboard.press("Enter");
  await expect(panel(page)).toBeVisible();
  await ring(page).focus();
  await page.keyboard.press("Space");
  await expect(panel(page)).toBeHidden();
});

test("Back to the surface scrolls to the top of the page", async ({ page }) => {
  await ring(page).click();
  await panel(page).getByRole("button", { name: "BACK TO THE SURFACE" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 8000 }).toBeLessThan(5);
});

test("a short pull snaps back and the level stays closed", async ({ page }) => {
  await pullUp(page, 50);
  await expect.poll(() => pullOf(page), { timeout: 3000 }).toBe(0);
  await page.waitForTimeout(600);
  await expect(panel(page)).toBeHidden();
});

test("a long pull snaps back first and then opens the level", async ({ page }) => {
  await pullUp(page, 160);
  await expect(panel(page)).toBeHidden(); // not yet
  await expect.poll(() => pullOf(page)).toBe(0); // the ring has snapped back
  await expect(panel(page)).toBeVisible(); // and then the level opens
  await expect(ring(page)).toHaveAttribute("aria-expanded", "true");
});

test("the ring stretches with resistance and its band thins", async ({ page }) => {
  const waist = () => ring(page).evaluate((element) => parseFloat(element.style.getPropertyValue("--waist") || "0"));
  const { x, y } = await pullUp(page, 40, false);
  await expect.poll(() => pullOf(page)).toBeGreaterThan(10);
  const early = await waist();
  await page.mouse.move(x, y - 400, { steps: 10 });
  await expect.poll(async () => (await pullOf(page)) > 100).toBe(true);
  expect(await pullOf(page)).toBeLessThanOrEqual(130);
  expect(await waist()).toBeLessThan(early);
  await page.mouse.up();
});

test("the cursor is the open hand over the ring and the fist while pulling", async ({ page }) => {
  const cursor = () => ring(page).evaluate((element) => getComputedStyle(element).cursor);
  expect(await cursor()).toMatch(/grab-dark(@2x)?\.png/);
  await pullUp(page, 30, false);
  await expect.poll(cursor).toMatch(/grabbing-dark(@2x)?\.png/);
  await page.mouse.up();
});

test("a pull on a touch screen opens the level", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/");
  await toRing(page);
  const cdp = await context.newCDPSession(page);
  const box = (await ring(page).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", dy: number) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y: y - dy }] });
  await touch("touchStart", 0);
  for (const dy of [10, 40, 80, 120, 160]) await touch("touchMove", dy);
  await touch("touchEnd", 0);
  await expect(panel(page)).toBeVisible();
  await context.close();
});

test("with reduced motion the ring does not stretch, the level has no animation, and a long pull still opens it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await pullUp(page, 50, false);
  await page.waitForTimeout(150);
  expect(await pullOf(page)).toBe(0);
  await page.mouse.up();
  await expect(panel(page)).toBeHidden();
  await pullUp(page, 160);
  await expect(panel(page)).toBeVisible();
  await expect(panel(page)).toHaveCSS("animation-name", "none");
});

test("the open level has no serious accessibility problems", async ({ page }) => {
  await ring(page).click();
  await expect(panel(page)).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});

test("the Docs tab and the cord stay separate: pulling the cord does not open the Docs", async ({ page }) => {
  await pullUp(page, 160);
  await expect(panel(page)).toBeVisible();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
});
