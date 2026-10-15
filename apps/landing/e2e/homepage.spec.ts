import { devices, expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const rsvpUrl = "https://rsvp.soon.it/loadout";

test("homepage shows the four tracks, Research Mode, and working section anchors", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/LOADOUT/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Build your own technical stack.");
  await expect(page.locator("#tracks .cn")).toHaveText(["Tools", "Systems", "Compute", "Hardware"]);
  await expect(page.locator("#research")).toContainText("Research Mode");
  await expect(page.locator("#research")).toContainText("It is not a fifth track.");
  const anchors = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  for (const anchor of new Set(anchors)) {
    expect(anchor).not.toBe("#");
    await expect(page.locator(anchor!)).toHaveCount(1);
  }
});

test("the footer docs link leaves the homepage for the separate docs route", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home #docs")).toHaveCount(0);
  await expect(page.locator(".nav").getByRole("link", { name: "DOCS" })).toHaveCount(0);
  await page.locator("footer.ft").getByRole("link", { name: "LOADOUT docs", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/start$/);
  await expect(page.getByRole("heading", { level: 1, name: "What is LOADOUT?" })).toBeVisible();
});

test("the floating docs tab opens the docs route", async ({ page }) => {
  await page.goto("/");
  const tab = page.getByRole("link", { name: "Open LOADOUT documentation" });
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page).toHaveURL(/\/docs\/start$/);
});

test("the chosen theme carries from the homepage to the docs", async ({ page }) => {
  await page.goto("/");
  await page.locator("label.tg").click();
  await expect(page.locator("#theme")).toBeChecked();
  await page.goto("/docs/start");
  await expect(page.locator(".docs #theme")).toBeChecked();
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe("rgb(221, 211, 191)");
});

test("the theme switch changes the palette", async ({ page }) => {
  await page.goto("/");
  const background = () => page.evaluate(() => getComputedStyle(document.querySelector(".home") as Element).backgroundColor);
  const dark = await background();
  await page.locator("label.tg").click();
  await expect(page.locator("#theme")).toBeChecked();
  expect(await background()).not.toBe(dark);
});

test("FAQ answers open with the keyboard and expose their state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const question = page.getByRole("button", { name: "What is Research Mode?" });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.focus();
  await expect(question).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#faq")).toContainText("It is not a fifth track");
});

test("the navigation hides on scroll down and returns on scroll up", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const nav = page.locator(".nav");
  await page.mouse.move(700, 400);
  // Retry until hydration has attached the scroll listener.
  await expect(async () => {
    await page.mouse.wheel(0, 1500);
    await expect(nav).toHaveClass(/nav-hidden/, { timeout: 500 });
  }).toPass();
  await page.mouse.wheel(0, -400);
  await expect(nav).not.toHaveClass(/nav-hidden/);
});

test("mobile menu opens, jumps to a section, and closes on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  const sheet = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("link", { name: /FAQ/ }).click();
  await expect(page).toHaveURL(/#faq$/);
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
});

test("RSVP buttons link to the configured destination", async ({ page }) => {
  await page.goto("/");
  const rsvp = page.getByRole("link", { name: /RSVP now/i });
  await expect(rsvp).toHaveCount(2);
  for (const link of await rsvp.all()) await expect(link).toHaveAttribute("href", rsvpUrl);
});

for (const width of [390, 1440]) {
  test(`every flow step box keeps all four borders at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const incomplete = await page.locator("#process .fn").evaluateAll((boxes) =>
      boxes.filter((box) => {
        const style = getComputedStyle(box);
        return ["Top", "Right", "Bottom", "Left"].some((side) => style.getPropertyValue(`border-${side.toLowerCase()}-width`) !== "1px");
      }).length
    );
    expect(incomplete).toBe(0);
    // four steps, three outcomes of review, then the upgrade and build-again steps
    await expect(page.locator("#process .fn")).toHaveCount(9);
  });
}

for (const [width, height] of [[390, 844], [1440, 900]]) {
  test(`hero title stays on two lines at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const title = page.getByRole("heading", { level: 1 });
    const box = await title.boundingBox();
    const lineHeight = await title.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
    expect(box!.height / lineHeight).toBeLessThanOrEqual(2.2);
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

test("desktop and mobile have no serious or critical automated accessibility findings", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
  }
});

