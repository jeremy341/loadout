import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { actAs, REVIEW_BASE } from "./reviewer-helpers";

// The reviewer site (review.<host>): a copy of Pixl's internal dashboard over sample data. Access by role is in reviewer-roles.spec.ts.
// The sample store lives in the server's memory and resets only when the server restarts, so nothing here counts rows or depends on a
// clean store: tests that change state either undo it or use text that is unique to the run.
test.use({ baseURL: REVIEW_BASE });
test.beforeEach(async ({ context }) => actAs(context, "owner"));

// Ship 2043 is a software ship of another builder with a possible undisclosed double dip; the owner (bellwether) may review it.
const DESK = "/review/2043";
const SHIP_LINKS = 'main a[href^="/review/"][aria-label]';

async function startReviewing(page: Page) {
  await page.goto(DESK);
  const start = page.getByRole("button", { name: "Start reviewing" });
  // A claim from an earlier run is still held in the sample store.
  await expect(start.or(page.getByText("Review claimed by you"))).toBeVisible();
  if (await start.isVisible()) await start.click();
  await expect(page.getByText("Review claimed by you")).toBeVisible();
}

const hrefs = (page: Page) => page.locator(SHIP_LINKS).evaluateAll((links) => links.map((a) => a.getAttribute("href")));

test.describe("the queue", () => {
  test("shows the review tabs and a table of ships", async ({ page }) => {
    await page.goto("/review");
    await expect(page).toHaveTitle(/LOADOUT Review/);
    for (const name of [/^Needs review/, /^Reviewed/, /^Stats/, /^Integrity reviews/, /^Proposed bans/, /^Spot check/, /^Reviewer log/, /^Audit notes/, /^Guidelines/]) {
      await expect(page.getByRole("tab", { name }).first()).toBeVisible();
    }
    await expect(page.getByRole("tab", { name: /^Needs review/ }).first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("columnheader", { name: "Maker" })).toBeVisible();
    await expect(page.locator(SHIP_LINKS).first()).toBeVisible();
  });

  test("pages with ?page and ?per", async ({ page }) => {
    await page.goto("/review?page=2&per=20");
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();
    const second = await hrefs(page);
    expect(second.length).toBeGreaterThan(0);
    await page.goto("/review?page=1");
    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
    const first = await hrefs(page);
    // The page size is the queue's own (Pixl fixes it); the per parameter is accepted and ignored.
    expect(first.length).toBeGreaterThan(0);
    await page.getByRole("link", { name: "Next" }).click();
    await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();
    expect(first.filter((href) => second.includes(href))).toEqual([]);
  });

  test("the owner switches between the software and hardware queues", async ({ page }) => {
    await page.goto("/review");
    const software = await hrefs(page);
    await page.getByRole("tab", { name: /^Hardware queue/ }).click();
    await expect(page).toHaveURL(/kind=hardware/);
    await expect(page.getByRole("tab", { name: /^Hardware queue/ })).toHaveAttribute("aria-selected", "true");
    const hardware = await hrefs(page);
    expect(hardware.length).toBeGreaterThan(0);
    expect(hardware.filter((href) => software.includes(href))).toEqual([]);
    await page.getByRole("tab", { name: /^Software queue/ }).click();
    await expect(page).not.toHaveURL(/kind=hardware/);
  });

  test("the type filter narrows the table to the chosen type", async ({ page }) => {
    await page.goto("/review");
    const games = page.locator('main a[href="/review?type=games"]');
    const expected = Number((await games.textContent())!.replace(/\D/g, ""));
    await games.click();
    await expect(page).toHaveURL(/type=games/);
    await expect(page.locator(SHIP_LINKS)).toHaveCount(expected);
    await page.locator('main a[href="/review"]', { hasText: "All types" }).click();
    await expect(page).not.toHaveURL(/type=/);
  });
});

