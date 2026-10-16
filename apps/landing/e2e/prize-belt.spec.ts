import { expect, test } from "@playwright/test";

// The planned prizes ride a slow belt (.ulpi/design/prize-belt.md): two copies of one list in a track that moves by half
// its width, hidden from assistive technology in the second copy, paused by hover or keyboard focus, and still with
// reduced motion.
const animationState = (page: import("@playwright/test").Page) =>
  page.locator(".pb-track").evaluate((track) => {
    const style = getComputedStyle(track);
    return { name: style.animationName, play: style.animationPlayState };
  });

test("the prizes list once for assistive technology and the belt moves by exactly one copy", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("#shop")).toContainText("Examples of what Ore could buy");
  await expect(page.locator(".pb-half")).toHaveCount(2);
  await expect(page.locator(".pb-half").nth(0)).not.toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".pb-half").nth(1)).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("list").filter({ has: page.getByText("Developer hardware") })).toHaveCount(1);
  await expect(page.locator(".pb-half").nth(0).locator("li")).toHaveCount(8);
  const loop = await page.locator(".pb-track").evaluate((track) => {
    const halves = [...track.querySelectorAll<HTMLElement>(".pb-half")];
    return { second: halves[1].offsetLeft, first: halves[0].getBoundingClientRect().width, track: track.getBoundingClientRect().width };
  });
  expect(loop.second).toBeCloseTo(loop.first, 1);
  expect(loop.track).toBeCloseTo(loop.first * 2, 1);
  expect(await animationState(page)).toEqual({ name: "pb-scroll", play: "running" });
});

test("hovering the belt or focusing it with the keyboard stops it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("label.pb-toggle, .pb-pause")).toHaveCount(0);
  await page.locator(".pb").scrollIntoViewIfNeeded();
  await page.locator(".pb-view").hover();
  await expect.poll(async () => (await animationState(page)).play).toBe("paused");
  await page.mouse.move(0, 0);
  await expect.poll(async () => (await animationState(page)).play).toBe("running");
  await page.locator(".pb-view").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator(".pb-view")).toBeFocused();
  await expect.poll(async () => (await animationState(page)).play).toBe("paused");
});

test("with reduced motion the belt is a still row with no copy", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect((await animationState(page)).name).toBe("none");
  await expect(page.locator(".pb-half").nth(1)).toBeHidden();
  await expect(page.locator(".pb-view")).toHaveCSS("overflow-x", "auto");
});
