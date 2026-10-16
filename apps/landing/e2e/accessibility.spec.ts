import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The standard: WCAG 2.2 level AA, the bar GOV.UK Design System works to. Checked automatically here on every page of the
// homepage and the Docs, at phone and desktop width, in light and dark. Automated checks catch only part of WCAG, so the
// manual checks (screen reader, keyboard, zoom) are listed in .ulpi/design/accessibility.md.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const PAGES = ["/", "/docs", "/docs/start", "/docs/eligibility", "/docs/shipping", "/docs/progress", "/docs/pricing", "/docs/review", "/docs/faq", "/docs/team", "/docs/tracks", "/docs/requisitions", "/docs/custom-orders", "/docs/eras", "/docs/irl", "/docs/help"];

for (const path of PAGES) {
  for (const [width, height, scheme] of [[375, 812, "dark"], [1440, 900, "light"]] as const) {
    test(`${path} has no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      await page.goto(path);
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

test("the theme switch sits inside a landmark on the homepage and in the docs", async ({ page }) => {
  for (const path of ["/", "/docs"]) {
    await page.goto(path);
    await expect(page.locator("#theme")).toHaveCount(1);
    const inside = await page.locator("#theme").evaluate((el) => !!el.closest("main, aside, nav, header, footer, [role=main], [role=complementary], [role=navigation], [role=banner]"));
    expect(inside, path).toBe(true);
  }
});