test.describe("the review desk", () => {
  test("opens a ship with its one-track chip and the double-dip banner", async ({ page }) => {
    await page.goto(DESK);
    await expect(page.getByText("Tiny bytecode VM in Rust").first()).toBeVisible();
    await expect(page.getByText("#2043")).toBeVisible();
    await expect(page.getByText("Tools", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Possible undisclosed double dip")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start reviewing" }).or(page.getByText("Review claimed by you"))).toBeVisible();
  });

  test("start reviewing shows the one-track line, the live credit line and the verdict buttons", async ({ page }) => {
    await startReviewing(page);
    await expect(page.getByText(/All Track XP from this ship goes to this track/)).toBeVisible();
    const credit = page.getByText(/^Credit: \d+ Ore/);
    await expect(credit).toBeVisible();
    // Hours can only be lowered; the credit line follows without a save.
    await page.getByLabel("Hours to credit").fill("5");
    await expect(credit).toHaveText(/^Credit: 50 Ore/);
    await page.getByLabel("Hours to credit").fill("6");
    await expect(credit).toHaveText(/^Credit: 60 Ore/);
    for (const name of ["Approve", "Request changes", "Propose ban"]) {
      await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
    }
  });

  test("/track in the note expands to the reason for the ship's track", async ({ page }) => {
    await startReviewing(page);
    const note = page.getByPlaceholder(/Say what works/);
    // Typing before the page has hydrated is lost when React takes over, so type again until the shortcut expands.
    await expect(async () => {
      await note.fill("");
      await note.pressSequentially("/track ");
      await expect(note).toHaveValue(/does not fit the Tools track/, { timeout: 1500 });
    }).toPass({ timeout: 15000 });
    await expect(note).not.toHaveValue(/\/track/);
  });

  test("the review panel is sticky and its divider resizes with the arrow keys", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await startReviewing(page);
    const aside = page.locator("aside").filter({ hasText: "First pass" });
    await expect(aside).toHaveCSS("position", "sticky");
    const width = async () => (await aside.boundingBox())!.width;
    const divider = page.getByRole("separator", { name: "Resize the review panel" });
    const start = await width();
    await divider.focus();
    // The panel sits on the right, so ArrowLeft pulls the divider left and widens the panel.
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect.poll(width).toBeGreaterThan(start);
    const wide = await width();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect.poll(width).toBeLessThan(wide);
  });
});

test("the light and dark switch changes the theme and keeps it after a reload", async ({ page }) => {
  await page.goto("/review");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /^(Light|Dark)$/ });
  await expect(html).toHaveAttribute("data-display-theme", /^(light|dark)$/);
  const before = await html.getAttribute("data-display-theme");
  const after = before === "dark" ? "light" : "dark";
  await toggle.click();
  await expect(html).toHaveAttribute("data-display-theme", after);
  await expect(html).toHaveAttribute("data-theme", after);
  await page.reload();
  await expect(html).toHaveAttribute("data-display-theme", after);
  await expect(html).toHaveAttribute("data-theme", after);
});

test("a ban proposed on a builder page waits on Bans > Proposed with Withdraw and no Confirm for its proposer", async ({ page }) => {
  const reason = `E2E proposal ${Date.now()}`;
  let proposed = false;
  // A builder who is not banned and has no proposal waiting (an earlier aborted run may have left one).
  for (const id of ["u-tessel", "u-cinderreed", "u-gorsewren", "u-emberreed", "u-larchlark", "u-kelpmoth", "u-birchlark", "u-juniperwren"]) {
    await page.goto(`/players/${id}`);
    const propose = page.getByRole("button", { name: "Propose ban", exact: true });
    if (!(await propose.isEnabled())) continue;
    const form = page.locator("form").filter({ has: propose });
    await form.getByPlaceholder("Reason").fill(reason);
    await propose.click();
    await expect(page.getByRole("button", { name: "Ban proposed", exact: true })).toBeDisabled();
    proposed = true;
    break;
  }
  expect(proposed, "found a builder without a ban or proposal").toBe(true);

  await page.goto("/bans?tab=proposed");
  const row = page.getByRole("row").filter({ hasText: reason });
  await expect(row).toBeVisible();
  await expect(row.getByText("You proposed this")).toBeVisible();
  await expect(row.getByRole("button", { name: "Withdraw" })).toBeVisible();
  await expect(row.getByRole("button", { name: /Confirm/ })).toHaveCount(0);

  // Leave the sample store as it was.
  await row.getByRole("button", { name: "Withdraw" }).click();
  await expect(page.getByRole("row").filter({ hasText: reason })).toHaveCount(0);
});

