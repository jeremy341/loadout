import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The Shop hub and item page (design spec .ulpi/design/stardance-layout.md, section G). The builder test account opens without
// sign-in locally. Nothing can be ordered yet, so the page must say so and offer no way to buy.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const SHOP = "/dashboard/shop";

async function noSideScroll(page: Page, context: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, context).toBeLessThanOrEqual(1);
}

test("the hub opens on the top bar, discounts, the closed notice, categories and strips, then a paged list", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SHOP);
  await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeAttached({ timeout: 30000 });
  await expect(page.getByLabel("Search the shop")).toBeVisible();
  await expect(page.getByLabel("Your Ore")).toContainText("10 Ore per approved hour");

  const discounts = page.getByRole("list", { name: "Your level discount by track" });
  await expect(discounts.getByRole("link")).toHaveCount(4);
  await expect(discounts.getByRole("link", { name: /Tools.*\d(\.\d)?% off/ })).toHaveAttribute("href", "/dashboard/tracks/tools");
  await expect(page.getByText("Ordering opens in a later release. These are proposed items at draft prices.")).toBeVisible();

  const tiles = page.getByRole("navigation", { name: "Shop categories" }).getByRole("link");
  await expect(tiles).toHaveCount(5);
  await expect(tiles.nth(3)).toContainText("Hardware");
  await expect(tiles.nth(3)).toContainText("34 items");
  await expect(tiles.nth(4)).toContainText("General");

  // Recently added holds the last eight; Within reach is left out while the Ore balance is zero.
  const recent = page.getByRole("region", { name: "Recently added" });
  await expect(recent.locator(".pf-shop-card")).toHaveCount(8);
  await expect(page.getByRole("heading", { level: 2, name: "Within reach" })).toHaveCount(0);

  // The long list is 24 at a time, and Show more keeps what is shown.
  const all = page.getByRole("region", { name: "All items" });
  await expect(all.locator(".pf-shop-card")).toHaveCount(24);
  await expect(all.getByRole("status")).toHaveText("70 items.");
  await all.getByRole("link", { name: "Show more" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(all.locator(".pf-shop-card")).toHaveCount(48);
  await page.getByRole("link", { name: "Show more" }).click();
  await expect(all.locator(".pf-shop-card")).toHaveCount(70);
  await expect(page.getByRole("link", { name: "Show more" })).toHaveCount(0);

  // Nothing can be bought, and the wishlist star says why it does nothing.
  await expect(page.getByRole("button", { name: /buy|order|checkout/i })).toHaveCount(0);
  const star = page.getByRole("button", { name: "Add Raspberry Pi 5 to your wishlist" }).first();
  await expect(star).toHaveAttribute("aria-disabled", "true");
  await expect(star).toHaveAttribute("aria-pressed", "true");
  await expect(star).toHaveAccessibleDescription(/Wishlists open with the Shop release/);
  await expect(page.getByRole("button", { name: "Add Raspberry Pi Pico W to your wishlist" })).toHaveAttribute("aria-pressed", "false");
});

test("a category, a search and the affordable filter show the list alone, with the tag as its title", async ({ page }) => {
  await page.goto(`${SHOP}?tag=systems`);
  const all = page.getByRole("region", { name: "Systems" });
  await expect(all.locator(".pf-shop-card")).toHaveCount(16, { timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Shop categories" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Recently added" })).toHaveCount(0);
  await expect(all.getByRole("status")).toHaveText("16 items match.");
  const chips = page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link");
  await expect(chips).toHaveText(["All items", "Tools", "Systems", "Compute", "Hardware", "General"]);
  await expect(chips.nth(2)).toHaveAttribute("aria-current", "page");

  // A multi-track item shows under every track it relates to, and the best related track's discount applies.
  const pi = all.locator(".pf-shop-card").filter({ hasText: "Raspberry Pi 5" });
  await expect(pi).toHaveCount(1);
  await expect(pi).toContainText(/Was 490 now \d+/);
  await expect(all.locator(".pf-shop-card").filter({ hasText: "Framework 16 laptop" })).toHaveCount(1);

  await chips.nth(5).click();
  await expect(page).toHaveURL(/tag=general/);
  const general = page.getByRole("region", { name: "General" });
  await expect(general.locator(".pf-shop-card")).toHaveCount(10);
  await expect(general.locator(".pf-shop-card").first().locator("h3")).toHaveText("$50 technical conference grant");

  await page.goto(`${SHOP}?sort=high`);
  await expect(page.locator(".pf-shop-grid .pf-shop-card").first().locator("h3")).toHaveText("Framework 16 laptop", { timeout: 30000 });
  await page.goto(`${SHOP}?afford=1`);
  await expect(page.getByText(/Nothing you can afford yet/)).toBeVisible({ timeout: 30000 });
  await page.goto(`${SHOP}?q=zzzz`);
  await expect(page.getByText("No items match.")).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("status")).toHaveText("0 items match.");
  await page.getByRole("link", { name: "Clear the filters" }).click();
  await expect(page.locator(".pf-shop-grid .pf-shop-card")).toHaveCount(24);
});

test("typing in the search updates the list and the address, and the form works without script", async ({ page }) => {
  await page.goto(SHOP);
  const input = page.getByLabel("Search the shop");
  await expect(input).toBeVisible({ timeout: 30000 });
  await input.pressSequentially("oscilloscope");
  await expect(page).toHaveURL(/q=oscilloscope/, { timeout: 15000 });
  const grid = page.locator(".pf-shop-grid .pf-shop-card");
  await expect(grid).toHaveCount(1);
  await expect(grid).toContainText("Needs Hardware LV.8");
  await expect(page.getByRole("status")).toHaveText("1 item matches.");
  await expect(input).toHaveValue("oscilloscope");

  const plain = await page.context().newPage();
  await plain.goto(`${SHOP}?q=pico`);
  await expect(plain.locator(".pf-shop-grid .pf-shop-card").first()).toBeVisible({ timeout: 30000 });
  await plain.close();
});

