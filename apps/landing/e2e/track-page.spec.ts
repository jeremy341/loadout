import { expect, test, type Page } from "@playwright/test";

// The track page level strip: the coupon captions live in their own wrapping grid, so no two labels can overlap at any width.
// (Before, the LV.18 and LV.20 captions were placed under their cells and collided at 1440.)
// Local development opens as the builder test account.

type Box = { name: string; left: number; right: number; top: number; bottom: number };

async function boxes(page: Page, selector: string, label: string): Promise<Box[]> {
  return page.locator(selector).evaluateAll(
    (nodes, name) =>
      nodes.map((node, index) => {
        const rect = node.getBoundingClientRect();
        return { name: `${name} ${index + 1}`, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      }),
    label,
  );
}

function intersections(list: Box[]): string[] {
  const hits: string[] = [];
  for (let a = 0; a < list.length; a += 1) {
    for (let b = a + 1; b < list.length; b += 1) {
      const x = Math.min(list[a].right, list[b].right) - Math.max(list[a].left, list[b].left);
      const y = Math.min(list[a].bottom, list[b].bottom) - Math.max(list[a].top, list[b].top);
      if (x > 0.5 && y > 0.5) hits.push(`${list[a].name} overlaps ${list[b].name}`);
    }
  }
  return hits;
}

for (const [width, height] of [[1440, 900], [1024, 800], [390, 844], [320, 700]] as const) {
  test(`no two labels on the Hardware level strip overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/dashboard/tracks/hardware");
    await expect(page.getByRole("heading", { level: 1, name: "Hardware" })).toBeVisible({ timeout: 30000 });
    const rewards = page.locator(".pf-strip-rewards li");
    await expect(rewards).toHaveCount(6);
    await expect(rewards.last()).toContainText("LV.20 / 275 H");
    await expect(rewards.last()).toContainText("10% coupon");
    await expect(rewards.last()).not.toContainText("Max level");

    const strip = (await boxes(page, ".pf-lvstrip", "strip"))[0];
    const items = await boxes(page, ".pf-strip-rewards li", "coupon caption");
    const numbers = await boxes(page, ".pf-strip-num", "cell number");
    const header = [...(await boxes(page, ".pf-strip-n", "level")), ...(await boxes(page, ".pf-strip-off-value", "discount"))];

    expect(intersections(items), "coupon captions").toEqual([]);
    expect(intersections(numbers), "cell numbers").toEqual([]);
    expect(intersections(header), "level and discount").toEqual([]);
    for (const box of [...items, ...numbers, ...header]) {
      expect(box.left, `${box.name} inside the strip`).toBeGreaterThanOrEqual(strip.left - 0.5);
      expect(box.right, `${box.name} inside the strip`).toBeLessThanOrEqual(strip.right + 0.5);
    }
    // The page itself does not scroll sideways.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("on a phone the twenty cells make two rows of ten, each wide enough to tap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/tracks/hardware");
  const cells = page.locator(".pf-strip-cell");
  await expect(cells).toHaveCount(20, { timeout: 30000 });
  const first = await cells.nth(0).boundingBox();
  const eleventh = await cells.nth(10).boundingBox();
  expect(eleventh!.y).toBeGreaterThan(first!.y + first!.height - 1);
  expect(Math.round(eleventh!.x)).toBe(Math.round(first!.x));
  for (const index of [0, 9, 10, 19]) {
    const box = await cells.nth(index).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(28);
    expect(box!.height).toBeGreaterThanOrEqual(36);
  }
});

// Deterministic edge cases for the track page. These only navigate and set a viewport, so they add no cookies,
// local storage or database rows and leave no state for later tests to clean up.
test.describe("track page edge cases", () => {
  const UNKNOWN_TRACK = "/dashboard/tracks/not-a-real-track";
  const NOT_FOUND_TITLE = "Sorry, you’ve hit rock bottom.";

  test("an unknown track slug is a real 404 with no track UI", async ({ page }) => {
    const response = await page.goto(UNKNOWN_TRACK);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: NOT_FOUND_TITLE })).toBeVisible({ timeout: 30000 });
    // The address is named once the client component hydrates, and the way back is still offered.
    await expect(page.getByRole("main")).toContainText(UNKNOWN_TRACK);
    await expect(page.getByRole("main")).toContainText("The only way back is up.");
    await expect(page.getByRole("link", { name: /back to the surface/i })).toHaveAttribute("href", "/");
    await expect(page.locator('meta[name="robots"][content="noindex"]')).toBeAttached();
    // A slug that resolves to no track never renders the track page, its switcher or a level strip.
    await expect(page.locator(".pf-track-page")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Switch track" })).toHaveCount(0);
    await expect(page.locator(".pf-lvstrip")).toHaveCount(0);
  });

  test("a track with no approved hours shows a not-started strip", async ({ page }) => {
    await page.goto("/dashboard/tracks/compute");
    await expect(page.getByRole("heading", { level: 1, name: "Compute" })).toBeVisible({ timeout: 30000 });
    // Compute's sample is 0 approved and 0 pending hours: LV.0, the first level is next, and no coupon is reached.
    await expect(page.locator(".pf-strip-n")).toHaveText("LV.0");
    await expect(page.locator(".pf-strip-max")).toHaveCount(0);
    await expect(page.locator(".pf-strip-next")).toHaveText("1 H to LV.1");
    await expect(page.locator(".pf-strip-hint")).toHaveCount(0);
    await expect(page.locator(".pf-strip-off-value")).toHaveText("0%");
    await expect(page.locator('.pf-strip-cells li[data-state="done"]')).toHaveCount(0);
    await expect(page.locator('.pf-strip-cells li[data-state="next"]')).toHaveCount(1);
    await expect(page.locator('.pf-strip-cells li[data-state="locked"]')).toHaveCount(19);
    const flags = page.locator(".pf-strip-rewards li");
    await expect(flags).toHaveCount(6);
    for (let index = 0; index < 6; index += 1) {
      await expect(flags.nth(index)).toHaveAttribute("data-reached", "false");
    }
  });

  test("the track switcher is a non-empty list whose links all lead to real tracks", async ({ page }) => {
    await page.goto("/dashboard/tracks/hardware");
    const expected = [
      { name: "Tools", slug: "tools", href: "/dashboard/tracks/tools" },
      { name: "Systems", slug: "systems", href: "/dashboard/tracks/systems" },
      { name: "Compute", slug: "compute", href: "/dashboard/tracks/compute" },
      { name: "Hardware", slug: "hardware", href: "/dashboard/tracks/hardware" },
    ];
    const switcher = page.getByRole("navigation", { name: "Switch track" }).getByRole("link");
    await expect(switcher).toHaveCount(4);
    await expect(switcher).toHaveText(expected.map((item) => item.name));
    const hrefs = await switcher.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
    expect(hrefs).toEqual(expected.map((item) => item.href));
    // Every listed slug resolves to a real track page rather than an empty list or a dead link.
    for (const item of expected) {
      await page.goto(item.href);
      await expect(page.getByRole("heading", { level: 1, name: item.name })).toBeVisible({ timeout: 30000 });
      await expect(page.locator(".pf-track-page")).toHaveAttribute("data-track", item.slug);
    }
  });

  test("the track page does not scroll sideways at an extra-narrow 280px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 720 });
    await page.goto("/dashboard/tracks/hardware");
    await expect(page.getByRole("heading", { level: 1, name: "Hardware" })).toBeVisible({ timeout: 30000 });
    await expect(page.locator(".pf-strip-cell")).toHaveCount(20);
    await expect(page.locator(".pf-strip-rewards li")).toHaveCount(6);
    // The switcher and the level strip wrap instead of pushing the document wider than the viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const switcher = page.getByRole("navigation", { name: "Switch track" }).getByRole("link");
    await expect(switcher).toHaveCount(4);
    for (const link of await switcher.all()) {
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeInViewport({ ratio: 1 });
    }
    const back = page.getByRole("link", { name: /back to projects/i });
    await back.scrollIntoViewIfNeeded();
    await expect(back).toBeInViewport({ ratio: 1 });
  });
});