test("margin ASCII is faint but visible, decorative and shown from 640px up", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const art = page.locator(".home .ar");
  await expect(art).toHaveCount(8);
  await expect(art.first()).toHaveAttribute("aria-hidden", "true");
  await expect(art.first()).toHaveCSS("pointer-events", "none");
  const alpha = await art.first().locator(".ar-base").evaluate((el) => parseFloat(getComputedStyle(el).color.split(",")[3]));
  expect(alpha).toBeLessThanOrEqual(0.3);
  expect(alpha).toBeGreaterThanOrEqual(0.1);
  const box = (await page.locator("#tracks .ar").boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(1440);
  for (const width of [1100, 856]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(art.first()).toBeVisible();
  }
  await page.setViewportSize({ width: 600, height: 900 });
  await expect(art.first()).toBeHidden();
});

const watchScramble = (page: import("@playwright/test").Page) =>
  page.addInitScript(() => {
    (window as unknown as { __scrambled: boolean }).__scrambled = false;
    document.addEventListener("DOMContentLoaded", () => {
      new MutationObserver((records) => {
        for (const record of records) {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains("scr-w")) (window as unknown as { __scrambled: boolean }).__scrambled = true;
          });
        }
      }).observe(document.body, { childList: true, subtree: true });
    });
  });

test("the hero title scrambles on load, keeps its name, and settles on the real text", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await watchScramble(page);
  await page.goto("/");
  const title = page.getByRole("heading", { level: 1 });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __scrambled: boolean }).__scrambled)).toBe(true);
  await expect(title).toHaveAccessibleName("Build your own technical stack.");
  await expect(title.locator(".scr-c")).toHaveCount(0, { timeout: 5000 });
  expect(await title.evaluate((el) => (el as HTMLElement).innerText)).toMatch(/build your own\s+technical stack\./i);
  await expect(title).not.toHaveAttribute("aria-label", /.+/);
});

test("section headings are not scrambled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("#tracks h2").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await expect(page.locator(".home h2 .scr-w")).toHaveCount(0);
});

test("the hero title stays untouched for reduced-motion visitors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await watchScramble(page);
  await page.goto("/");
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { __scrambled: boolean }).__scrambled)).toBe(false);
  await expect(page.locator(".hero h1 .scr-c")).toHaveCount(0);
});

test("hero buttons get corner brackets that wake up when the mouse comes near", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const corners = page.locator(".hero-actions .mc");
  await expect(corners).toHaveCount(2);
  await expect(corners.first().locator(".mc-c")).toHaveCount(4);
  const box = (await corners.first().boundingBox())!;
  await expect(async () => {
    await page.mouse.move(2, 2);
    await page.mouse.move(box.x - 30, box.y + box.height / 2);
    await expect(corners.first()).toHaveAttribute("data-active", "");
  }).toPass();
  await expect(corners.first()).toHaveCSS("--mc-x", /^-?\d/);
  await page.mouse.move(2, 2);
  await expect(corners.first()).not.toHaveAttribute("data-active", "");
});

test("the corner brackets stay put for reduced-motion visitors", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const corner = page.locator(".hero-actions .mc").first();
  const box = (await corner.boundingBox())!;
  await expect(async () => {
    await page.mouse.move(2, 2);
    await page.mouse.move(box.x - 30, box.y + box.height / 2);
    await expect(corner).toHaveAttribute("data-active", "");
  }).toPass();
  const pull = await corner.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--mc-x"));
  expect(pull).toBe("0px");
});

test("hero facts scramble under the pointer and settle back to their text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const fact = page.locator(".hero-facts .hs").first();
  await expect(fact).toHaveText("▣ Technical projects");
  await expect(page.locator(".hero-facts .hs-sr").first()).toHaveText("▣ Technical projects");
  await fact.locator('[data-i="4"]').hover();
  await expect(fact).toHaveText("▣ Technical projects", { timeout: 2000 });
});

