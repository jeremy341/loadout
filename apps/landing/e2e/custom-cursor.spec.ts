import { expect, test } from "@playwright/test";

// The homepage cursor is a pixel arrow with a pointing hand for links (.ulpi/design/custom-cursor.md): blue in the dark
// theme and yellow in the light theme, fine pointers only, and the system cursor on the docs and the 404 page.
const cursorOf = (page: import("@playwright/test").Page, selector: string) =>
  page.locator(selector).first().evaluate((element) => getComputedStyle(element).cursor);

test("the homepage shows the pixel arrow, blue in the dark theme and yellow in the light theme", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  expect(await cursorOf(page, ".home")).toMatch(/arrow-dark(@2x)?\.png/);
  await page.locator("label.tg").click();
  await expect.poll(() => cursorOf(page, ".home")).toMatch(/arrow-light(@2x)?\.png/);
});

test("links, buttons and labels get the pointing hand in the matching theme", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const selector of [".home a[href]", ".home label.tg", ".home .fq2-q"]) {
    expect(await cursorOf(page, selector), selector).toMatch(/hand-dark(@2x)?\.png/);
  }
  await page.locator("label.tg").click();
  await expect.poll(() => cursorOf(page, ".home a[href]")).toMatch(/hand-light(@2x)?\.png/);
});

test("the cursor images are 32px and 64px pixel PNGs, in both themes", async ({ page, request }) => {
  await page.goto("/");
  for (const kind of ["arrow", "hand"]) {
    for (const theme of ["dark", "light"]) {
      for (const suffix of ["", "@2x"]) {
        const name = `${kind}-${theme}${suffix}`;
        const response = await request.get("/loadout/cursors/" + name.replace("@", "%40") + ".png");
        expect(response.status(), name).toBe(200);
        const body = await response.body();
        const size = body.readUInt32BE(16);
        expect(body.readUInt32BE(20), name).toBe(size);
        expect(size, name).toBe(suffix ? 64 : 32);
      }
    }
  }
});

test("the docs and the 404 page keep the system cursor", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/start");
  expect(await cursorOf(page, ".docs")).not.toMatch(/arrow-|hand-/);
  await page.goto("/definitely-not-a-page");
  expect(await cursorOf(page, "body")).not.toMatch(/arrow-|hand-/);
});

test("a touch screen gets no custom cursor", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/");
  expect(await cursorOf(page, ".home")).not.toMatch(/arrow-|hand-/);
  expect(await cursorOf(page, ".home a[href]")).not.toMatch(/arrow-|hand-/);
  await context.close();
});