test("an item page shows the price box, how the price is worked out, the closed order button and related items", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SHOP);
  await page.locator(".pf-shop-grid .pf-shop-card").filter({ hasText: "Hardware security key" }).getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1, name: "Hardware security key" })).toBeVisible({ timeout: 30000 });

  await page.goto(`${SHOP}/framework-12`);
  const price = page.getByRole("region", { name: "Your price" });
  await expect(price).toContainText("Base price1,260 Ore");
  await expect(price).toContainText(/Tools level discount−\d+(\.\d)?%/);
  await expect(price).toContainText(/You pay[\d,]+ Ore/);
  await expect(price).toContainText("With a Field Requisition this would be");
  await expect(price).toContainText("That is about");

  // The one call to action is a closed button with its reason; there is no way to buy.
  const order = page.getByRole("button", { name: "Order opens later" });
  await expect(order).toHaveAttribute("aria-disabled", "true");
  await expect(order).toHaveAccessibleDescription(/Ordering opens in a later release/);
  await expect(page.getByRole("button", { name: /buy|checkout/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add Framework 12 laptop to your wishlist" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("Wishlists open with the Shop release. Nothing is saved yet.")).toBeVisible();

  const related = page.getByRole("region", { name: "Related" });
  await expect(related.locator(".pf-shop-card")).toHaveCount(4);
  await expect(related.locator(".pf-shop-card").filter({ hasText: "Framework 12 laptop" })).toHaveCount(0);

  // The price box sits to the right of the photo at desktop width and stays in view as the page scrolls.
  const photo = await page.locator(".pf-shop-item-photo").boundingBox();
  const box = await price.boundingBox();
  expect(photo && box && box.x > photo.x + photo.width).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 400));
  const after = await price.boundingBox();
  expect(after && after.y >= 0 && after.y < 200).toBe(true);

  // A General item has no level discount and no Requisition.
  await page.goto(`${SHOP}/conference-grant`);
  await expect(page.getByRole("heading", { level: 1, name: /technical conference grant/ })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("region", { name: "Your price" })).toContainText("General itemNo discount");
  await expect(page.getByText(/With a Field Requisition/)).toHaveCount(0);

  // A gated item shows what it needs and still shows the price.
  await page.goto(`${SHOP}/oscilloscope`);
  await expect(page.getByRole("note")).toContainText(/Needs Hardware LV\.8\. \d+ more approved hours in Hardware to unlock it\./, { timeout: 30000 });
  await expect(page.getByRole("region", { name: "Your price" })).toContainText("Base price975 Ore");
  await expect(page.getByText("Photo: Draconichiaro, CC BY-SA 4.0, via")).toBeVisible();

  await page.goto(`${SHOP}/flipper-zero`);
  await expect(page.getByRole("heading", { level: 1, name: "Flipper Zero" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/^Photo: /)).toHaveCount(0);

  const response = await page.goto(`${SHOP}/not-an-item`);
  expect(response?.status()).toBe(404);
});

test("on a phone the hub is rows, not one tall column, and nothing scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(SHOP);
  await expect(page.getByLabel("Search the shop")).toBeVisible({ timeout: 30000 });
  await noSideScroll(page, "hub at 390");
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(height).toBeLessThan(6000);
  const first = await page.locator(".pf-shop-grid .pf-shop-card").first().boundingBox();
  expect(first && first.height).toBeLessThan(180);
  for (const path of [`${SHOP}?tag=hardware`, `${SHOP}/framework-12`, `${SHOP}/oscilloscope`, `${SHOP}?q=zzzz`]) {
    await page.goto(path);
    await expect(page.getByRole("status").or(page.getByRole("link", { name: "Back to Shop" })).first()).toBeVisible({ timeout: 30000 });
    await noSideScroll(page, path);
  }
  // The rail has no arrows on a phone: it scrolls by touch.
  await page.goto(SHOP);
  await expect(page.getByRole("button", { name: "Scroll Recently added right" })).toBeHidden();
});

test("the strip arrows scroll a rail and are disabled at its ends", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(SHOP);
  const left = page.getByRole("button", { name: "Scroll Recently added left" });
  const right = page.getByRole("button", { name: "Scroll Recently added right" });
  await expect(left).toBeDisabled({ timeout: 30000 });
  await expect(right).toBeEnabled();
  await right.click();
  await expect(left).toBeEnabled();
  for (let step = 0; step < 10; step += 1) {
    if (await right.isDisabled()) break;
    await right.click();
    // The strip scrolls, then the arrow state follows the scroll position, so give it a moment between presses.
    await page.waitForTimeout(150);
  }
  await expect(right).toBeDisabled({ timeout: 10000 });
});

for (const [width, height] of [
  [390, 844],
  [1440, 900],
] as const) {
  for (const scheme of ["dark", "light"] as const) {
    test(`the hub and an item page have no axe violations at ${width} in ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
      for (const path of [SHOP, `${SHOP}?tag=hardware`, `${SHOP}/oscilloscope`]) {
        await page.goto(path);
        await expect(page.getByRole("link", { name: "Back to Shop" }).or(page.getByLabel("Search the shop"))).toBeVisible({ timeout: 30000 });
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(result.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`), path).toEqual([]);
      }
    });
  }
}