test("the footer wordmark is decorative and never takes pointer input", async ({ page }) => {
  await page.goto("/");
  const mark = page.locator("footer.ft .ft-mark");
  await expect(mark).toHaveCount(1);
  await expect(mark).toHaveAttribute("aria-hidden", "true");
  await expect(mark).toHaveCSS("pointer-events", "none");
});

test("the docs tag is Pixl's bottom tab: pinned to the bottom edge, 2/4/4/2 borders that grow on hover", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const tab = page.getByRole("link", { name: "Open LOADOUT documentation" });
  await expect(tab).toHaveCSS("position", "fixed");
  await expect(tab).toHaveCSS("bottom", "0px");
  await expect(tab).toHaveCSS("border-top-width", "2px");
  await expect(tab).toHaveCSS("border-left-width", "2px");
  await expect(tab).toHaveCSS("border-right-width", "4px");
  await expect(tab).toHaveCSS("border-bottom-width", "4px");
  await tab.hover();
  await expect(tab).toHaveCSS("border-bottom-width", "6px");
});

test("the dark theme is graphite", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home")).toHaveCSS("background-color", "rgb(34, 38, 39)");
});

test("depth markers are tall strips with a large number", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const pit = page.locator(".pit").first();
  expect((await pit.boundingBox())!.height).toBeGreaterThanOrEqual(150);
  await expect(pit.locator("b")).toHaveCSS("font-size", "88px");
});

test("depth numerals are faint and light up under the pointer, like the footer wordmark", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const numeral = page.locator(".pit b").first();
  await expect(numeral).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  expect(await numeral.evaluate((el) => getComputedStyle(el).backgroundClip)).toContain("text");
  // The label has the same glow and is set in Jersey 10, the wordmark face.
  const label = page.locator(".pit > span").first();
  expect(await label.evaluate((el) => getComputedStyle(el).backgroundClip)).toContain("text");
  expect(await label.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("display");
  // The label has a plate in the page colour, so the hatching does not run through it.
  expect(await label.evaluate((el) => getComputedStyle(el).backgroundClip)).toContain("border-box");
  expect(parseFloat(await label.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
  // The hatched band is back, and it lights near the pointer like the numerals do.
  const marker = page.locator(".pit").first();
  await expect(marker).toHaveCSS("background-image", /repeating-linear-gradient/);
  await numeral.scrollIntoViewIfNeeded();
  const box = await numeral.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect.poll(() => numeral.evaluate((el) => el.style.getPropertyValue("--mx"))).not.toBe("");
  await expect.poll(() => label.evaluate((el) => el.style.getPropertyValue("--mx"))).not.toBe("");
  await expect.poll(() => marker.evaluate((el) => el.style.getPropertyValue("--mx"))).not.toBe("");
});

test("deeper depth markers light more strongly, in the order of their numerals", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // DepthGlow sets the factor after hydration, so wait for it before reading the markers.
  await expect.poll(() => page.locator(".pit").first().evaluate((el) => (el as HTMLElement).style.getPropertyValue("--depth-light"))).not.toBe("");
  const markers = await page.locator(".pit").evaluateAll((pits) =>
    pits.map((pit) => ({
      depth: Number((pit.querySelector("b")!.textContent ?? "").replace(/\D/g, "")),
      light: Number((pit as HTMLElement).style.getPropertyValue("--depth-light")),
    })),
  );
  expect(markers.length).toBeGreaterThan(1);
  const byDepth = [...markers].sort((a, b) => a.depth - b.depth);
  for (let i = 1; i < byDepth.length; i++) expect(byDepth[i].light).toBeGreaterThanOrEqual(byDepth[i - 1].light);
  expect(Math.min(...markers.map((marker) => marker.light))).toBeGreaterThanOrEqual(0.4);
  expect(Math.max(...markers.map((marker) => marker.light))).toBeCloseTo(1, 5);
});

test("touch screens get no depth glow under the pointer", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ ...devices["iPhone 13"], baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await page.mouse.move(200, 400);
  await page.mouse.move(210, 420);
  await page.waitForTimeout(200);
  expect(await page.locator(".pit").first().evaluate((el) => (el as HTMLElement).style.getPropertyValue("--mx"))).toBe("");
  await context.close();
});

