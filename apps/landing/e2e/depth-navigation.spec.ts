import { expect, test } from "@playwright/test";

test("desktop depth rail follows scroll and focuses the chosen section", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/");
  const rail = page.getByRole("navigation", { name: "Page depth" });
  await expect(rail).toBeVisible();
  const tracks = rail.getByRole("link", { name: /[−-]000.*Tracks/i });
  await tracks.click();
  await expect(page).toHaveURL(/#tracks$/);
  await expect(tracks).toHaveAttribute("aria-current", "location");
  await expect(page.locator("#tracks h2")).toBeFocused();
  await page.mouse.move(1000, 500);
  const faq = rail.getByRole("link", { name: /[−-]800.*FAQ/i });
  const scrollDistance = await page.locator("#faq").evaluate((section) => section.getBoundingClientRect().top - 200);
  await page.mouse.wheel(0, scrollDistance);
  await expect(faq).toHaveAttribute("aria-current", "location");
});

test("compact depth disclosure closes on Escape and stays bounded beside Docs at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /Page depth navigation/ });
  await expect(toggle).toBeVisible();
  await expect(page.locator(".docs-tab")).toBeVisible();
  const bounds = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: innerWidth,
    depth: document.querySelector<HTMLElement>(".depth-nav-toggle")?.getBoundingClientRect().right ?? 0,
    docs: document.querySelector<HTMLElement>(".docs-tab")?.getBoundingClientRect().left ?? 0,
  }));
  expect(bounds.document).toBeLessThanOrEqual(bounds.viewport);
  expect(bounds.depth).toBeLessThan(bounds.docs);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const list = page.locator("#depth-nav-list");
  await expect(list).toHaveAttribute("data-lenis-prevent", "true");
  const scroll = await list.evaluate((element) => ({ max: element.scrollHeight - element.clientHeight, bounds: element.getBoundingClientRect().toJSON() }));
  expect(scroll.max).toBeGreaterThan(0);
  const pageScroll = await page.evaluate(() => window.scrollY);
  await page.mouse.move(scroll.bounds.x + scroll.bounds.width / 2, scroll.bounds.y + scroll.bounds.height / 2);
  await page.mouse.wheel(0, 280);
  await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

test("deep links and browser history keep native section hashes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#custom-orders");
  await expect(page).toHaveURL(/#custom-orders$/);
  const toggle = page.getByRole("button", { name: /Page depth navigation/ });
  await toggle.click();
  const orders = page.getByRole("link", { name: /[−-]500.*Custom orders/i });
  await expect(orders).toHaveAttribute("aria-current", "location");
  await page.getByRole("link", { name: /[−-]800.*FAQ/i }).click();
  await expect(page).toHaveURL(/#faq$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAccessibleName(/FAQ.*−800/);
  await toggle.click();
  await expect(page.getByRole("link", { name: /[−-]800.*FAQ/i })).toHaveAttribute("aria-current", "location");
  // Let the smooth scroll to FAQ finish first, or it overrides the scroll position that going back restores.
  await page.waitForTimeout(1500);
  await page.goBack();
  await expect(page).toHaveURL(/#custom-orders$/);
  await page.waitForTimeout(1000);
  await toggle.click();
  await expect(orders).toHaveAttribute("aria-current", "location");
});

test("depth navigation only appears on the homepage and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Page depth" })).toBeVisible();
  if (!(await page.locator("#loadout-irl").count())) {
    await expect(page.getByRole("link", { name: /IRL/i })).toHaveCount(0);
  }
  await page.getByRole("link", { name: /[−-]900.*Team/i }).click();
  await expect(page).toHaveURL(/#behind-loadout$/);
  await expect(page.locator("#behind-loadout h2")).toBeFocused();
  await page.goto("/docs");
  await expect(page.locator(".depth-nav")).toHaveCount(0);
  await page.goto("/not-a-real-route");
  await expect(page.locator(".depth-nav")).toHaveCount(0);
});
