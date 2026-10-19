import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("docs pages render the approved Markdown guide and stable heading links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/projects");
  await expect(page.getByRole("heading", { level: 1, name: "What can I build?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The four tracks" })).toBeVisible();
  const toc = page.getByRole("navigation", { name: "On this page" });
  const trackLink = toc.getByRole("link", { name: "The four tracks" });
  await expect(trackLink).toHaveAttribute("href", "#tracks");
  await trackLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#tracks$/);
  await expect(trackLink).toHaveAttribute("aria-current", "location");
  await expect(page.getByRole("heading", { name: "The four tracks" })).toBeFocused();
  await page.goBack();
  await expect(page).not.toHaveURL(/#tracks$/);
  await expect.poll(() => page.locator(".docs-main").evaluate((node) => node.scrollTop)).toBe(0);
  await page.goForward();
  await expect(page).toHaveURL(/#tracks$/);
  await expect(page.locator(".docs-main")).toContainText("Tools");
});

test("directory remembers groups and keeps the active group open", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/start");
  const nav = page.getByRole("navigation", { name: "Documentation sections" });
  const groups = nav.locator("details.docs-group");
  await expect(groups.nth(0)).toHaveAttribute("open", "");
  await expect(groups.nth(1)).toHaveAttribute("open", "");
  await groups.nth(0).locator("summary").click();
  await expect(groups.nth(0)).toHaveAttribute("open", "");
  await groups.nth(1).locator("summary").click();
  await expect(groups.nth(1)).not.toHaveAttribute("open", "");
  await page.reload();
  await expect(groups.nth(1)).not.toHaveAttribute("open", "");
  await nav.getByRole("link", { name: "What can I build?", exact: true }).click();
  await expect(groups.nth(0)).toHaveAttribute("open", "");
});

test("search loads lazily, links to real headings, and supports keyboard navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const indexRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/docs/search-index.json")) indexRequests.push(request.url());
  });
  await page.goto("/docs/start");
  await expect.poll(() => indexRequests.length).toBe(0);
  const input = page.getByRole("searchbox", { name: "Search documentation" });
  await input.focus();
  await expect.poll(() => indexRequests.length).toBe(1);
  await input.fill("track xp");
  const result = page.locator("#docs-search-result-0");
  await expect(result).toBeVisible();
  await expect(result.locator("strong")).toHaveCount(1);
  await expect(result.locator("span, small")).toHaveCount(0);
  await expect(result).toHaveAttribute("href", /\/docs\//);
  await input.press("ArrowDown");
  await expect(result).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(input).toBeFocused();
  await input.press("Escape");
  await expect(input).toHaveValue("");
  await expect(page.locator(".docs-search-results")).toHaveCount(0);

  await input.fill("track xp");
  await expect(result).toBeVisible();
  const href = await result.getAttribute("href");
  const expectedUrl = new URL(href!, page.url()).href;
  await input.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(expectedUrl);
  await expect(page.getByRole("searchbox", { name: "Search documentation" })).toHaveValue("");
});

test("the default mobile Docs top bar stays compact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/eligibility");
  await expect(page.locator(".docs-nav")).toHaveCSS("padding-bottom", "10px");
  const topBarHeight = await page.locator(".docs-nav").evaluate((element) => element.getBoundingClientRect().height);
  expect(topBarHeight).toBeLessThan(80);
  const toolbar = await page.locator(".docs-nav").boundingBox();
  const article = await page.locator(".docs-main").boundingBox();
  expect(article!.y).toBeGreaterThanOrEqual(toolbar!.y + toolbar!.height);
  await expect(page.locator(".doc-header .eyebrow")).toBeInViewport();
  await expect(page.getByRole("link", { name: "Open accessibility settings" })).toBeVisible();
});

test("Docs articles credit the LOADOUT team", async ({ page }) => {
  await page.goto("/docs/start");
  await expect(page.getByText("Built with Love by the LOADOUT team", { exact: false })).toBeVisible();
});