test("on phones the depth numerals stay on one line and the labels fit their strips", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const pits = page.locator(".pit");
  const count = await pits.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const fit = await pits.nth(i).evaluate((el) => {
      const numeral = el.querySelector<HTMLElement>(":scope > b")!;
      const label = el.querySelector<HTMLElement>(":scope > span")!;
      const style = getComputedStyle(label);
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const strip = el.getBoundingClientRect();
      const box = label.getBoundingClientRect();
      return {
        numeralLines: Math.round(numeral.getBoundingClientRect().height / parseFloat(getComputedStyle(numeral).lineHeight)),
        labelLines: Math.round((box.height - padding) / parseFloat(style.lineHeight)),
        inside: box.top >= strip.top && box.bottom <= strip.bottom && box.left >= strip.left && box.right <= strip.right,
      };
    });
    expect(fit.numeralLines, `depth marker ${i + 1} numeral lines`).toBe(1);
    expect(fit.labelLines, `depth marker ${i + 1} label lines`).toBeLessThanOrEqual(2);
    expect(fit.inside, `depth marker ${i + 1} label stays inside its strip`).toBe(true);
  }
});

test("sections reveal with main's triggered slide-in, not a scroll-scrubbed fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  expect(await page.locator(".reveal").count()).toBeGreaterThanOrEqual(9);
  await expect(page.locator(".reveal[data-stagger]").first()).toHaveCount(1);
  await expect(page.locator("#tracks .card").first()).toHaveCSS("animation-name", "none");
});

test("the hero enters with main's title, badge and copy animations, and holds still for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".hero .h1")).toHaveCSS("animation-name", "hero-title-enter");
  await expect(page.locator(".hero .hero-badge")).toHaveCSS("animation-name", "hero-badge-enter");
  await expect(page.locator(".hero .hero-actions")).toHaveCSS("animation-name", "hero-support-enter");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero .h1")).toHaveCSS("animation-name", "none");
});

test("the hero follows the reference size: big title and 260x52 buttons", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero .h1")).toHaveCSS("font-size", "122.4px");
  const button = (await page.locator(".hero-actions .hero-btn").first().boundingBox())!;
  expect(Math.round(button.width)).toBe(260);
  expect(Math.round(button.height)).toBe(52);
});

test("the magnetic corners lean at most 4px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const corner = page.locator(".hero-actions .mc").first();
  const box = (await corner.boundingBox())!;
  await expect(async () => {
    await page.mouse.move(2, 2);
    await page.mouse.move(box.x - 30, box.y + box.height / 2);
    await expect(corner).toHaveAttribute("data-active", "");
  }).toPass();
  const lean = await corner.evaluate((el) => Math.abs(parseFloat((el as HTMLElement).style.getPropertyValue("--mc-x"))));
  expect(lean).toBeLessThanOrEqual(4);
});

test("section headings carry the four corner brackets, and nothing else gets them", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const headings = page.locator(".home .sect > .h2");
  const count = await headings.count();
  expect(count).toBeGreaterThanOrEqual(10);
  for (let i = 0; i < count; i++) {
    const marks = await headings.nth(i).evaluate((el) => getComputedStyle(el, "::before").backgroundImage);
    expect(marks.match(/linear-gradient/g)?.length ?? 0).toBe(8);
  }
  const cardMarks = await page.locator(".home .card").first().evaluate((el) => getComputedStyle(el, "::before").backgroundImage);
  expect(cardMarks.match(/linear-gradient/g)?.length ?? 0).toBe(0);
});

