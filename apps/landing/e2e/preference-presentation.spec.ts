import { expect, test, type Page } from "@playwright/test";

async function openSettings(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-display-theme", /^(dark|light)$/);
  await page.getByRole("link", { name: "Open accessibility settings" }).focus();
  await page.getByRole("link", { name: "Open accessibility settings" }).click();
  return page.getByRole("dialog", { name: "Accessibility settings" });
}

test("decoration layers can be chosen independently and persist", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const dialog = await openSettings(page);
  await dialog.locator("summary").filter({ hasText: "Effects" }).click();
  await expect(page.locator(".home")).not.toHaveCSS("background-image", "none");
  await dialog.getByRole("checkbox", { name: "Hide ASCII drawings", exact: true }).check();
  await expect(page.locator(".ar")).toHaveCount(0);
  await expect(page.locator(".mole-layer")).toHaveCount(1);
  await expect(page.locator("canvas.grain")).toHaveCount(1);
  await expect(page.locator(".home")).not.toHaveCSS("background-image", "none");
  await dialog.getByRole("checkbox", { name: "Hide background grid", exact: true }).check();
  await expect(page.locator(".home")).toHaveCSS("background-image", "none");
  await dialog.getByRole("checkbox", { name: "Hide ASCII drawings", exact: true }).uncheck();
  await expect(page.locator(".ar").first()).toBeAttached();
  await dialog.getByRole("checkbox", { name: "Hide mascot", exact: true }).check();
  await expect(page.locator(".mole-layer")).toHaveCount(0);
  await dialog.getByRole("checkbox", { name: "Hide extra markings", exact: true }).check();
  await expect(page.locator(".ft-mark")).toHaveCount(0);
  await expect(page.locator("canvas.grain")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-hide-grid", "true");
  await expect(page.locator("html")).toHaveAttribute("data-hide-ascii", "false");
  await expect(page.locator("html")).toHaveAttribute("data-hide-mascot", "true");
  await expect(page.locator("html")).toHaveAttribute("data-hide-markings", "true");
  await expect(page.locator("canvas.grain")).toHaveCount(1);
  const restored = await openSettings(page);
  await restored.getByRole("button", { name: "Reset display settings" }).click();
  await expect(page.locator(".home")).not.toHaveCSS("background-image", "none");
  await expect(page.locator(".mole-layer")).toHaveCount(1);
});

test("the modal keeps the homepage cursor and honors the system-cursor choice", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const dialog = await openSettings(page);
  for (const theme of ["dark", "light"]) {
    await dialog.getByRole("checkbox", { name: "Light mode", exact: true }).setChecked(theme === "light");
    await expect(dialog).toHaveCSS("cursor", new RegExp(`arrow-${theme}`));
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toHaveCSS("cursor", new RegExp(`hand-${theme}`));
    await expect(dialog.locator(".a11y-option strong").first()).toHaveCSS("cursor", new RegExp(`hand-${theme}`));
    await expect(dialog.getByLabel("Color vision palette")).toHaveCSS("cursor", new RegExp(`hand-${theme}`));
    await dialog.getByRole("checkbox", { name: "Use system cursor", exact: true }).check();
    await expect(dialog).not.toHaveCSS("cursor", /loadout\/cursors/);
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toHaveCSS("cursor", "pointer");
    await dialog.getByRole("checkbox", { name: "Use system cursor", exact: true }).uncheck();
  }
});

