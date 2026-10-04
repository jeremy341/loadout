import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("root page explains the canonical fields and exposes working section anchors", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/LOADOUT/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("REAL PROJECTS.REAL REWARDS.");
  await expect(page.locator(".track-card h3")).toHaveText(["Tools", "Systems", "Compute", "Hardware"]);
  await expect(page.locator("#research")).toContainText("Research Mode");
  await expect(page.locator("#research")).toContainText("modifier");
  const anchors = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  for (const anchor of new Set(anchors)) {
    expect(anchor).not.toBe("#");
    await expect(page.locator(anchor!)).toHaveCount(1);
  }
  await expect(page.locator('a[href*="pixl"]')).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/Pixl|RSVP NOW|up to \d+%/i);
});

test("unset registration and production metadata use the local preview state", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('a').filter({ hasText: /^Login$|^Join LOADOUT$/ })).toHaveCount(0);
  expect((await request.get("/robots.txt")).status()).toBe(200);
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
  expect((await request.get("/api/rsvp")).status()).toBe(404);
  expect((await request.get("/en")).status()).toBe(404);
});

for (const [width, height] of [[1440, 900], [390, 844]]) {
  test(`hero fills the first screen at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const hero = await page.locator(".hero").boundingBox();
    const about = await page.locator("#about").boundingBox();
    const actions = await page.locator(".hero-actions").boundingBox();
    expect(hero!.height).toBeGreaterThanOrEqual(height);
    expect(about!.y).toBeGreaterThanOrEqual(height);
    expect(actions!.y + actions!.height).toBeLessThan(height);
  });
}

for (const width of [320, 390, 768, 1440]) {
  test(`page reflows without horizontal scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.viewport);
    await expect(page.getByRole("heading", { name: "Quick answers", exact: true })).toBeVisible();
  });
}

test("FAQ answers work with a keyboard and expose their expanded state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const question = page.getByRole("button", { name: "How do tracks work?" });
  await question.focus();
  await question.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator(`#${await question.getAttribute("aria-controls")}`);
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Track XP");
  await question.press("Space");
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toHaveAttribute("inert", "");
});

test("mobile navigation closes after an anchor action and on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const selector of [".site-nav .brand", ".nav-actions .button", ".mobile-menu-button", ".track-arrow", ".footer-column a"]) {
    const target = await page.locator(selector).first().boundingBox();
    expect(target!.height).toBeGreaterThanOrEqual(44);
    expect(target!.width).toBeGreaterThanOrEqual(44);
  }
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.locator("#mobile-navigation").getByRole("link", { name: "Tracks", exact: true }).click();
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Build across four tracks", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).focus();
  await page.getByRole("button", { name: "Open navigation" }).press("Enter");
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-navigation")).toHaveCount(0);
});

test("navigation follows scroll direction and reduced motion keeps content static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const interactiveControl = page.locator(".faq-question").first();
  await interactiveControl.click();
  await expect(interactiveControl).toHaveAttribute("aria-expanded", "true");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator(".nav-wrap")).not.toHaveClass(/nav-hidden/);
  await page.evaluate(() => window.scrollTo(0, 700));
  await expect(page.locator(".nav-wrap")).toHaveClass(/nav-hidden/);
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect(page.locator(".nav-wrap")).not.toHaveClass(/nav-hidden/);
  const cloudAnimation = await page.locator(".cloud-art").first().evaluate((cloud) => getComputedStyle(cloud).animationName);
  expect(cloudAnimation).toBe("none");
  const cloudTransform = await page.locator(".pixel-cloud").first().evaluate((cloud) => getComputedStyle(cloud).transform);
  expect(cloudTransform).toBe("none");
  const reveals = await page.locator(".reveal").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).opacity));
  expect(reveals.every((opacity) => opacity === "1")).toBe(true);
});

test("larger clouds respond to scrolling with parallax", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cloud = page.locator(".pixel-cloud").first();
  await page.waitForTimeout(700);
  const before = await cloud.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
  expect((await cloud.boundingBox())!.width).toBeGreaterThan(290);
  await page.mouse.wheel(0, 450);
  await expect.poll(async () => Math.abs(await cloud.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42) - before)).toBeGreaterThan(8);
});

test("clouds hydrate consistently with normal and reduced motion", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|server rendered|didn.t match/i.test(message.text())) hydrationErrors.push(message.text());
  });
  page.on("pageerror", (error) => hydrationErrors.push(error.message));
  for (const preference of ["reduce", "no-preference"] as const) {
    await page.emulateMedia({ reducedMotion: preference });
    await page.goto("/");
    const question = page.locator(".faq-question").first();
    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    expect(hydrationErrors).toEqual([]);
  }
});

test("normal motion keeps smooth anchor scrolling and card hover feedback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator(".hero-actions a").first().click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  const card = page.locator(".track-card").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await page.waitForTimeout(650);
  const before = await card.boundingBox();
  await card.hover();
  await page.waitForTimeout(300);
  const after = await card.boundingBox();
  expect(after!.y).toBeLessThan(before!.y - 3);
});

test("desktop and mobile have no serious or critical automated accessibility findings", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  }
});