test("search errors offer retry without exposing internal documents", async ({ page }) => {
  let attempts = 0;
  await page.route("**/docs/search-index.json", async (route) => {
    attempts++;
    if (attempts === 1) await route.abort();
    else await route.continue();
  });
  await page.goto("/docs/start");
  const input = page.getByRole("searchbox", { name: "Search documentation" });
  await input.focus();
  await expect(page.getByRole("button", { name: "Retry search" })).toBeVisible();
  await page.getByRole("button", { name: "Retry search" }).click();
  await expect.poll(() => attempts).toBe(2);
  await input.fill("qzxvplmoknijbuhvygctfxr");
  await expect(page.locator(".docs-search-feedback")).toHaveText("No matching guides.");
  await expect(page.locator(".docs-search-results")).toHaveCount(0);
});

test("clearing search while the lazy index is loading discards stale results", async ({ page }) => {
  const response = await page.request.get("/docs/search-index.json");
  const indexBody = await response.body();
  let releaseRequest!: () => void;
  const requestGate = new Promise<void>((resolve) => { releaseRequest = resolve; });
  let completed = false;
  await page.route("**/docs/search-index.json", async (route) => {
    await requestGate;
    await route.fulfill({ status: 200, contentType: "application/json", body: indexBody });
    completed = true;
  });
  await page.goto("/docs/start");
  const input = page.getByRole("searchbox", { name: "Search documentation" });
  await input.focus();
  await input.fill("track xp");
  await expect.poll(() => completed).toBe(false);
  await input.press("Escape");
  releaseRequest();
  await expect.poll(() => completed).toBe(true);
  await expect(input).toHaveValue("");
  await expect(page.locator(".docs-search-results")).toHaveCount(0);
  await expect(page.locator(".docs-search-feedback")).toHaveText("Search public guides by topic or heading.");
});