test("the footer wordmark glows yellow, not red, in light mode", async ({ page }) => {
  await page.goto("/");
  await page.locator("label.tg").click();
  await expect(page.locator("#theme")).toBeChecked();
  await expect(page.locator(".ft-mark-lit")).toHaveCSS("color", "rgb(227, 194, 107)");
});

test("dark mode uses one box colour, soft outlines and no bottom darkening", async ({ page }) => {
  await page.goto("/");
  const colour = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor);
  const box = await colour("#tracks .card");
  expect(box).toBe("rgb(44, 49, 50)");
  for (const selector of ["#research", ".lgr", ".nav", "#process .fn", ".era > div"]) expect(await colour(selector)).toBe(box);
  await expect(page.locator("#tracks .card").first()).toHaveCSS("border-top-color", "rgba(233, 235, 231, 0.22)");
  await expect(page.locator(".strata")).toHaveCount(0);
  await expect(page.locator("#process .lnks a").first()).toHaveCSS("color", "rgb(111, 194, 187)");
  await page.locator("label.tg").click();
  await expect(page.locator("#tracks .card").first()).toHaveCSS("border-top-color", "rgb(26, 23, 20)");
});
test("the hero title keeps its width through the entrance and the scramble", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const title = page.locator(".hero .h1");
  // The entrance scales the title in, but its layout width never changes.
  const layoutWidth = () => title.evaluate((el) => (el as HTMLElement).offsetWidth);
  const layoutBefore = await layoutWidth();
  await expect.poll(() => title.evaluate((el) => el.getAnimations().every((a) => a.playState === "finished"))).toBe(true);
  expect(await layoutWidth()).toBe(layoutBefore);
  // Each line from its first letter to its last, in layout pixels: the entrance scale is divided out.
  const lineWidths = () => page.locator(".hero .h1").evaluate((el) => {
    const scale = el.getBoundingClientRect().width / (el as HTMLElement).offsetWidth;
    return [...el.querySelectorAll<HTMLElement>(":scope > span")].map((span) => {
      const boxes = span.querySelectorAll<HTMLElement>(".scr-c");
      if (boxes.length) return (boxes[boxes.length - 1].getBoundingClientRect().right - boxes[0].getBoundingClientRect().left) / scale;
      const text = span.firstChild as Text;
      const lastLetter = Math.max(...[...(text.textContent ?? "")].map((char, index) => (/[A-Za-z0-9]/.test(char) ? index : -1)));
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, lastLetter + 1);
      return range.getBoundingClientRect().width / scale;
    });
  });
  // While the scramble runs, the letters take their real places.
  await expect(page.locator(".hero .h1 .scr-c").first()).toBeAttached();
  const during = await lineWidths();
  await expect(page.locator(".hero .h1 .scr-c")).toHaveCount(0, { timeout: 5000 });
  const after = await lineWidths();
  expect(during).toHaveLength(after.length);
  for (let i = 0; i < after.length; i++) expect(Math.abs(during[i] - after[i])).toBeLessThanOrEqual(1);
});

test("the ASCII art drifts unless reduced motion is requested", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const field = page.locator(".hero .ar-left");
  await expect.poll(() => field.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => field.evaluate((el) => el.getAnimations().length)).toBe(0);
});

test("the cards use the first site's pixel icons: as drawn in light mode, turned blue in dark mode", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#tracks .card .ic use").first()).toHaveAttribute("href", "#i-wrench");
  await expect(page.locator("symbol#i-wrench image")).toHaveAttribute("href", "/loadout/sprites/wrench.png");
  const missing = await page.evaluate(() => [...document.querySelectorAll(".home use")].map((use) => use.getAttribute("href")!).filter((href) => !document.querySelector(href)));
  expect(missing).toEqual([]);
  const filter = () => page.locator("#tracks .card .ic").first().evaluate((element) => getComputedStyle(element).filter);
  expect(await filter()).toContain("hue-rotate");
  await page.locator("label.tg").click();
  expect(await filter()).toBe("none");
});

