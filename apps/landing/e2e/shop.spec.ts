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
  await expect(page.getByLabel("Your Ore")).toHaveCount(0);

  const discounts = page.getByRole("list", { name: "Your level discount by track" });
  await expect(discounts.getByRole("link")).toHaveCount(4);
  await expect(discounts.getByRole("link", { name: /Tools.*\d(\.\d)?% off/ })).toHaveAttribute("href", "/dashboard/tracks/tools");
  await expect(page.getByText("Ordering opens in a later release.")).toHaveCount(0);

  // The tag chips are always there, and the big category tiles are gone.
  await expect(page.getByRole("navigation", { name: "Shop categories" })).toHaveCount(0);
  const chips = page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link");
  await expect(chips).toHaveText(["All items", "Tools", "Systems", "Compute", "Hardware", "General"]);
  await expect(chips.first()).toHaveAttribute("aria-current", "page");

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

  // Nothing can be bought, and there is no wishlist star on a card.
  await expect(page.getByRole("button", { name: /buy|order|checkout|wishlist/i })).toHaveCount(0);
});

test("a category, a search and the affordable filter show the list alone, with the tag as its title", async ({ page }) => {
  await page.goto(`${SHOP}?tag=systems`);
  const all = page.getByRole("region", { name: "Systems" });
  await expect(all.locator(".pf-shop-card")).toHaveCount(16, { timeout: 30000 });
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

test("an item page shows the price box, how the price is worked out, the closed order button", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SHOP);
  await page.locator(".pf-shop-grid .pf-shop-card").filter({ hasText: "Hardware security key" }).getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1, name: "Hardware security key" })).toBeVisible({ timeout: 30000 });

  await page.goto(`${SHOP}/framework-12`);
  const price = page.getByRole("region", { name: "Your price" });
  await expect(price).toContainText("Base price1,260 Ore");
  await expect(price).toContainText(/Tools level discount−\d+(\.\d)?%/);
  await expect(price).toContainText(/You pay[\d,]+ Ore/);
  await expect(price).not.toContainText("With a Field Requisition this would be");
  await expect(price).toContainText("That is about");

  // The one call to action is a closed button with its reason; there is no way to buy.
  const order = page.getByRole("button", { name: "Order opens later" });
  await expect(order).toHaveAttribute("aria-disabled", "true");
  await expect(order).toHaveAccessibleDescription(/How prices are worked out/);
  await expect(page.getByRole("button", { name: /buy|checkout/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /wishlist/i })).toHaveCount(0);

  // The Related rail was removed on purpose.
  await expect(page.getByRole("region", { name: "Related" })).toHaveCount(0);

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
  await expect(page.getByRole("checkbox", { name: /Use a Field Requisition/ })).toHaveCount(0);
  await expect(page.getByText(/General items are open to everyone/)).toBeVisible();

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

test("the tag chips are not sticky, and scroll inside their own row on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SHOP);
  const nav = page.getByRole("navigation", { name: "Filter by tag" });
  await expect(nav).toBeVisible({ timeout: 30000 });
  // Not sticky on purpose: after a long scroll the chips have left the screen with the rest of the page head.
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(nav).not.toBeInViewport();
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(SHOP);
  await expect(nav).toBeVisible();
  await noSideScroll(page, "chips at 320");
  expect(await nav.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
});

// The cards in the first row of a grid, counted by their top offsets.
async function cardsInFirstRow(page: Page) {
  const tops = await page.locator(".pf-shop-grid .pf-shop-card").evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top + window.scrollY)));
  return tops.filter((top) => Math.abs(top - tops[0]) <= 2).length;
}

