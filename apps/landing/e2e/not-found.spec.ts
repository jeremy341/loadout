import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const lost = "/definitely-not-a-page";
const title = "Sorry, you’ve hit rock bottom.";

async function seriousViolations(page: import("@playwright/test").Page) {
  const result = await new AxeBuilder({ page }).analyze();
  return result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
}

test("an unknown address is a real 404 that names the address and shows the way back", async ({ page }) => {
  const response = await page.goto(lost);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("main")).toContainText(lost);
  await expect(page.getByRole("main")).toContainText("The only way back is up.");
  await expect(page.getByRole("link", { name: /back to the surface/i })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /read the guides/i })).toHaveAttribute("href", "/docs");
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toBeAttached();
});

test("an unknown docs page is the same 404, without the docs shell", async ({ page }) => {
  const response = await page.goto("/docs/not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.locator(".docs-main")).toHaveCount(0);
});

test("the nav on the 404 leads back into the homepage, not to dead anchors", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(lost);
  await expect(page.locator(".nav a.logo")).toHaveAttribute("href", /^\/(#top)?$/);
  const tracks = page.locator(".nav-links").getByRole("link", { name: "TRACKS" });
  await expect(tracks).toHaveAttribute("href", "/#tracks");
  await tracks.click();
  await expect(page).toHaveURL(/\/#tracks$/);
  await expect(page.getByRole("heading", { level: 1, name: /Build your own/ })).toBeVisible();
});

test("the page is one screen of rock with the depth and the ore, and no brackets, in both themes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(lost);
  await expect(page.locator(".rb-rock b")).toHaveText("−1404 M");
  await expect(page.locator(".rb-ore i")).toHaveCount(13);
  await expect(page.locator(".frame-corner, .mc-c")).toHaveCount(0);
  await expect(page.locator(".home")).toHaveCSS("background-color", "rgb(14, 17, 18)");
  await page.locator("label.tg").click();
  await expect(page.locator(".home")).toHaveCSS("background-color", "rgb(221, 211, 191)");
  expect(await seriousViolations(page)).toEqual([]);
});

for (const [width, height] of [[1440, 900], [1366, 768], [1280, 720], [390, 844], [360, 640]]) {
  test(`the 404 keeps its content reachable at ${width} by ${height}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height });
    await page.goto(lost);
    const size = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
    expect(size.w).toBeLessThanOrEqual(width);
    // Narrow screens may scroll rather than clipping text or the motion control.
    if (width > 420) expect(size.h).toBeLessThanOrEqual(height);
    else await page.getByRole("link", { name: /back to the surface/i }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("link", { name: /back to the surface/i })).toBeInViewport({ ratio: 1 });
    if (width <= 420) await page.getByRole("link", { name: /read the guides/i }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("link", { name: /read the guides/i })).toBeInViewport({ ratio: 1 });
  });
}

test("the lamp starts in the middle of the page and follows the pointer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(lost);
  const rock = page.locator(".rb-rock");
  expect(await rock.evaluate((node) => getComputedStyle(node, "::before").maskImage)).toContain("at 50% 46%");
  await expect.poll(async () => {
    await page.mouse.move(200, 300);
    await page.mouse.move(204, 302);
    return rock.evaluate((node) => (node as HTMLElement).style.getPropertyValue("--mx"));
  }).toBe("204px");
});

test("the depth falls to its number when the page opens and lands", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __depths: string[] }).__depths = seen;
    new MutationObserver(() => {
      const text = document.querySelector(".rb-num")?.textContent ?? "";
      if (text && text !== seen[seen.length - 1]) seen.push(text);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await page.goto(lost);
  const numeral = page.locator(".rb-num");
  await expect(numeral).toHaveAttribute("data-landed", "");
  await expect(numeral).toHaveText("−1404 M");
  const seen = await page.evaluate(() => (window as unknown as { __depths: string[] }).__depths);
  const depths = seen.map((text) => Number(text.replace(/\D/g, "")));
  expect(depths.length).toBeGreaterThan(5);
  expect(depths).toContain(0);
  expect(depths.at(-1)).toBe(1404);
  expect(depths.slice(1)).toEqual([...depths.slice(1)].sort((a, b) => a - b));
});

test("the tag, the title and the buttons use the open-lettered display face", async ({ page }) => {
  await page.goto(lost);
  const faces = await page.evaluate(() => {
    const family = (selector: string) => getComputedStyle(document.querySelector(selector)!).fontFamily;
    return [family(".rb .tag"), family(".rb .h1"), family(".rb .hero-btn.pri")];
  });
  const display = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim());
  expect(display).not.toBe("");
  for (const face of faces) expect(face).toContain(display.split(",")[0].replace(/["']/g, ""));
});

test("the title glitches when the depth lands, and stays still for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(lost);
  const lines = page.locator(".h1 > span");
  await expect(page.locator(".rb-num")).toHaveAttribute("data-landed", "");
  await expect(lines.first()).toHaveCSS("animation-name", "rb-glitch-a");
  await expect(lines.last()).toHaveCSS("animation-name", "rb-glitch-b");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(lines.first()).toHaveCSS("animation-name", "none");
  await expect(lines.last()).toHaveCSS("animation-name", "none");
});

test("with reduced motion the depth is there at once and nothing animates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(lost);
  const numeral = page.locator(".rb-num");
  await expect(numeral).toHaveAttribute("data-landed", "");
  await expect(numeral).not.toHaveAttribute("data-falling", "");
  await expect(numeral).toHaveText("−1404 M");
  await expect(numeral).toHaveCSS("animation-name", "none");
});

test("on a phone the actions stay reachable and the page passes the accessibility scan", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(lost);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("link", { name: /back to the surface/i })).toBeInViewport();
  await expect(page.getByRole("link", { name: /read the guides/i })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});
