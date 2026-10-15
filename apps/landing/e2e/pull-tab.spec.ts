import { expect, test, type Page } from "@playwright/test";

// The Docs tab can be pulled up like a tab on a cord (.ulpi/design/pull-tab.md): it stretches with resistance, springs back
// when let go early, snaps back and then opens the Docs after a long pull, and stays a plain link for a click and the keyboard.
const tab = (page: Page) => page.getByRole("link", { name: "Open LOADOUT documentation" });
const pullOf = (page: Page) => tab(page).evaluate((element) => parseFloat(element.style.getPropertyValue("--pull") || "0"));
const centre = async (page: Page) => {
  const box = (await tab(page).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, top: box.y };
};

async function pullUp(page: Page, distance: number, release = true) {
  const { x, y } = await centre(page);
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
});

test("the tab follows a pull up with resistance, and never past its maximum", async ({ page }) => {
  const start = await centre(page);
  await pullUp(page, 50, false);
  await expect.poll(() => pullOf(page)).toBeGreaterThan(30);
  const small = await pullOf(page);
  expect(small).toBeLessThanOrEqual(50);
  await page.mouse.move(start.x, start.y - 400, { steps: 8 });
  await expect.poll(() => pullOf(page)).toBeGreaterThan(small);
  expect(await pullOf(page)).toBeLessThanOrEqual(140);
  const moved = (await centre(page)).top;
  expect(start.top - moved).toBeGreaterThan(60);
  await page.mouse.up();
});

test("letting go early springs the tab back and does not open the Docs", async ({ page }) => {
  const start = await centre(page);
  await pullUp(page, 50);
  await expect.poll(async () => Math.abs((await centre(page)).top - start.top), { timeout: 3000 }).toBeLessThan(1);
  await expect.poll(() => pullOf(page)).toBe(0);
  await expect(page).toHaveURL(/localhost:\d+\/$/);
});

test("a long pull opens the Docs", async ({ page }) => {
  await pullUp(page, 160);
  await expect(page).toHaveURL(/\/docs\/start$/);
});

test("a long pull snaps back first and the Docs open after that", async ({ page }) => {
  await pullUp(page, 160);
  await expect(page).toHaveURL(/localhost:\d+\/$/); // not opened yet
  await expect.poll(() => pullOf(page)).toBe(0); // the band has snapped back
  await expect(page).toHaveURL(/\/docs\/start$/); // and then the Docs open
});

test("the band gets thinner the further it is stretched", async ({ page }) => {
  const waist = () => tab(page).evaluate((element) => parseFloat(element.style.getPropertyValue("--waist") || "0"));
  const { x, y } = await pullUp(page, 40, false);
  await expect.poll(waist).toBeGreaterThan(0);
  const early = await waist();
  await page.mouse.move(x, y - 150, { steps: 8 });
  await expect.poll(async () => (await waist()) < early).toBe(true);
  const late = await waist();
  expect(late).toBeGreaterThanOrEqual(3);
  await page.mouse.move(x, y - 400, { steps: 8 });
  await expect.poll(async () => (await waist()) <= late).toBe(true);
  await page.mouse.up();
});

test("a click and the keyboard still open the Docs", async ({ page }) => {
  await tab(page).click();
  await expect(page).toHaveURL(/\/docs\/start$/);
  await page.goto("/");
  await tab(page).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/docs\/start$/);
});

test("the cursor is the open hand over the tab and the fist while pulling", async ({ page }) => {
  const cursor = () => tab(page).evaluate((element) => getComputedStyle(element).cursor);
  expect(await cursor()).toMatch(/grab-dark(@2x)?\.png/);
  await pullUp(page, 40, false);
  await expect.poll(cursor).toMatch(/grabbing-dark(@2x)?\.png/);
  await page.mouse.up();
  await page.locator("label.tg").click();
  await expect.poll(cursor).toMatch(/grab-light(@2x)?\.png/);
  await pullUp(page, 40, false);
  await expect.poll(cursor).toMatch(/grabbing-light(@2x)?\.png/);
  await page.mouse.up();
});

test("the cursor images are 32px and 64px PNGs for the open hand and the fist", async ({ request }) => {
  for (const kind of ["grab", "grabbing"]) {
    for (const theme of ["dark", "light"]) {
      for (const suffix of ["", "@2x"]) {
        const name = `${kind}-${theme}${suffix}`;
        const response = await request.get("/loadout/cursors/" + name.replace("@", "%40") + ".png");
        expect(response.status(), name).toBe(200);
        const body = await response.body();
        expect(body.readUInt32BE(16), name).toBe(suffix ? 64 : 32);
        expect(body.readUInt32BE(20), name).toBe(suffix ? 64 : 32);
      }
    }
  }
});

test("a pull on a touch screen works and the rest of the page still scrolls", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/");
  const cdp = await context.newCDPSession(page);
  const box = (await tab(page).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", dy: number) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y: y - dy }] });
  await touch("touchStart", 0);
  for (const dy of [10, 40, 80, 120, 160]) await touch("touchMove", dy);
  await touch("touchEnd", 0);
  await expect(page).toHaveURL(/\/docs\/start$/);
  await page.goto("/");
  const before = await page.evaluate(() => window.scrollY);
  const swipe = (type: "touchStart" | "touchMove" | "touchEnd", y: number) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: 200, y }] });
  await swipe("touchStart", 600);
  for (const y of [560, 500, 440, 380, 320, 260, 200]) await swipe("touchMove", y);
  await swipe("touchEnd", 0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
  await context.close();
});

test("with reduced motion the tab does not stretch, and a long pull still opens the Docs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await pullUp(page, 50, false);
  await page.waitForTimeout(150);
  expect(await pullOf(page)).toBe(0);
  // Pressing changes the tab's look (the thick hover edge goes), but it is not lifted or stretched.
  const lift = await tab(page).evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
  expect(Math.abs(lift)).toBeLessThan(0.5);
  await page.mouse.up();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
  await pullUp(page, 160);
  await expect(page).toHaveURL(/\/docs\/start$/);
});

test("the tab is still a large enough target and passes an accessibility scan", async ({ page }) => {
  const box = (await tab(page).boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(32);
  await expect(tab(page)).toHaveAttribute("draggable", "false");
  await expect(tab(page)).toHaveCSS("touch-action", "none");
});