test("buttons use main's style: bordered, rounded 2px, block shadow, capitals", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const button of [page.locator(".nav-actions a.btn"), page.locator(".hero-actions .btn").first(), page.locator(".hero-actions .btn").nth(1)]) {
    await expect(button).toHaveCSS("border-top-width", "2px");
    await expect(button).toHaveCSS("border-top-left-radius", "2px");
    await expect(button).toHaveCSS("text-transform", "uppercase");
    await expect(button).not.toHaveCSS("box-shadow", "none");
  }
});

test("the grain is a full-screen noise canvas that redraws and never takes input", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const grain = page.locator(".home > canvas.grain");
  await expect(grain).toHaveCount(1);
  await expect(grain).toHaveCSS("pointer-events", "none");
  await expect(grain).toHaveCSS("position", "fixed");
  await expect(grain).toHaveCSS("opacity", "0.33");
  await expect(grain).toHaveAttribute("aria-hidden", "true");
  const sample = () => grain.evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")!.getImageData(0, 0, 64, 64).data;
    let covered = 0;
    for (let index = 3; index < data.length; index += 4) if (data[index] > 0) covered++;
    return { covered, hash: Array.from(data.slice(0, 256)).join(",") };
  });
  const first = await sample();
  expect(first.covered).toBeGreaterThan(64 * 64 * 0.9);
  await expect.poll(async () => (await sample()).hash, { timeout: 3000 }).not.toBe(first.hash);
});

test("the docs use the Pixl layout: boxed sidebar, hard rules, block shadows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/start");
  await expect(page.locator(".docs > canvas.grain")).toHaveCount(1);
  await expect(page.locator(".docs-nav")).toHaveCSS("border-right-width", "4px");
  await expect(page.locator(".doc h1")).toHaveCSS("font-size", "46px");
  await expect(page.locator(".doc-foot a").first()).toHaveCSS("border-top-width", "2px");
  expect(await page.locator(".doc-foot a").first().evaluate((element) => getComputedStyle(element).boxShadow)).toMatch(/4px 4px 0px/);
  await expect(page.locator(".docs-nav .section-link.active")).toHaveText("What is LOADOUT?");
  await expect(page.locator(".docs-toc [aria-current]")).toHaveCount(1);
  expect(await page.locator(".docs").evaluate((element) => getComputedStyle(element).backgroundImage)).toBe("none");
});

test("the docs sidebar groups fold with their chevron and the back button lifts like Pixl's", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/start");
  const group = page.locator(".docs-group").nth(1);
  await expect(group).toHaveJSProperty("open", true);
  await group.locator("summary").click();
  await expect(group).toHaveJSProperty("open", false);
  const back = page.locator(".docs-back-button");
  await expect(back).toHaveCSS("border-bottom-width", "4px");
  await back.hover();
  await expect.poll(() => back.evaluate((element) => getComputedStyle(element).borderBottomWidth)).toBe("8px");
});

test("the page has no long dashes and no repeated filler labels", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator(".home").innerText();
  expect(text).not.toMatch(/[—–]/);
  expect(text).not.toMatch(/FIG\. \d|EARNED ON SHIP|TECHNICAL SIGNAL|PLANNED PRIZE\n|OUTCOME/);
});

test("the LOADOUT Docs tab opens the field manual and its section links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open LOADOUT documentation" }).click();
  await expect(page).toHaveURL(/\/docs\/start$/);
  await expect(page.getByRole("heading", { level: 1, name: "What is LOADOUT?" })).toBeVisible();
  const docsNav = page.getByRole("navigation", { name: "Documentation sections" });
  await expect(docsNav).toBeVisible();
  await docsNav.getByRole("link", { name: "Ore, XP & levels" }).click();
  await expect(page).toHaveURL(/\/docs\/progress$/);
  await expect(page.locator("h1", { hasText: "Ore, XP & levels" })).toBeInViewport();
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