for (const width of [320, 390, 900, 1440]) {
  test(`reading preferences reflow homepage, Docs and settings at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem("loadout-reading-size", "200");
      localStorage.setItem("loadout-more-spacing", "true");
      localStorage.setItem("loadout-phantom-sans", "true");
      localStorage.setItem("loadout-reduce-motion", "true");
    });
    for (const route of ["/", "/docs/prizes", "/accessibility"]) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("data-reading-size", "200");
      await expect(page.locator("html")).toHaveAttribute("data-more-spacing", "true");
      const overflow = await page.evaluate(() => {
        // The prize belt intentionally has a clipped, repeating track. Check reading
        // containers independently so that intentional carousel overflow is excluded.
        const selectors = [".hero-frame > p", ".hero .h1", ".hc", "#tracks .row", ".docs-main", ".doc", ".a11y-sheet"];
        return selectors.flatMap(selector => [...document.querySelectorAll<HTMLElement>(selector)]
          .filter(element => element.scrollWidth > element.clientWidth + 1)
          .map(() => selector));
      });
      expect(overflow, route).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (route === "/") {
        const dialog = await openSettings(page);
        const close = dialog.getByRole("button", { name: "Close", exact: true });
        await expect(close).toBeInViewport();
        await dialog.locator("summary").filter({ hasText: "Reading" }).click();
        expect(await dialog.evaluate(element => {
          const body = element.querySelector<HTMLElement>(".a11y-dialog-body")!;
          return element.scrollWidth <= element.clientWidth + 1 && body.scrollWidth <= body.clientWidth + 1;
        })).toBe(true);
        await close.click();
      }
    }
  });
}

test("the reading-mode Docs accessibility entry point does not cover article or directory text", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("loadout-reading-size", "200");
    localStorage.setItem("loadout-more-spacing", "true");
  });
  for (const width of [320, 390, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/docs/pricing");
    await expect(page.locator("html")).toHaveAttribute("data-reading-size", "200");
    const entry = page.getByRole("link", { name: "Open accessibility settings" });
    await expect(entry).toBeVisible();
    const overlaps = await entry.evaluate(element => {
      const tab = element.getBoundingClientRect();
      const overlapsTab = (node: Element) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && tab.left < rect.right && tab.right > rect.left && tab.top < rect.bottom && tab.bottom > rect.top;
      };
      return Array.from(document.querySelectorAll(".doc-content p, .docs-navigation .section-link")).filter(overlapsTab).map(node => node.textContent);
    });
    expect(overlaps, `${width}px`).toEqual([]);
    await entry.click();
    await expect(page.getByRole("dialog", { name: "Accessibility settings" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(entry).toBeFocused();
  }
});

test("large pixel text remains operable on short landscape screens", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => {
    localStorage.setItem("loadout-reading-size", "200");
    localStorage.setItem("loadout-more-spacing", "true");
  });
  await page.goto("/");
  const dialog = await openSettings(page);
  await expect(page.locator("html")).toHaveAttribute("data-reading-size", "200");
  expect(await dialog.locator(".a11y-dialog-body").evaluate(element => element.clientHeight)).toBeGreaterThanOrEqual(140);
  await dialog.locator("summary").filter({ hasText: "Reading" }).click();
  await dialog.getByRole("radio", { name: "125%", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-reading-size", "125");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

test("spacing keeps choice labels and narrow Effects headings on one line", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.addInitScript(() => localStorage.setItem("loadout-more-spacing", "true"));
  await page.goto("/");
  const dialog = await openSettings(page);
  await dialog.locator("summary").filter({ hasText: "Reading" }).click();
  const defaultLabel = dialog.getByRole("radio", { name: "Default", exact: true }).locator("..").locator("span");
  expect(await defaultLabel.evaluate(element => {
    const range = document.createRange(); range.selectNodeContents(element);
    return range.getClientRects().length;
  })).toBe(1);
  await dialog.getByRole("radio", { name: "200%", exact: true }).check();
  const effects = dialog.locator("summary").filter({ hasText: "Effects" });
  expect(await effects.evaluate(element => {
    const range = document.createRange(); range.selectNodeContents(element.childNodes[0]);
    return range.getClientRects().length;
  })).toBe(1);
});

test("reading layouts keep the hero badge and heading clear of decoration", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("loadout-reading-size", "200");
    localStorage.setItem("loadout-more-spacing", "true");
  });
  for (const width of [320, 390, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-more-spacing", "true");
    await page.evaluate(() => document.fonts.ready);
    const overlaps = await page.locator(".hero").evaluate(hero => {
      const intersects = (first: Element, second: Element) => {
        if (!first.getClientRects().length || !second.getClientRects().length) return false;
        const a = first.getBoundingClientRect(), b = second.getBoundingClientRect();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      };
      const badge = hero.querySelector(".hero-badge")!;
      const heading = hero.querySelector("h1")!;
      return {
        badge: Array.from(hero.querySelectorAll(".meta")).some(meta => intersects(meta, badge)),
        stamp: intersects(hero.querySelector(".stp.s1")!, heading),
      };
    });
    expect(overlaps, `${width}px`).toEqual({ badge: false, stamp: false });
  }
});

test("large-text phone hero uses the full width and compact navigation", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("loadout-reading-size", "200");
    localStorage.setItem("loadout-more-spacing", "true");
  });
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-reading-size", "200");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator(".home .nav").evaluate(element => element.clientHeight)).toBeLessThan(72);
    await expect(page.locator(".hero-copy-compact")).toBeVisible();
    await expect(page.locator(".hero-copy-full")).toBeHidden();
    await expect(page.locator(".hero-frame > p")).toHaveCSS("font-size", "28px");
    expect(await page.locator(".hero-frame > p").evaluate(element => element.clientWidth)).toBeGreaterThanOrEqual(width - 40);
    await expect(page.locator(".home .docs-tab")).toHaveCSS("position", "static");
  }
});

test("enlarged desktop hero copy uses a wider measure instead of extra lines", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("loadout-reading-size", "200");
    localStorage.setItem("loadout-more-spacing", "true");
  });
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-reading-size", "200");
    await page.evaluate(() => document.fonts.ready);
    const copy = page.locator(".hero-frame > p");
    await expect(copy).toHaveCSS("font-size", "28px");
    const layout = await copy.evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const lines = new Set(Array.from(range.getClientRects()).filter(rect => rect.height > 0).map(rect => Math.round(rect.top)));
      return { width: element.clientWidth, lines: lines.size };
    });
    expect(layout.width).toBeGreaterThanOrEqual(800);
    expect(layout.lines).toBeLessThanOrEqual(3);
  }
});

for (const width of [390, 1440]) {
  test(`Docs search, FAQ and prizes remain operable with reading preferences at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem("loadout-reading-size", "200");
      localStorage.setItem("loadout-more-spacing", "true");
      localStorage.setItem("loadout-reduce-motion", "true");
    });
    await page.goto("/docs/start");
    await expect(page.locator("html")).toHaveAttribute("data-reading-size", "200");
    if (width < 821) await page.getByRole("button", { name: "Guides", exact: true }).click();
    const search = page.getByRole("searchbox", { name: "Search documentation" });
    await search.fill("track xp");
    const result = page.locator("#docs-search-result-0");
    await expect(result).toBeVisible();
    const destination = new URL((await result.getAttribute("href"))!, page.url()).href;
    await search.press("ArrowDown");
    await expect(result).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(destination);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-reading-size", "200");
    await page.evaluate(() => document.fonts.ready);
    const question = page.locator(".fq2-q").first();
    await question.click();
    await expect(page.locator(".fq2").first()).toHaveAttribute("open", "");
    await expect(page.locator(".fq2-a p").first()).toBeVisible();
    const prizes = page.getByRole("region", { name: "Proposed prize examples" });
    await prizes.focus();
    const start = await prizes.evaluate(element => element.scrollLeft);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => prizes.evaluate(element => element.scrollLeft)).toBeGreaterThan(start);
  });
}