test("docs use bounded internal panes on desktop and mobile", async ({ page }, testInfo) => {
  for (const viewport of [{ width: 1920, height: 900 }, { width: 1440, height: 700 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/docs/projects");
    const dimensions = await page.evaluate(() => ({
      viewport: innerHeight,
      page: document.documentElement.scrollHeight,
      mainClient: document.querySelector<HTMLElement>(".docs-main")!.clientHeight,
      mainScroll: document.querySelector<HTMLElement>(".docs-main")!.scrollHeight,
      scrollbar: getComputedStyle(document.querySelector<HTMLElement>(".docs-main")!).scrollbarWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.mainScroll).toBeGreaterThan(dimensions.mainClient);
    expect(dimensions.scrollbar).toBe("none");
    await page.screenshot({ path: testInfo.outputPath(`docs-${viewport.width}.png`) });
    await page.locator(".docs-main").evaluate((node) => node.scrollBy(0, 400));
    await expect.poll(() => page.locator(".docs-main").evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }

  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto("/docs/projects");
  const zoomDimensions = await page.evaluate(() => ({
    bodyWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    bodyHeight: document.documentElement.scrollHeight,
    viewportHeight: innerHeight,
  }));
  expect(zoomDimensions.bodyWidth).toBeLessThanOrEqual(zoomDimensions.viewportWidth + 1);
  expect(zoomDimensions.bodyHeight).toBeLessThanOrEqual(zoomDimensions.viewportHeight + 1);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/projects#tracks");
  await expect(page.getByRole("heading", { name: "The four tracks" })).toBeVisible();
  await expect(page.locator(".docs-main")).toHaveCSS("scroll-behavior", "auto");
  const main = page.locator(".docs-main");
  await main.focus();
  const initial = await main.evaluate((node) => node.scrollTop);
  await page.keyboard.press("PageDown");
  await expect.poll(() => main.evaluate((node) => node.scrollTop)).toBeGreaterThan(initial);
  const afterPageDown = await main.evaluate((node) => node.scrollTop);
  await page.keyboard.press("Space");
  await expect.poll(() => main.evaluate((node) => node.scrollTop)).toBeGreaterThan(afterPageDown);
});

test("on phones the guide stays in place and Guides opens the directory as a drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/projects");
  const heading = page.getByRole("heading", { level: 1, name: "What can I build?" });
  await expect(heading).toBeInViewport();
  const headingTop = (await heading.boundingBox())!.y;
  const toggle = page.getByRole("button", { name: "Guides", exact: true });
  const search = page.getByRole("searchbox", { name: "Search documentation" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(search).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(search).toBeVisible();
  await expect(page.getByRole("button", { name: "Close guides" })).toBeFocused();
  expect((await heading.boundingBox())!.y).toBe(headingTop);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});

test("the phone drawer closes with its X, a tap on the scrim or Escape, and returns focus to Guides", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/projects");
  const toggle = page.getByRole("button", { name: "Guides", exact: true });
  const search = page.getByRole("searchbox", { name: "Search documentation" });
  await toggle.click();
  await page.getByRole("button", { name: "Close guides" }).click();
  await expect(search).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator(".docs-scrim").click({ position: { x: 365, y: 400 } });
  await expect(search).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(search).toBeHidden();
  await expect(toggle).toBeFocused();
});

test("the phone drawer's back link goes to the homepage", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/projects");
  await page.getByRole("button", { name: "Guides", exact: true }).click();
  await page.getByRole("link", { name: /BACK TO LOADOUT/ }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("choosing a guide in the phone drawer opens it and closes the drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/projects");
  await page.getByRole("button", { name: "Guides", exact: true }).click();
  await page.getByRole("navigation", { name: "Documentation sections" }).getByRole("link", { name: "Project review", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/review$/);
  await expect(page.getByRole("searchbox", { name: "Search documentation" })).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Project review" })).toBeInViewport();
});

test("the phone top bar fits inside the screen at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/docs/projects");
  const theme = await page.locator(".docs-theme").boundingBox();
  const toggle = await page.getByRole("button", { name: "Guides", exact: true }).boundingBox();
  const brand = await page.locator(".docs-brand").boundingBox();
  expect(theme!.x + theme!.width).toBeLessThanOrEqual(320);
  expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(320);
  expect(brand!.x + brand!.width).toBeLessThanOrEqual(320);
  await expect(page.locator(".docs-brand")).toHaveAccessibleName(/LOADOUT\s*DOCS/i);
});

test("Tab stays inside the phone drawer while it is open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/projects");
  await page.getByRole("button", { name: "Guides", exact: true }).click();
  const inside = () => page.evaluate(() => document.getElementById("docs-guides")!.contains(document.activeElement));
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press("Tab");
    expect(await inside()).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await inside()).toBe(true);
});

test("Escape clears the search first, then closes the phone drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/projects");
  await page.getByRole("button", { name: "Guides", exact: true }).click();
  const search = page.getByRole("searchbox", { name: "Search documentation" });
  await search.fill("track");
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("");
  await expect(search).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(search).toBeHidden();
  await expect(page.getByRole("button", { name: "Guides", exact: true })).toBeFocused();
});

test("opening another guide starts its internal article at the top", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('/docs/projects');
  const main = page.locator('.docs-main');
  await main.evaluate((node) => node.scrollTo(0, node.scrollHeight));
  await expect.poll(() => main.evaluate((node) => node.scrollTop)).toBeGreaterThan(100);
  await page.getByRole('navigation', { name: 'Documentation sections' }).getByRole('link', { name: 'Project review', exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/review$/);
  await expect.poll(() => main.evaluate((node) => node.scrollTop)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Project review' })).toBeInViewport();
});

test("malformed heading fragments do not break the guide", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/docs/projects#%E0%A4%A");
  await expect(page.getByRole("heading", { level: 1, name: "What can I build?" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("documentation routes meet serious automated accessibility checks", async ({ page }) => {
  for (const route of ["/docs/start", "/docs/projects", "/docs/prizes", "/docs/eras"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  }
  for (const route of ["/docs/contributing", "/docs/architecture", "/docs/references", "/docs/library", "/docs/source-plans-plan-02-loadout-economy-and-rewards"]) {
    expect((await page.request.get(route)).status()).toBe(404);
  }
});