test("the grid shows four cards in a row at 1440, three at 900, two on a phone, all the same height", async ({ page }) => {
  test.setTimeout(180000);
  for (const [width, columns] of [
    [1440, 4],
    [1280, 4],
    [1100, 3],
    [900, 3],
    [700, 3],
    [471, 2],
    [390, 2],
    [320, 2],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(SHOP);
    await expect(page.locator(".pf-shop-grid .pf-shop-card").first()).toBeVisible({ timeout: 30000 });
    expect(await cardsInFirstRow(page), `cards per row at ${width}`).toBe(columns);
    // The column keeps the normal maximum width: the grid is never wider than 1080px.
    const gridWidth = await page.locator(".pf-shop-grid").evaluate((node) => node.getBoundingClientRect().width);
    expect(gridWidth, `grid width at ${width}`).toBeLessThanOrEqual(1080);
    const heights = await page.locator(".pf-shop-grid .pf-shop-card").evaluateAll((nodes, count) => nodes.slice(0, count).map((node) => Math.round(node.getBoundingClientRect().height)), columns);
    expect(new Set(heights).size, `card heights at ${width}`).toBe(1);
  }
});

test("nothing scrolls sideways from 320 to 1440 on the hub, a category, an empty search and an item", async ({ page }) => {
  test.setTimeout(240000);
  for (const width of [320, 390, 471, 700, 900, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [SHOP, `${SHOP}?tag=hardware`, `${SHOP}?q=zzzz`, `${SHOP}/framework-12`, `${SHOP}/oscilloscope`]) {
      await page.goto(path);
      await expect(page.getByRole("status").or(page.getByRole("link", { name: "Back to Shop" })).first()).toBeVisible({ timeout: 30000 });
      await noSideScroll(page, `${path} at ${width}`);
    }
  }
  // The rail has no arrows on a phone: it scrolls by touch.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(SHOP);
  await expect(page.getByRole("button", { name: "Scroll Recently added right" })).toBeHidden();
});

test("a card shows the photo, kind, name, tags, price, discount, hours and lock", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${SHOP}?q=oscilloscope`);
  const card = page.locator(".pf-shop-grid .pf-shop-card").first();
  await expect(card).toContainText("Needs Hardware LV.8", { timeout: 30000 });
  await expect(card.locator(".pf-shop-kind")).toBeVisible();
  await expect(card.locator("h3")).toBeVisible();
  await expect(card.locator(".pf-shop-tags")).toBeVisible();
  await expect(card.locator(".pf-shop-hours")).toContainText("H of work");
  await page.goto(`${SHOP}?q=framework 12`);
  await expect(page.locator(".pf-shop-grid .pf-shop-card").first().locator(".pf-shop-off")).toContainText(/−\d+(\.\d)?%/, { timeout: 30000 });
});

test("a builder with Tools past LV.5 can choose a Field Requisition on a Tools item", async ({ page }) => {
  // The seed hours put Tools at 58 approved hours, LV.8: the LV.5 and LV.8 coupons, so two requisitions.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${SHOP}/framework-12`);
  const box = page.getByRole("checkbox", { name: "Field Requisition (2)" });
  await expect(box).toBeVisible({ timeout: 30000 });
  await expect(box).not.toBeChecked();
  const price = page.getByRole("region", { name: "Your price" });
  await expect(price).toContainText("Nothing is ordered yet. Your choice is shown only.");
  const before = Number(((await price.locator(".pf-shop-total dd").innerText()).match(/[\d,]+/) ?? ["0"])[0].replace(/,/g, ""));

  await box.click();
  await expect(page).toHaveURL(/requisition=1/);
  await expect(price).toContainText(/Field Requisition\s*−10%/);
  await expect(price).toContainText(/You save [\d,]+ Ore more with the requisition\./);
  const after = Number(((await price.locator(".pf-shop-total dd").innerText()).match(/[\d,]+/) ?? ["0"])[0].replace(/,/g, ""));
  expect(after).toBeLessThan(before);
  expect(before - after).toBe(126);

  // The link works on a fresh load, and the order button stays closed.
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /^Field Requisition/ })).toBeChecked();
  await expect(page.getByRole("button", { name: "Order opens later" })).toHaveAttribute("aria-disabled", "true");

  // Other items give their one reason in plain words.
  await page.goto(`${SHOP}/oscilloscope`);
  await expect(page.getByText("This item is in another track.")).toBeVisible({ timeout: 30000 });
  await page.goto(`${SHOP}/usb-c-dock`);
  await expect(page.getByText("Requisitions need an item of 400 Ore or more.")).toBeVisible({ timeout: 30000 });
  await page.goto(`${SHOP}/framework-16?requisition=1`);
  await expect(page.getByRole("checkbox", { name: /^Field Requisition \(2\)/ })).toBeVisible({ timeout: 30000 });
});

