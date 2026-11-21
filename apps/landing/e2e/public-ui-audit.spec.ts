import { expect, test, type Page } from "@playwright/test";

// Public UI audit pass: the Review Queue visitor frame, the Docs tables on phones, the Accessibility tab and the one-track copy.
// Local development opens as a signed-in test account, so the "visitor" preview cookie asks for the public frame.
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "loadout_preview_role", value: "visitor", url: baseURL ?? "http://localhost:3001" }]);
});

const now = Date.now();
const row = (id: number, name: string, owner: string, type: string) => ({
  id, name, owner_name: owner, project_type: type,
  wait_start: new Date(now - id * 3_100_000).toISOString(), shipped_at: new Date(now - id * 9_000_000).toISOString(),
});
const snapshot = {
  generated_at: new Date(now).toISOString(),
  reviewed_24h: { approved: 10, needs_changes: 8 },
  queues: {
    software: { waiting: [row(101, "Sync engine", "ada", "software"), row(102, "Ray tracer", "linus", "software")], final_checks: [row(90, "Package manager", "dennis", "software")] },
    hardware: { waiting: [row(201, "Sensor board", "mae", "hardware")], final_checks: [] },
  },
};

async function openQueue(page: Page, width: number, reading = "100") {
  await page.addInitScript((size) => { try { localStorage.setItem("loadout-reading-size", size); } catch { /* storage may be blocked */ } }, reading);
  await page.route("**/api/review/queue", (route) => route.fulfill({ json: snapshot }));
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/review-queue");
  await expect(page.getByRole("button", { name: /^Software/ })).toBeVisible();
}

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

test.describe("Review Queue, visitor frame", () => {
  for (const [width, reading] of [[1440, "100"], [390, "100"], [390, "200"], [320, "100"]] as const) {
    test(`header links, search first and a clear Accessibility tab at ${width}px, ${reading}% text`, async ({ page }) => {
      await openQueue(page, width, reading);
      const header = page.locator(".pf-top");
      await expect(header.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
      await expect(header.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
      const next = page.getByRole("navigation", { name: "Next steps" });
      await expect(next.getByRole("link", { name: "How review works" })).toHaveAttribute("href", "/docs/review");
      await expect(next.getByRole("link", { name: "Back to LOADOUT" })).toHaveAttribute("href", "/");

      // The search comes before the overview, and the tab lives in the header row, clear of the title.
      const searchBox = await page.getByRole("searchbox", { name: "Find your project" }).boundingBox();
      const overview = await page.locator(".pf-rq-pipeline").boundingBox();
      expect(searchBox && overview && searchBox.y < overview.y).toBe(true);
      const tab = await page.locator(".a11y-tab").boundingBox();
      const title = await page.getByRole("heading", { level: 1, name: "Review Queue" }).boundingBox();
      const headerBox = await header.boundingBox();
      expect(tab && title && headerBox).toBeTruthy();
      expect(overlaps(tab!, title!)).toBe(false);
      expect(tab!.y + tab!.height).toBeLessThanOrEqual(headerBox!.y + headerBox!.height + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });

    test(`the queue toggles share one size at ${width}px, ${reading}% text`, async ({ page }) => {
      await openQueue(page, width, reading);
      const boxes = await page.locator(".pf-rq-switch button").evaluateAll((buttons) => buttons.map((button) => {
        const { width: w, height: h } = button.getBoundingClientRect();
        return { w: Math.round(w), h: Math.round(h) };
      }));
      expect(boxes).toHaveLength(2);
      expect(boxes[0]).toEqual(boxes[1]);
    });
  }

  test("the retracted tab never slides over the content while scrolling a phone", async ({ page }) => {
    await openQueue(page, 390);
    await page.evaluate(() => { document.body.style.minHeight = "3000px"; window.scrollTo(0, 400); });
    await page.waitForTimeout(400);
    const tab = await page.locator(".a11y-tab").boundingBox();
    const main = await page.locator("main").boundingBox();
    expect(tab && main).toBeTruthy();
    expect(tab!.y + tab!.height).toBeLessThanOrEqual(0 + 1); // scrolled out with the header, never over the reading column
  });

  test("search, shortcut, result and the Software and Hardware toggle keep working", async ({ page }) => {
    await openQueue(page, 1440);
    await page.keyboard.press("/");
    await expect(page.getByRole("searchbox", { name: "Find your project" })).toBeFocused();
    await page.keyboard.type("sync");
    await expect(page.getByText("#1 of 2 in the software queue")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("searchbox", { name: "Find your project" })).toHaveValue("");
    const hardware = page.getByRole("button", { name: /^Hardware/ });
    await hardware.click();
    await expect(hardware).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Sensor board")).toBeVisible();
  });
});

test("Docs tables show a labelled block per row on a phone and break no words", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/tracks");
  const table = page.locator(".doc-content table").first();
  await expect(table).toHaveAttribute("role", "table");
  const labels = await table.locator("tbody td:not(:first-child)").evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-label")));
  expect(labels.length).toBeGreaterThan(0);
  expect(labels.every(Boolean)).toBe(true);
  const broken = await table.locator("td").evaluateAll((cells) => cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).length);
  expect(broken).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  // Words stay whole: no cell is narrower than its longest word.
  const tooNarrow = await table.locator("td").evaluateAll((cells) => cells.filter((cell) => {
    const longest = Math.max(...(cell.textContent ?? "").split(/\s+/).map((word) => word.length));
    return cell.getBoundingClientRect().width < longest * 6;
  }).length);
  expect(tooNarrow).toBe(0);
});

test("Docs keep the Accessibility tab clear of the guide links on wide screens", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/tracks");
  const tab = await page.locator(".a11y-tab").boundingBox();
  expect(tab).toBeTruthy();
  const links = await page.locator(".docs-nav .section-link, .docs-nav .docs-guides-link").evaluateAll((items) =>
    items.map((item) => { const r = item.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }));
  expect(links.some((link) => link.height > 0 && overlaps(tab!, link))).toBe(false);
});

test("the homepage hero markings clear the Accessibility tab on phones", async ({ page }) => {
  for (const width of [390, 700]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.waitForTimeout(1500);
    const tab = await page.locator(".a11y-tab").boundingBox();
    const marking = await page.locator(".hero .meta-left").boundingBox();
    expect(tab && marking).toBeTruthy();
    expect(overlaps(tab!, marking!)).toBe(false);
  }
  await page.setViewportSize({ width: 340, height: 600 });
  await page.goto("/");
  await expect(page.locator(".hero .meta-left")).toBeHidden();
});

test("the public pages describe one track per project", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#tracks .lead")).toContainText("one track");
  await expect(page.locator("#tracks")).not.toContainText("more than one");
  await page.goto("/docs/tracks");
  const body = page.locator(".doc-content");
  await expect(page.locator(".doc-content > p").first()).toContainText("two projects, each with its own track");
  await expect(body).not.toContainText("Tell us about both");
});
