import { expect, test } from "@playwright/test";
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
    await expect(page.locator("#process .fn")).toHaveCount(10);
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

test("the top ruler spans the page above the nav bar and is numbered in pixels", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const tick = page.locator(".home > .tick");
  await expect(tick).toHaveCount(1);
  const ruler = (await tick.boundingBox())!;
  const nav = (await page.locator(".nav").boundingBox())!;
  expect(ruler.y).toBe(0);
  expect(ruler.width).toBe(1440);
  expect(ruler.y + ruler.height).toBeLessThanOrEqual(nav.y);
  await expect(tick.locator("span").nth(2)).toHaveText("320");
  expect((await tick.locator("span").nth(2).boundingBox())!.x).toBe(320);
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

test("the dark theme is the warm charcoal", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".home")).toHaveCSS("background-color", "rgb(28, 25, 22)");
});

test("depth markers are tall strips with a large number", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const pit = page.locator(".pit").first();
  expect((await pit.boundingBox())!.height).toBeGreaterThanOrEqual(150);
  await expect(pit.locator("b")).toHaveCSS("font-size", "88px");
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
  expect(box).toBe("rgb(39, 35, 31)");
  for (const selector of ["#research", ".lgr", ".nav", "#process .fn", ".era > div"]) expect(await colour(selector)).toBe(box);
  await expect(page.locator("#tracks .card").first()).toHaveCSS("border-top-color", "rgba(239, 230, 212, 0.28)");
  await expect(page.locator(".strata")).toHaveCSS("background-image", "none");
  await expect(page.locator("#process .lnks a").first()).toHaveCSS("color", "rgb(227, 168, 63)");
  await page.locator("label.tg").click();
  await expect(page.locator("#tracks .card").first()).toHaveCSS("border-top-color", "rgb(26, 23, 20)");
});
test("dark-mode icons use the sand of the RSVP button", async ({ page }) => {
  await page.goto("/");
  const rsvp = await page.locator(".nav-actions a.btn").evaluate((el) => getComputedStyle(el).backgroundColor);
  const fill = await page.locator("#tracks .card .ic").first().evaluate((el) => getComputedStyle(el).getPropertyValue("--ic-g").trim().toLowerCase());
  expect(fill).toBe("#dcc49c");
  expect(rsvp).toBe("rgb(220, 196, 156)");
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

test("one ruler runs down the left side, numbered in pixels, and none on the right", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const sides = page.locator(".home > .rl-side");
  await expect(sides).toHaveCount(1);
  const mark = sides.locator(".rl-major").first();
  await expect(mark).toHaveText("-800");
  expect(await mark.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)).toBe(800);
  expect((await sides.boundingBox())!.x).toBe(0);
});

test("the grain is a full-screen noise canvas that redraws and never takes input", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const grain = page.locator(".home > canvas.grain");
  await expect(grain).toHaveCount(1);
  await expect(grain).toHaveCSS("pointer-events", "none");
  await expect(grain).toHaveCSS("position", "fixed");
  await expect(grain).toHaveCSS("opacity", "0.2");
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

test("the docs have no rulers and use the Pixl layout: boxed sidebar, hard rules, block shadows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/start");
  await expect(page.locator(".docs .rl-top, .docs .rl-side")).toHaveCount(0);
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

test("Community Eras explain shared progression without leaking Era rules elsewhere", async ({ page }) => {
  await page.goto("/");
  const eras = page.locator("#eras");
  await expect(eras.getByRole("heading", { name: "Build the next Era together." })).toBeVisible();
  await expect(eras).not.toContainText("Planned community concept");
  await expect(eras).toContainText("A shared technical theme advanced by approved projects across the four tracks.");
  await expect(eras).toContainText("Approved projects");
  await expect(eras).toContainText("Shared Era Points");
  await expect(eras).toContainText("Next technical theme");
  await expect(eras).toContainText("+10%");
  await expect(eras).toContainText("Era Points are separate from Bolts and Track XP.");
  await expect(eras).toContainText("Planned rule");
  await expect(eras).not.toContainText(/Steam|Electrification|Computing|Networks|Acceleration|14 days|weekly reset|target|Season/i);
  for (const selector of ["#process", "#progression", "#loadout-irl"]) {
    await expect(page.locator(selector)).not.toContainText(/Era objectives|Era Points|Era changes/i);
  }
  const eraQuestion = page.getByRole("button", { name: "What are Community Eras?" });
  await eraQuestion.click();
  await expect(eraQuestion).toHaveAttribute("aria-expanded", "true");
  const eraFaq = page.locator(".fq2").filter({ hasText: "What are Community Eras?" });
  await expect(eraFaq).toContainText("An Era is a shared technical theme that approved projects help the community move forward.");
  await expect(eraFaq).not.toContainText(/14 days|weekly reset|target|\+10%/i);
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