test("Community Eras explain shared progression without leaking Era rules elsewhere", async ({ page }) => {
  await page.goto("/");
  const eras = page.locator("#eras");
  await expect(eras.getByRole("heading", { name: "Build the next Era together." })).toBeVisible();
  await expect(eras).not.toContainText("Planned community concept");
  await expect(eras).toContainText("A technical theme the whole community works toward. Approved projects, in any of the four tracks, move it forward.");
  await expect(eras).toContainText("Approved projects");
  await expect(eras).toContainText("Shared Era Points");
  await expect(eras).toContainText("Next technical theme");
  await expect(eras).toContainText("+10%");
  await expect(eras).toContainText("Era Points are separate from Ore and Track XP.");
  await expect(eras).toContainText("Planned rule");
  await expect(eras).not.toContainText(/Steam|Electrification|Computing|Networks|Acceleration|14 days|weekly reset|target|Season/i);
  for (const selector of ["#process", "#progression", "#loadout-irl"]) {
    await expect(page.locator(selector)).not.toContainText(/Era objectives|Era Points|Era changes/i);
  }
  await expect(page.locator("#faq")).not.toContainText(/14 days|weekly reset|target|\+10%/i);
});

test("Custom Orders keep the request path without showing the planned tier card", async ({ page }) => {
  await page.goto("/");
  const customOrders = page.locator("#custom-orders");
  await expect(customOrders).toContainText("relevant track tier");
  await expect(customOrders).toContainText("Custom Order requests are not open yet");
  await expect(customOrders).not.toContainText(/Planned request tiers|Bare Metal|LV\.4|LV\.8|LV\.12|LV\.15/);
});

for (const width of [320, 390, 471, 700, 701, 900, 901, 1440]) {
  test(`Research Mode keeps readable copy and separate labels at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const strip = page.locator("#research");
    const heading = strip.locator("b");
    const description = strip.locator(".dsc");
    const status = strip.locator(".chip");
    const [panel, title, copy, label] = await Promise.all([
      strip.boundingBox(), heading.boundingBox(), description.boundingBox(), status.boundingBox(),
    ]);
    for (const bounds of [title!, copy!, label!]) {
      expect(bounds.x).toBeGreaterThanOrEqual(panel!.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(panel!.x + panel!.width + 1);
    }
    const overlaps = title!.x < label!.x + label!.width && title!.x + title!.width > label!.x && title!.y < label!.y + label!.height && title!.y + title!.height > label!.y;
    expect(overlaps).toBe(false);
    expect(copy!.width).toBeGreaterThan(panel!.width * (width <= 700 ? 0.6 : 0.35));
    for (const text of [heading, description, status]) {
      expect(await text.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
  });
}

test("essential content and FAQ remain available without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".faq-noscript")).toContainText("Hackatime");
  await expect(page.locator(".faq-noscript")).toBeVisible();
  await context.close();
});

test("Loadout IRL is described as a proposal, not an announced event", async ({ page }) => {
  await page.goto("/");
  const irl = page.locator("#loadout-irl");
  await expect(irl).toContainText("proposed");
  await expect(irl).toContainText("not an announced event");
  await expect(irl).not.toContainText("A planned three-day");
});

test("a section without a lead keeps a gap under its heading", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const id of ["process", "field-pricing", "behind-loadout"]) {
    const gap = await page.locator(`#${id}`).evaluate((section) => {
      const heading = section.querySelector(":scope > .h2")!;
      return heading.nextElementSibling!.getBoundingClientRect().top - heading.getBoundingClientRect().bottom;
    });
    expect(gap, id).toBeGreaterThanOrEqual(30);
  }
});

test("the process chart has three outcomes of review and the Physical Loadout comes from the upgrade step", async ({ page }) => {
  await page.goto("/");
  const outcomes = page.locator("#process .br2");
  await expect(outcomes).toHaveCount(1);
  await expect(outcomes.locator(".cn")).toHaveText(["Ore to spend", "Track XP to keep", "Digital Loadout"]);
  await expect(outcomes).not.toContainText("Physical Loadout");
  const upgrade = page.locator("#process .fl > .fn").filter({ hasText: "Choose your next upgrade" });
  await expect(upgrade).toContainText("Physical Loadout");
});

