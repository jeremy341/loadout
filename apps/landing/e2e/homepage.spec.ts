import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const testBaseURL = process.env.LOADOUT_TEST_BASE_URL ?? `http://localhost:${process.env.LOADOUT_TEST_PORT ?? "3001"}`;

test("root page explains the canonical fields and exposes working section anchors", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/LOADOUT/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Build your own technical stack.");
  await expect(page.locator(".track-card h3")).toHaveText(["Tools", "Systems", "Compute", "Hardware"]);
  await expect(page.locator("#research")).toContainText("Research Mode");
  await expect(page.locator("#research")).toContainText("Add it to any track");
  await expect(page.locator("#research")).toContainText("not a fifth track");
  const anchors = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  for (const anchor of new Set(anchors)) {
    expect(anchor).not.toBe("#");
    await expect(page.locator(anchor!)).toHaveCount(1);
  }
  await expect(page.locator('main a[href*="pixl"]')).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/Pixl|up to \d+%/i);
});

test("Community Eras explain shared progression with working anchors", async ({ page }) => {
  await page.goto("/");
  const eras = page.locator("#eras");
  await expect(eras.getByRole("heading", { name: "Build the next Era together." })).toBeVisible();
  await expect(eras).not.toContainText("Planned community concept");
  await expect(eras).toContainText("A shared technical theme advanced by approved projects across the four tracks.");
  await expect(eras.locator("ol")).toHaveAccessibleName("How a Community Era works");
  await expect(eras.locator("ol li span:last-child")).toHaveText(["Approved projects", "Shared Era Points", "Next technical theme"]);
  await expect(eras).toContainText("+10%");
  await expect(eras).toContainText("Era Points are separate from Bolts and Track XP.");
  await expect(eras).toContainText("Planned rule");
  await expect(eras).not.toContainText(/Steam|Electrification|Computing|Networks|Acceleration|14 days|weekly reset|target|Season/i);
  for (const selector of ["#process", "#progression", "#loadout-irl"]) {
    await expect(page.locator(selector)).not.toContainText(/Era objectives|Era Points|Era changes/i);
  }
  const eraFaq = page.locator(".faq-item").filter({ hasText: "What are Community Eras?" });
  const eraQuestion = eraFaq.getByRole("button", { name: "What are Community Eras?" });
  await eraQuestion.click();
  await expect(eraQuestion).toHaveAttribute("aria-expanded", "true");
  await expect(eraFaq).toContainText("An Era is a shared technical theme that approved projects help the community move forward.");
  await expect(eraFaq).toContainText("Era Points");
  await expect(eraFaq).not.toContainText(/14 days|weekly reset|target|\+10%/i);
  await page.getByRole("link", { name: "Community Eras", exact: true }).first().click();
  await expect(page).toHaveURL(/#eras$/);
});

test("Custom Orders keep the request path without showing the planned tier card", async ({ page }) => {
  await page.goto("/");
  const customOrders = page.locator("#custom-orders");
  await expect(customOrders).toContainText("relevant track tier");
  await expect(customOrders).toContainText("Custom Order requests are not open yet");
  await expect(customOrders).not.toContainText(/Planned request tiers|Bare Metal|LV\.4|LV\.8|LV\.12|LV\.15/);
});

test("Progress & Prizes begins with Track XP without a duplicate section intro", async ({ page }) => {
  await page.goto("/");
  const progression = page.locator("#progression");
  await expect(progression.getByRole("heading", { level: 2, name: "Track XP and levels" })).toBeVisible();
  await expect(progression).not.toContainText("Progress & prizes");
  await expect(progression).not.toContainText("Follow lifetime Track XP and levels");
  await expect(progression).toContainText("Field Requisition");
  await expect(progression).toContainText("Planned prizes");
  await expect(progression).toContainText("Custom Orders");
});

test("the LOADOUT Docs tab opens the field manual and its section links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open LOADOUT documentation" }).click();
  await expect(page).toHaveURL(/\/docs\/start$/);
  await expect(page.getByRole("heading", { level: 1, name: "What is LOADOUT?" })).toBeVisible();
  const docsNav = page.getByRole("navigation", { name: "Documentation sections" });
  await expect(docsNav).toBeVisible();
  await docsNav.getByRole("link", { name: "Bolts, XP & levels" }).click();
  await expect(page).toHaveURL(/\/docs\/progress$/);
  await expect(page.locator("h1", { hasText: "Bolts, XP & levels" })).toBeInViewport();
  await page.getByRole("link", { name: "BACK TO LOADOUT" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the LOADOUT Docs page reflows without horizontal scrolling", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs");
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.viewport);
  }
});

