import { expect, test } from "@playwright/test";

const animationState = (page: import("@playwright/test").Page) =>
  page.locator(".pb-track").evaluate((track) => {
    const style = getComputedStyle(track);
    return { name: style.animationName, play: style.animationPlayState };
  });

test("the prize strip shows one static list and can be scrolled by hand", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("#shop")).toContainText("Examples of what Ore could buy");
  await expect(page.locator(".pb-half")).toHaveCount(1);
  await expect(page.getByRole("list").filter({ has: page.getByText("Developer hardware") })).toHaveCount(1);
  await expect(page.locator(".pb-half li")).toHaveCount(8);
  expect(await animationState(page)).toEqual({ name: "none", play: "running" });

  const view = page.locator(".pb-view");
  await view.scrollIntoViewIfNeeded();
  await expect(view).toHaveCSS("overflow-x", "auto");
  await view.evaluate((element) => { element.scrollLeft = 200; });
  await expect.poll(() => view.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("the prize strip stays still when the system asks for reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect((await animationState(page)).name).toBe("none");
  await expect(page.locator(".pb-half")).toHaveCount(1);
  await expect(page.locator(".pb-view")).toHaveCSS("overflow-x", "auto");
});