const SHOTS = "C:/Users/jerem/AppData/Local/Temp/loadout-shots";
for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`requisition screenshots at ${width} in dark`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await page.addInitScript(() => localStorage.setItem("loadout-theme", "dark"));
    for (const [name, path] of [
      ["level", `${SHOP}/framework-12`],
      ["using", `${SHOP}/framework-12?requisition=1`],
      ["none", `${SHOP}/oscilloscope`],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole("region", { name: "Your price" })).toBeVisible({ timeout: 30000 });
      await page.getByRole("region", { name: "Your price" }).scrollIntoViewIfNeeded();
      await page.evaluate(() => document.querySelector(".pf-shop-buy")?.scrollIntoView({ block: "start" }));
      await page.screenshot({ path: `${SHOTS}/requisition-${name}-${width}.png` });
    }
  });
}
for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  for (const scheme of ["dark", "light"] as const) {
    test(`screenshots of the hub and an item at ${width} in ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
      await page.goto(SHOP);
      await expect(page.locator(".pf-shop-grid .pf-shop-card").first()).toBeVisible({ timeout: 30000 });
      await page.screenshot({ path: `${SHOTS}/shop-hub-${width}-${scheme}.png` });
      await page.goto(`${SHOP}?tag=hardware`);
      await expect(page.locator(".pf-shop-grid .pf-shop-card").first()).toBeVisible({ timeout: 30000 });
      await page.screenshot({ path: `${SHOTS}/shop-list-${width}-${scheme}.png` });
      await page.goto(`${SHOP}/oscilloscope`);
      await expect(page.getByRole("heading", { level: 1, name: /oscilloscope/i })).toBeVisible({ timeout: 30000 });
      await page.screenshot({ path: `${SHOTS}/shop-item-${width}-${scheme}.png` });
    });
  }
}

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

// Deterministic edge cases. These tests only navigate and read the page: no storage, no screenshots and no
// persistent state, so each one cleans up when Playwright closes its page.
test("a tag with no matches keeps the category heading and clears back to the full list", async ({ page }) => {
  await page.goto(`${SHOP}?tag=hardware&q=zzzz`);
  const list = page.getByRole("region", { name: "Hardware" });
  await expect(list).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("status")).toHaveText("0 items match.");
  await expect(page.getByText("No items match.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Recently added" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Within reach" })).toHaveCount(0);
  const chips = page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link");
  await expect(chips.nth(4)).toHaveAttribute("aria-current", "page");

  await page.getByRole("link", { name: "Clear the filters" }).click();
  await expect(page).toHaveURL(/\/dashboard\/shop$/);
  await expect(page.locator(".pf-shop-grid .pf-shop-card")).toHaveCount(24);
});

test("an unknown tag or page value is ignored rather than breaking the hub", async ({ page }) => {
  await page.goto(`${SHOP}?tag=not-a-category`);
  await expect(page.getByRole("heading", { level: 2, name: "All items" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("status")).toHaveText("70 items.");
  const chips = page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link");
  await expect(chips.first()).toHaveAttribute("aria-current", "page");

  // A page past the end shows the whole catalog once, with no link to a further page.
  await page.goto(`${SHOP}?page=999`);
  await expect(page.getByRole("status")).toHaveText("70 items.", { timeout: 30000 });
  await expect(page.locator(".pf-shop-grid .pf-shop-card")).toHaveCount(70);
  await expect(page.getByRole("link", { name: "Show more" })).toHaveCount(0);
});

test("a requisition link on an ineligible item is ignored and its choice stays blocked", async ({ page }) => {
  // Four different reasons, each checked with ?requisition=1 in the address: the link never changes the price.
  const cases = [
    { id: "usb-c-dock", total: "You pay90 Ore", reason: "Requisitions need an item of 400 Ore or more." },
    { id: "oscilloscope", total: "You pay974 Ore", reason: "This item is in another track." },
    { id: "mac-mini", total: "You pay1,365 Ore", reason: "This item is in another track." },
    { id: "conference-grant", total: "You pay115 Ore", reason: "General items are open to everyone" },
  ] as const;
  for (const { id, total, reason } of cases) {
    await page.goto(`${SHOP}/${id}?requisition=1`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
    const price = page.getByRole("region", { name: "Your price" });
    await expect(price).toContainText(total);
    await expect(price.locator(".pf-shop-lines dt").filter({ hasText: "Field Requisition" })).toHaveCount(0);
    // Every item renders the Field Requisition option; ineligible ones show it disabled with the reason.
    const checkbox = price.getByRole("checkbox");
    await expect(checkbox).toBeDisabled();
    await expect(checkbox).not.toBeChecked();
    await expect(price).toContainText(reason);
  }
});

test("prices keep thousands separators, the minus sign and one-decimal discounts", async ({ page }) => {
  // The largest draft price, so both the grouping and the rounded-down discount are visible.
  await page.goto(`${SHOP}/framework-16`);
  const price = page.getByRole("region", { name: "Your price" });
  await expect(price).toContainText("Base price2,915 Ore", { timeout: 30000 });
  await expect(price).toContainText("Tools level discount−4.8%");
  await expect(price).toContainText("You pay2,775 Ore");
  await expect(price).toContainText("That is about 277.5 approved hours of work.");
  await expect(price.locator(".pf-shop-was")).toContainText("2,915");

  // The requisition uses the same grouping and the plain minus sign.
  await page.getByRole("checkbox", { name: "Field Requisition (2)" }).click();
  await expect(page).toHaveURL(/requisition=1/);
  await expect(price).toContainText("Field Requisition−10%");
  await expect(price).toContainText("You pay2,484 Ore");
  await expect(price).toContainText("You save 291 Ore more with the requisition.");

  // A General item is at full price: no struck-through amount and no discount line.
  await page.goto(`${SHOP}/meta-quest-3`);
  const general = page.getByRole("region", { name: "Your price" });
  await expect(general).toContainText("Base price1,150 Ore", { timeout: 30000 });
  await expect(general).toContainText("General itemNo discount");
  await expect(general).toContainText("You pay1,150 Ore");
  await expect(general).toContainText("That is about 115 approved hours of work.");
  await expect(general.locator(".pf-shop-was")).toHaveCount(0);
});
