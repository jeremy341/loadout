import { expect, test } from "@playwright/test";

// The homepage gets darker the deeper you scroll, down to the near black of the 404 page
// (.ulpi/design/depth-darkness.md). The darkness is one fixed layer behind the content whose opacity follows the
// scroll position through a CSS scroll-driven animation. Chromium supports it, so the tests read the animated value.
const darkness = (page: import("@playwright/test").Page) =>
  page.locator(".depth-dark").evaluate((layer) => Number(getComputedStyle(layer).opacity));

async function scrollToShare(page: import("@playwright/test").Page, share: number) {
  await page.evaluate((fraction) => {
    const root = document.documentElement;
    window.scrollTo(0, (root.scrollHeight - window.innerHeight) * fraction);
  }, share);
}

test("the page gets darker the deeper you scroll, and is untouched at the top", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect.poll(() => darkness(page)).toBeLessThan(0.02);
  await scrollToShare(page, 0.5);
  await expect.poll(() => darkness(page)).toBeGreaterThan(0.35);
  const middle = await darkness(page);
  expect(middle).toBeLessThan(0.65);
  await scrollToShare(page, 1);
  await expect.poll(() => darkness(page)).toBeGreaterThan(0.95);
  await scrollToShare(page, 0);
  await expect.poll(() => darkness(page)).toBeLessThan(0.02);
});

test("the darkness sits behind the content, ignores the pointer and is hidden from assistive technology", async ({ page }) => {
  await page.goto("/");
  const layer = page.locator(".depth-dark");
  await expect(layer).toHaveAttribute("aria-hidden", "true");
  await expect(layer).toHaveCSS("pointer-events", "none");
  await expect(layer).toHaveCSS("position", "fixed");
  const layers = await page.evaluate(() => ({
    shade: Number(getComputedStyle(document.querySelector(".depth-dark")!).zIndex),
    content: Number(getComputedStyle(document.querySelector(".home .in")!).zIndex),
  }));
  expect(layers.shade).toBeGreaterThan(0);
  expect(layers.shade).toBeLessThan(layers.content);
});

test("the shade is near black in the dark theme and a soft rim in the light theme", async ({ page }) => {
  await page.goto("/");
  const shade = () => page.locator(".depth-dark").evaluate((layer) => getComputedStyle(layer).backgroundImage);
  const dark = await shade();
  expect(dark).toContain("radial-gradient");
  expect(dark).toMatch(/rgba\(6, 8, 9/);
  await page.locator("label.tg").click();
  await expect.poll(shade).toMatch(/rgba\(26, 23, 20/);
});

test("the 404 and the docs keep their own look: no depth shade", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  await expect(page.locator(".depth-dark")).toHaveCount(0);
  await page.goto("/docs");
  await expect(page.locator(".depth-dark")).toHaveCount(0);
});