test("caveats stay next to the claims they qualify after the copy cuts", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#project-fit")).toContainText("not guaranteed approvals");
  await expect(page.locator("#shop")).toContainText("None are available to order yet");
  await expect(page.locator("#custom-orders")).toContainText("Custom Order requests are not open yet");
});

test("Track XP and levels follow main: five stops, requisition markers and arrows between them", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const rail = page.getByRole("group", { name: "Field Requisition milestones" });
  await expect(rail.locator(".st")).toHaveCount(5);
  await expect(rail.locator(".st .cn")).toHaveText(["LV.3", "LV.6", "LV.9", "LV.12", "LV.15"]);
  await expect(rail.locator(".st .dsc")).toHaveText(["Requisition I", "Requisition I", "Requisition II", "Requisition II", "Master Requisition"]);
  await expect(rail.locator(".st .bd use")).toHaveCount(5);
  const marker = await rail.locator(".bd").first().boundingBox();
  expect([marker!.width, marker!.height]).toEqual([64, 64]);
  await expect(rail.locator(".st").first()).toHaveCSS("text-align", "center");
  const arrow = await rail.locator(".st").first().evaluate((element) => { const style = getComputedStyle(element, "::after"); return { content: style.content, clip: style.clipPath, height: style.height }; });
  expect(arrow.content).toBe('""');
  expect(arrow.clip).toContain("polygon");
  expect(arrow.height).toBe("10px");
  expect(await rail.locator(".st").last().evaluate((element) => getComputedStyle(element, "::after").content)).toBe("none");
});

test("the first site's animations are present: ore nudge, era and IRL entrances", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator("#process .ic.nudge")).toHaveCSS("animation-name", "ore-nudge");
  await expect(page.locator("#eras .era > div + div").first()).toHaveCSS("animation-name", "era-connector-enter");
  await expect(page.locator("#loadout-irl .asd")).toHaveCSS("animation-name", "irl-status-enter");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#process .ic.nudge")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".scenery")).toHaveCount(0);
});

test("the logo is the miner's helmet mark with the Jersey 10 name", async ({ page }) => {
  await page.goto("/");
  const logo = page.locator(".nav a.logo");
  await expect(logo.locator(".lg-mark svg path")).toHaveCount(4);
  await expect(logo.locator(".lg-text")).toHaveText("LOADOUT");
  const mark = await logo.locator(".lg-mark svg").boundingBox();
  expect([mark!.width, mark!.height]).toEqual([24, 24]);
  await expect(logo.locator(".lg-a")).toHaveCSS("fill", "rgb(94, 158, 244)");
  await expect(logo.locator(".lg-c")).toHaveCSS("fill", "rgb(233, 235, 231)");
  await page.locator("label.tg").click();
  await expect(logo.locator(".lg-a")).toHaveCSS("fill", "rgb(227, 194, 107)");
  await expect(logo.locator(".lg-c")).toHaveCSS("fill", "rgb(251, 243, 228)");
});

test("the logo's lamp blinks on hover, and holds still for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const logo = page.locator(".nav a.logo");
  const lamp = logo.locator(".lg-lamp");
  await expect(lamp).toHaveCSS("animation-name", "none");
  await logo.hover();
  await expect(lamp).toHaveCSS("animation-name", "lg-lamp");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(5, 5);
  await logo.hover();
  await expect(lamp).toHaveCSS("animation-name", "none");
});

test("the page advertises the share image, the touch icon and the favicon", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  for (const [attribute, name] of [["property", "og:image"], ["name", "twitter:image"]]) {
    const url = await page.locator(`meta[${attribute}="${name}"]`).first().getAttribute("content");
    expect(url, name).toBeTruthy();
    const parsed = new URL(url!);
    const response = await request.get(parsed.pathname + parsed.search);
    expect(response.status(), name).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/jpeg");
    expect((await response.body()).length, `${name} stays under 300 KB`).toBeLessThan(300_000);
  }
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /icon\.svg/);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});