test("default layouts stay unchanged when no reading options are selected", async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-reading-layout", "false");
    await expect(page.locator(".hero-copy-full")).toBeVisible();
    await expect(page.locator(".hero-copy-compact")).toBeHidden();
    await expect(page.locator(".hero-frame > p")).toHaveCSS("text-align", "center");
    await expect(page.locator(".docs-tab")).toHaveCSS("position", "fixed");
    if (width <= 560) {
      await expect(page.locator(".hero .meta-left")).toHaveCSS("left", "20px");
      expect(await page.locator(".home .nav").evaluate(element => element.clientHeight)).toBeLessThan(80);
    }
    await page.goto("/docs/start");
    await expect(page.locator("html")).toHaveAttribute("data-reading-layout", "false");
    await expect(page.locator(".docs .a11y-shortcut")).toHaveCSS("position", "fixed");
    await expect(page.locator(".docs .a11y-tab")).toHaveCSS("writing-mode", "vertical-rl");
    if (width <= 560) expect(await page.locator(".docs-nav").evaluate(element => element.clientHeight)).toBeLessThan(80);
  }
  await page.evaluate(() => localStorage.setItem("loadout-strong-contrast", "true"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-strong-contrast", "true");
  await expect(page.locator("html")).toHaveAttribute("data-reading-layout", "false");
  await expect(page.locator(".docs .a11y-shortcut")).toHaveCSS("position", "fixed");
});

test("enlarged settings use full-width horizontal categories without changing defaults", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/accessibility");
  await expect(page.locator("html")).toHaveAttribute("data-reading-layout", "false");
  const categories = page.getByRole("tablist", { name: "Settings categories" });
  await expect(categories).toHaveAttribute("aria-orientation", "vertical");
  await categories.getByRole("tab", { name: /Reading/ }).click();
  await page.locator(".a11y-page").getByRole("radio", { name: "200%", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("data-reading-layout", "true");
  await expect(categories).toHaveAttribute("aria-orientation", "horizontal");
  await expect(page.locator(".a11y-settings-layout")).toHaveCSS("display", "block");
  expect(await page.locator(".a11y-sheet").evaluate(element => element.clientWidth)).toBeGreaterThan(1100);
  await categories.getByRole("tab", { name: /Appearance/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(categories.getByRole("tab", { name: /Reading/ })).toBeFocused();
  await expect(categories.getByRole("tab", { name: /Reading/ })).toHaveAttribute("aria-selected", "true");
  await page.locator(".a11y-page").getByRole("button", { name: "Reset display settings" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-reading-layout", "false");
  await expect(categories).toHaveAttribute("aria-orientation", "vertical");
  await expect(page.locator(".a11y-settings-layout")).toHaveCSS("display", "grid");
});
