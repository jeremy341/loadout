import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

// The standard: WCAG 2.2 level AA, the bar GOV.UK Design System works to. Checked automatically here on every page of the
// homepage and the Docs, at phone and desktop width, in light and dark. Automated checks catch only part of WCAG, so the
// manual checks (screen reader, keyboard, zoom) are listed in .ulpi/design/accessibility.md.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const PUBLIC_GUIDES = readdirSync(resolve(__dirname, "../../../content/docs"))
  .filter((name) => name.endsWith(".md"))
  .map((name) => `/docs/${name.slice(0, -3)}`);
const PAGES = ["/", "/docs", "/accessibility", ...PUBLIC_GUIDES, "/accessibility-missing-page", "/docs/accessibility-missing-page"];

for (const path of PAGES) {
  for (const [width, height, scheme] of [[375, 812, "dark"], [375, 812, "light"], [1440, 900, "dark"], [1440, 900, "light"]] as const) {
    test(`${path} has no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
      await page.goto(path);
      if (scheme === "light") await expect(page.locator("#theme")).toBeChecked();
      else await expect(page.locator("#theme")).not.toBeChecked();
      await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
    });
  }
}

test("every table header has text, so a screen reader can name each column", async ({ page }) => {
  for (const path of ["/docs/pricing", "/docs/requisitions", "/docs/shipping"]) {
    await page.goto(path);
    const empty = await page.locator("th").evaluateAll((cells) => cells.filter((c) => !(c.textContent ?? "").trim()).length);
    expect(empty, path).toBe(0);
  }
});

test("mobile navigation keeps its controls on one row at default text settings", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 360, 375, 390, 420, 430]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".nav .lg-text")).toHaveText("LOADOUT");
    const geometry = await page.locator(".nav").evaluate((nav) => {
      const bounds = nav.getBoundingClientRect();
      const controls = ["a.logo", ".nav-toggle", ".tg", ".nav-actions > a.btn"].map((selector) => {
        const element = nav.querySelector<HTMLElement>(selector)!;
        const box = element.getBoundingClientRect();
        return { selector, left: box.left, right: box.right, top: box.top, bottom: box.bottom, center: box.top + box.height / 2, width: box.width, height: box.height, clipped: element.scrollWidth > element.clientWidth + 1 };
      });
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, controls };
    });
    const context = `${width}px: ${JSON.stringify(geometry)}`;
    const centers = geometry.controls.map((control) => control.center);
    expect(Math.max(...centers) - Math.min(...centers), context).toBeLessThanOrEqual(1);
    for (const [index, control] of geometry.controls.entries()) {
      expect(control.left, context).toBeGreaterThanOrEqual(geometry.left);
      expect(control.right, context).toBeLessThanOrEqual(geometry.right);
      expect(control.top, context).toBeGreaterThanOrEqual(geometry.top);
      expect(control.bottom, context).toBeLessThanOrEqual(geometry.bottom);
      expect(control.clipped, context).toBe(false);
      if (index > 0) expect(control.left, context).toBeGreaterThanOrEqual(geometry.controls[index - 1].right);
      if (control.selector !== "a.logo") expect(control.height, context).toBeGreaterThanOrEqual(44);
      if (control.selector === ".nav-toggle") expect(control.width, context).toBeGreaterThanOrEqual(44);
    }
    if (width === 320 || width === 390) {
      await page.screenshot({ path: testInfo.outputPath(`mobile-navigation-${width}.png`) });
    }
  }
});

test("navigation remains reachable at narrow widths and with user text spacing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 360, 375, 430, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const spacing of [false, true]) {
      if (spacing) await page.addStyleTag({ content: "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}" });
      const clipped = await page.locator(".nav a, .nav button, .nav label").evaluateAll((elements) => elements
        .filter((element) => element.getClientRects().length > 0)
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.left < -1 || box.right > document.documentElement.clientWidth + 1;
        }).map((element) => element.textContent || element.getAttribute("aria-label")));
      expect(clipped, `${width}px, spacing ${spacing}`).toEqual([]);
    }
  }
});

test("text enlarged to 200 percent does not overflow the hero or Docs branding", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const route of ["/", "/docs/git", "/docs/tracks"]) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      const readings = Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .map((element) => ({ element, size: Number.parseFloat(getComputedStyle(element).fontSize) }));
      readings.forEach(({ element, size }) => element.style.setProperty("font-size", `${size * 2}px`, "important"));
    });
    const clipped = await page.locator(route === "/" ? ".hero-frame, .h1, .h1 > span" : route === "/docs/git" ? ".docs-nav-head, .docs-brand" : ".doc, .doc-content table").evaluateAll((elements) => elements
      .filter((element) => element.scrollWidth > element.clientWidth + 3)
      .map((element) => ({ className: element.className, width: element.clientWidth, content: element.scrollWidth })));
    expect(clipped, route).toEqual([]);
  }
});

test("there is no visitor pause button and system reduced motion is honored", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".motion-toggle")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-motion-paused", "true");
  await expect(page.locator(".pb-track")).toHaveCSS("animation-name", "none");
});

test("the theme chooser matches the RSVP control height", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const [theme, rsvp] = await Promise.all([
      page.locator(".nav .tg").boundingBox(),
      page.locator(".nav-actions > a.btn").boundingBox(),
    ]);
    expect(theme, `${width}px theme control`).not.toBeNull();
    expect(rsvp, `${width}px RSVP control`).not.toBeNull();
    expect(Math.abs(theme!.height - rsvp!.height), `${width}px height difference`).toBeLessThanOrEqual(1);
  }
});

test("Docs link name contains its visible wording and code examples are explicitly focusable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".docs-tab")).toHaveAccessibleName(/LOADOUT DOCS/i);
  await page.goto("/docs/git");
  for (const block of await page.locator("pre").all()) {
    await expect(block).toHaveAttribute("tabindex", "0");
    await expect(block).toHaveAccessibleName(/code/i);
  }
});

test("forced colors retain identifying menu and theme graphics", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto("/");
  await expect(page.locator(".nav-toggle")).toBeVisible();
  await expect(page.locator(".nav-toggle span").first()).toHaveCSS("border-top-style", "solid");
  expect(await page.locator("label.tg").evaluate((element) => getComputedStyle(element, "::after").content)).toContain("Theme");
  await page.goto("/docs/start");
  expect(await page.locator(".docs-guides-toggle").evaluate((element) => getComputedStyle(element, "::after").content)).toContain("Guides");
});

test("the theme switch sits inside a landmark on the homepage and in the docs", async ({ page }) => {
  for (const path of ["/", "/docs"]) {
    await page.goto(path);
    await expect(page.locator("#theme")).toHaveCount(1);
    const inside = await page.locator("#theme").evaluate((el) => !!el.closest("main, aside, nav, header, footer, [role=main], [role=complementary], [role=navigation], [role=banner]"));
    expect(inside, path).toBe(true);
  }
});