test.describe("shop and fulfilment", () => {
  test("the shop prices items in Ore and has no regions", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "Shop", exact: true })).toBeVisible();
    await expect(page.getByText(/\d+ Ore/).first()).toBeVisible();
    await expect(page.getByText(/Base price \(Ore\)/).first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/region/i);
    await page.goto("/shop-detail");
    await expect(page.getByText(/Base price \(Ore\)/).first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/region/i);
  });

  test("the fulfilment stage bar names every stage", async ({ page }) => {
    await page.goto("/fulfillment");
    const bar = page.getByRole("navigation", { name: "Jump to an order stage" });
    for (const stage of ["New", "Claimed", "Packed", "Shipped", "Delivered", "Cancelled"]) {
      await expect(bar.getByRole("link", { name: new RegExp(`^${stage}\\s*\\d+`) })).toBeVisible();
    }
  });
});

test.describe("accessibility", () => {
  const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
  // Rules skipped because of markup copied from Pixl byte for byte (reviewer-dash/ADJUSTMENTS.md). Each entry needs the rule and the
  // reason. Serious and critical issues from any other source stay visible.
  //   color-contrast: Pixl's own palette. The brand red #ec3750 carries white text at 4.01:1 on the active nav link and count, the
  //     light-mode nav grey #8492a6 on #f9fafc is 3.02:1, and its info/danger badges and diff counts sit at 3.9 to 4.5:1. All come from
  //     the copied stylesheet (reviewer-dash/app/_ui/admin.css), not from LOADOUT markup. LOADOUT's own additions (the sample note and
  //     the light/dark switch) are still checked for contrast in the last test of this block.
  //   aria-required-attr: the resize divider on the desk is Pixl's ReviewSplit (role="separator", focusable) and has no aria-valuenow,
  //     which axe requires for a focusable separator. The copy keeps Pixl's markup; the arrow-key behaviour is covered above.
  const SKIPPED = ["color-contrast", "aria-required-attr"];

  for (const scheme of ["dark", "light"] as const) {
    for (const [name, path] of [["queue", "/review"], ["desk", DESK]] as const) {
      test(`the ${name} has no WCAG 2.2 AA violations in ${scheme}`, async ({ page }) => {
        await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
        await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-display-theme", scheme);
        await page.evaluate(() => document.fonts.ready);
        const result = await new AxeBuilder({ page }).withTags(TAGS).disableRules(SKIPPED).analyze();
        expect(result.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`)).toEqual([]);
      });
    }
  }
});

for (const scheme of ["dark", "light"] as const) {
  test(`the sample note and the light/dark switch, which are LOADOUT's own, keep their contrast in ${scheme}`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
    await page.goto("/review");
    await expect(page.locator("html")).toHaveAttribute("data-display-theme", scheme);
    const result = await new AxeBuilder({ page }).include(".reviewer-sample-note").include('button[title="Switch between light and dark"]').analyze();
    expect(result.violations.map((v) => `${v.id} (${v.impact})`)).toEqual([]);
  });
}

test.describe("a 390 px screen", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const [name, path] of [["queue", "/review"], ["desk", DESK]] as const) {
    test(`the ${name} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over).toBeLessThanOrEqual(0);
    });
  }
});
