import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function openSettings(page: Page) {
  const opener = page.getByRole("link", { name: "Accessibility", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Accessibility settings" });
  await expect(dialog).toBeVisible();
  return { opener, dialog };
}

test("footer settings contain keyboard focus and return it on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const { opener, dialog } = await openSettings(page);
  await expect(dialog.getByRole("heading", { name: "Accessibility settings" })).toBeFocused();
  for (let index = 0; index < 14; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("the modal closes on outside click and restores focus to its opener", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const { opener, dialog } = await openSettings(page);
  await page.mouse.click(1, 1);
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("display choices persist across reloads, Docs and error routes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const { dialog } = await openSettings(page);
  await dialog.getByRole("checkbox", { name: /^Light mode/ }).check();
  await dialog.getByRole("checkbox", { name: /^Color-safe palette/ }).check();
  await dialog.getByRole("checkbox", { name: /^Reduce motion/ }).check();
  await page.keyboard.press("Escape");

  for (const route of ["/", "/docs/pricing", "/accessibility-missing-page"]) {
    await page.goto(route);
    await expect(page.locator("#theme")).toBeChecked();
    await expect(page.locator("html")).toHaveAttribute("data-color-safe", "true");
    await expect(page.locator("html")).toHaveAttribute("data-motion-paused", "true");
    const settings = (await openSettings(page)).dialog;
    for (const label of [/^Light mode/, /^Color-safe palette/, /^Reduce motion/]) {
      await expect(settings.getByRole("checkbox", { name: label })).toBeChecked();
    }
    await settings.getByRole("button", { name: "Close", exact: true }).click();
  }
});

test("all preferences work when browser storage is blocked", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() { throw new DOMException("Storage unavailable", "SecurityError"); },
    });
  });
  await page.goto("/");
  await page.locator("label.tg").click();
  await expect(page.locator("#theme")).toBeChecked();
  const { dialog } = await openSettings(page);
  await expect(dialog.getByRole("checkbox", { name: /^Light mode/ })).toBeChecked();
  await dialog.getByRole("checkbox", { name: /^Color-safe palette/ }).check();
  await dialog.getByRole("checkbox", { name: /^Reduce motion/ }).check();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-color-safe", "true");
  await expect(page.locator("html")).toHaveAttribute("data-motion-paused", "true");
  await openSettings(page);
  await expect(dialog.getByRole("checkbox", { name: /^Color-safe palette/ })).toBeChecked();
});

test("expanded reading and display preferences persist, and reset returns them to defaults", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const { dialog } = await openSettings(page);
  await dialog.getByRole("checkbox", { name: "Plain typography" }).check();
  await dialog.getByRole("radio", { name: "150%" }).check();
  await dialog.getByRole("checkbox", { name: "More text spacing" }).check();
  await dialog.getByRole("checkbox", { name: "Stronger contrast" }).check();
  await dialog.getByRole("checkbox", { name: "Use system cursor" }).check();
  await dialog.getByRole("checkbox", { name: "Underline links" }).check();
  await dialog.getByRole("checkbox", { name: "Native scrolling" }).check();
  await dialog.getByRole("checkbox", { name: "Simplify decoration" }).check();
  await dialog.getByRole("radio", { name: "Off" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-reading-size", "150");
  await expect(page.locator("html")).toHaveAttribute("data-plain-typography", "true");
  await expect(page.locator("html")).toHaveAttribute("data-grain", "off");
  await expect(page.locator("canvas.grain")).toHaveCount(0);
  await page.goto("/docs/start");
  await expect(page.locator("html")).toHaveAttribute("data-reading-size", "150");
  const { dialog: docsDialog } = await openSettings(page);
  await docsDialog.getByRole("button", { name: "Reset display settings" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-reading-size", "100");
  await expect(page.locator("html")).toHaveAttribute("data-grain", "animated");
  await expect(page.locator("canvas.grain")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-plain-typography", "false");
});

test("changes synchronize to another open tab", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const other = await context.newPage();
  await other.emulateMedia({ reducedMotion: "no-preference" });
  await other.goto("/docs/start");
  const { dialog } = await openSettings(page);
  await dialog.getByRole("checkbox", { name: /^Light mode/ }).check();
  await dialog.getByRole("checkbox", { name: /^Color-safe palette/ }).check();
  await dialog.getByRole("checkbox", { name: /^Reduce motion/ }).check();
  await expect(other.locator("#theme")).toBeChecked();
  await expect(other.locator("html")).toHaveAttribute("data-color-safe", "true");
  await expect(other.locator("html")).toHaveAttribute("data-motion-paused", "true");
  await other.close();
});

test("motion stays enabled by default and an explicit stop persists outside settings", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-paused", "false");
  for (const preference of ["color-safe", "plain-typography", "more-spacing", "strong-contrast", "system-cursor", "simplify-decoration", "native-scroll", "underline-links"]) {
    await expect(page.locator("html")).toHaveAttribute(`data-${preference}`, "false");
  }
  await expect(page.locator("html")).toHaveAttribute("data-reading-size", "100");
  await expect(page.locator("html")).toHaveAttribute("data-grain", "animated");
  await expect(page.locator(".pb-track")).toHaveCSS("animation-name", "pb-scroll");
  const { dialog } = await openSettings(page);
  await dialog.getByRole("checkbox", { name: /^Reduce motion/ }).check();
  await page.keyboard.press("Escape");
  await page.locator(".hero .h1").scrollIntoViewIfNeeded();
  await expect(page.locator(".pb-track")).toHaveCSS("animation-name", "none");
  await openSettings(page);
  await dialog.getByRole("checkbox", { name: /^Reduce motion/ }).uncheck();
  await page.keyboard.press("Escape");
  await expect(page.locator(".pb-track")).toHaveCSS("animation-name", "pb-scroll");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".pb-track")).toHaveCSS("animation-name", "none");
});