test("the LOADOUT Docs tab has a direct keyboard and pointer route", async ({ page }) => {
  await page.goto("/");
  const tab = page.getByRole("link", { name: "Open LOADOUT documentation" });
  await expect(tab).toBeVisible();
  await tab.focus();
  await expect(tab).toBeFocused();
  await tab.click();
  await expect(page).toHaveURL(/\/docs\/start$/);
});

test("confirmed RSVP preserves the local preview metadata state", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: /RSVP now/i })).toHaveCount(2);
  for (const link of await page.getByRole("link", { name: /RSVP now/i }).all()) await expect(link).toHaveAttribute("href", "https://rsvp.soon.it/loadout");
  await expect(page.getByRole("link", { name: /^Login$/ })).toHaveCount(0);
  expect((await request.get("/robots.txt")).status()).toBe(200);
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
  expect((await request.get("/api/rsvp")).status()).toBe(404);
  expect((await request.get("/en")).status()).toBe(404);
});

for (const [width, height] of [[1280, 800], [1440, 900], [1659, 948], [1920, 1080], [390, 844]]) {
  test(`hero fills the first screen at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const hero = await page.locator(".hero").boundingBox();
    const tracks = await page.locator("#tracks").boundingBox();
    const actions = await page.locator(".hero-actions").boundingBox();
    expect(hero!.height).toBeGreaterThanOrEqual(height);
    expect(tracks!.y).toBeGreaterThanOrEqual(height);
    expect(actions!.y + actions!.height).toBeLessThan(height);
    await page.evaluate(() => document.fonts.ready);
    const titleLines = await page.locator(".hero h1 span").evaluateAll((lines) => lines.map((line) => ({ height: line.getBoundingClientRect().height, lineHeight: Number.parseFloat(getComputedStyle(line).lineHeight), width: line.clientWidth, contentWidth: line.scrollWidth })));
    for (const line of titleLines) {
      expect(line.height).toBeLessThanOrEqual(line.lineHeight + 2);
      expect(line.contentWidth).toBeLessThanOrEqual(line.width + 1);
    }
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
  const question = page.getByRole("button", { name: "Can my project use more than one track?" });
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
  for (const selector of [".site-nav .brand", ".nav-actions .button", ".mobile-menu-button", ".docs-tab", ".footer-column a"]) {
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
  const before = await cloud.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  expect((await cloud.boundingBox())!.width).toBeGreaterThan(360);
  expect(await cloud.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(0);
  await page.mouse.wheel(0, 450);
  await expect.poll(async () => Math.abs(await cloud.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41) - before)).toBeGreaterThan(8);
  expect(await cloud.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(0);
});

test("section anchors preserve normal browser history", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: "Tracks", exact: true }).first().click();
  await expect(page).toHaveURL(/#tracks$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
});

test("essential content and FAQ remain available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(testBaseURL);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".faq-noscript")).toContainText("Hackatime");
  await expect(page.locator(".faq-noscript")).toBeVisible();
  await expect(page.getByText("Continue scrolling", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue scrolling/i })).toHaveCount(0);
  await context.close();
});

test("short landscape layout keeps hero actions and scroll cue separate", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const facts = await page.locator(".hero-facts").boundingBox();
  const cue = await page.locator(".scroll-cue").boundingBox();
  const hero = await page.locator(".hero").boundingBox();
  expect(cue!.y).toBeGreaterThan(facts!.y + facts!.height);
  expect(cue!.y + cue!.height).toBeLessThanOrEqual(hero!.height);
});

test("keyboard scrolling reaches the next content naturally", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
});

test("touch scrolling stays native and unobstructed", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(testBaseURL);
  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 650 }] });
  for (let y = 610; y >= 250; y -= 40) {
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y }] });
    await page.waitForTimeout(30);
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await context.close();
});

test("continue scrolling remains a non-interactive visual cue", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cue = page.locator(".scroll-cue");
  await expect(cue).toContainText("Continue scrolling");
  await expect(cue).toHaveCSS("pointer-events", "none");
  await expect(page.getByRole("link", { name: /Continue scrolling/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Continue scrolling/i })).toHaveCount(0);
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
  await page.locator(".hero-actions").getByRole("link", { name: "Explore tracks", exact: true }).click();
  await expect(page).toHaveURL(/#tracks$/);
  await expect(page.getByRole("heading", { name: "Build across four tracks", exact: true })).toBeInViewport();
  const card = page.locator(".track-card").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await page.waitForTimeout(650);
  const beforeY = await card.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
  await card.hover();
  await page.waitForTimeout(300);
  const afterY = await card.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
  expect(afterY).toBeLessThan(beforeY - 1);
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