test("the navbar theme control follows the menu in keyboard order", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#theme")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(".nav-actions > a.btn")).toBeFocused();
});

test("semantic card headings retain their former div typography and size", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const differences = await page.locator("#tracks h3.cn, #process h3.cn").evaluateAll((headings) => {
      const properties = ["font-family", "font-size", "font-weight", "line-height", "margin-top", "margin-bottom", "padding-top", "padding-bottom"];
      const readings = (element: Element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return { styles: properties.map((name) => style.getPropertyValue(name)), width: box.width, height: box.height };
      };
      return headings.flatMap((heading) => {
        const current = readings(heading);
        const original = document.createElement("div");
        for (const attribute of heading.attributes) original.setAttribute(attribute.name, attribute.value);
        original.innerHTML = heading.innerHTML;
        heading.replaceWith(original);
        const baseline = readings(original);
        original.replaceWith(heading);
        return JSON.stringify(current) === JSON.stringify(baseline) ? [] : [{ text: heading.textContent, current, baseline }];
      });
    });
    expect(differences).toEqual([]);
    await expect(page.locator("#tracks h3.cn")).toHaveCount(4);
    await expect(page.locator("#process h3.cn")).toHaveCount(9);
  }
});

for (const theme of ["dark", "light"] as const) {
  test(`color-safe ${theme} preferences and dialog meet automated AA checks`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((choice) => {
      localStorage.setItem("loadout-theme", choice);
      localStorage.setItem("loadout-color-safe", "true");
    }, theme);
    for (const route of ["/", "/docs/pricing", "/accessibility", "/accessibility-missing-page"]) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("data-color-safe", "true");
      expect((await new AxeBuilder({ page }).withTags(tags).analyze()).violations).toEqual([]);
      if (route === "/accessibility") continue;
      const { dialog } = await openSettings(page);
      expect((await new AxeBuilder({ page }).withTags(tags).analyze()).violations).toEqual([]);
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
    }
  });
}

test("settings fit a narrow screen and preserve forced colors", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const { dialog } = await openSettings(page);
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("accessibility-settings-320.png") });
  await page.emulateMedia({ forcedColors: "active" });
  expect((await new AxeBuilder({ page }).withTags(tags).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ forcedColors: "none" });
  await page.goto("/accessibility");
  await expect(page.getByRole("heading", { name: "Accessibility", exact: true })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("accessibility-page-1440.png") });
});

test("Accessibility links provide a real page when JavaScript is unavailable", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await page.getByRole("link", { name: "Accessibility", exact: true }).click();
  await expect(page).toHaveURL(/\/accessibility$/);
  await expect(page.getByRole("heading", { name: "Accessibility statement" })).toBeVisible();
  await context.close();
});

test("settings remain readable with enlarged and widely spaced text", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const { dialog } = await openSettings(page);
  await page.evaluate(() => {
    const sizes = Array.from(document.querySelectorAll<HTMLElement>(".a11y-dialog, .a11y-dialog *"))
      .map((element) => ({ element, size: Number.parseFloat(getComputedStyle(element).fontSize) }));
    for (const { element, size } of sizes) element.style.setProperty("font-size", `${size * 2}px`, "important");
  });
  await page.addStyleTag({ content: ".a11y-dialog *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}" });
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});
