import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Expeditions, Referrals and Orders (Events lives in community.spec.ts, under the Community tabs). These pages are read-only fixtures, so no database state is needed beyond the
// local builder test account that opens the dashboard without sign-in (see platform.spec.ts).
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VIEWPORTS = [
  [375, 812],
  [1440, 900],
] as const;
const SCHEMES = ["dark", "light"] as const;
const PAGES = [
  "/dashboard/expeditions",
  "/dashboard/expeditions?track=tools&status=locked",
  "/dashboard/expeditions/profile-it",
  "/dashboard/expeditions/bare-metal",
  "/dashboard/referrals",
  "/dashboard/orders",
  "/dashboard/orders?tab=wishlist",
  "/dashboard/orders/lo-1057",
];
const CLOSED = "Nothing here is saved.";

async function setTheme(page: Page, width: number, height: number, scheme: (typeof SCHEMES)[number]) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
}

test("Expeditions groups ten missions by status, each with a track, its steps and a draft reward", async ({ page }) => {
  await page.goto("/dashboard/expeditions");
  await expect(page.getByRole("heading", { level: 1, name: "Expeditions" })).toBeAttached({ timeout: 30000 });
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveText([/^In progress/, /^Available/, /^Locked behind a prerequisite/, /^Done/]);
  await expect(page.locator(".ex-mission")).toHaveCount(10);
  const row = page.locator(".ex-mission").filter({ hasText: "Profile before you optimise" });
  await expect(row).toContainText("Tools");
  await expect(row).toContainText("2 of 4 steps");
  await expect(row).toContainText("Draft reward");
  await expect(page.getByText("every reward is a draft")).toBeVisible();
});

test("a locked expedition names what unlocks it, and nothing in the board is a world map", async ({ page }) => {
  await page.goto("/dashboard/expeditions");
  const row = page.locator(".ex-mission").filter({ hasText: "Design your first PCB" });
  await expect(row).toContainText("Locked until you finish First working circuit");
  await expect(page.locator("main").getByText(/restoration|npc|region/i)).toHaveCount(0);
});

test("the track and status filters live in the address and combine", async ({ page }) => {
  await page.goto("/dashboard/expeditions");
  await page.getByRole("navigation", { name: "Filter by track" }).getByRole("link", { name: "Hardware" }).click();
  await expect(page).toHaveURL(/\/dashboard\/expeditions\?track=hardware$/);
  await expect(page.locator(".ex-mission")).toHaveCount(2);
  await page.getByRole("navigation", { name: "Filter by status" }).getByRole("link", { name: "Locked" }).click();
  await expect(page).toHaveURL(/track=hardware&status=locked$/);
  await expect(page.locator(".ex-mission")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Filter by track" }).getByRole("link", { name: "Hardware" })).toHaveAttribute("aria-current", "page");
});

test("a filter with no matches says so and offers a way back", async ({ page }) => {
  await page.goto("/dashboard/expeditions?track=compute&status=done");
  await expect(page.getByText("No expeditions match.")).toBeVisible({ timeout: 30000 });
  await page.getByRole("link", { name: "Clear the filters" }).click();
  await expect(page.locator(".ex-mission")).toHaveCount(10);
});

test("an unknown filter value is ignored", async ({ page }) => {
  await page.goto("/dashboard/expeditions?track=art&status=finished");
  await expect(page.locator(".ex-mission")).toHaveCount(10, { timeout: 30000 });
});

test("an expedition lists its steps, prerequisites and submission, and cannot be submitted", async ({ page }) => {
  await page.goto("/dashboard/expeditions");
  await page.getByRole("link", { name: "Profile before you optimise" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Profile before you optimise" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".ex-step")).toHaveCount(4);
  await expect(page.locator('.ex-step[data-state="done"]')).toHaveCount(2);
  await expect(page.locator('.ex-step[data-state="current"]')).toHaveCount(1);
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveText(["Steps", "Prerequisites", "Reward", "Submission"]);
  await expect(page.getByRole("link", { name: "Build your first tool" })).toBeVisible();
  const submit = page.getByRole("button", { name: "Submit for review" });
  await expect(submit).toBeDisabled();
  await expect(page.getByText(`Missions open with the Expeditions release. ${CLOSED}`)).toBeVisible();
});

test("a locked expedition shows no current step and says what to finish first", async ({ page }) => {
  await page.goto("/dashboard/expeditions/bare-metal");
  await expect(page.getByRole("heading", { level: 1, name: "Bare metal boot" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.ex-step[data-state="current"]')).toHaveCount(0);
  await expect(page.locator("main").getByRole("note")).toContainText("Locked until you finish Speak a protocol");
});

test("an unknown expedition is a 404", async ({ page }) => {
  const response = await page.goto("/dashboard/expeditions/no-such-mission");
  expect(response?.status()).toBe(404);
});

test("Referrals shows the qualification steps, a disabled link and an honest empty list", async ({ page }) => {
  await page.goto("/dashboard/referrals");
  await expect(page.getByRole("heading", { level: 1, name: "Referrals" })).toBeAttached({ timeout: 30000 });
  const steps = page.getByRole("list", { name: "Steps before a referral counts" }).getByRole("listitem");
  await expect(steps).toHaveCount(5);
  await expect(steps.last()).toContainText("First approved ship");
  await expect(page.getByRole("textbox", { name: "Invite link" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Copy link" })).toBeDisabled();
  await expect(page.getByText("Referral links open with the platform release.")).toBeVisible();
  await expect(page.getByText("No referred builders yet")).toBeVisible();
  const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  expect(text).not.toMatch(/[€$£]/);
  expect(text).not.toMatch(/\d+\s*Ore/);
});

test("Referrals has no tab; Settings links to it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Participant" }).getByRole("link", { name: "Referrals" })).toHaveCount(0);
  await page.getByRole("link", { name: "Open Referrals" }).click();
  await expect(page).toHaveURL(/\/dashboard\/referrals$/);
});

test("Orders lists three sample orders and opens one", async ({ page }) => {
  await page.goto("/dashboard/orders");
  await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeAttached({ timeout: 30000 });
  const tabs = page.getByRole("navigation", { name: "Orders and wishlist" });
  await expect(tabs.getByRole("link", { name: /^Orders/ })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".ex-order")).toHaveCount(3);
  await expect(page.locator(".ex-order").filter({ hasText: "LO-1057" })).toContainText("Shipped");
  await page.getByRole("link", { name: "Order LO-1057" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Order LO-1057" })).toBeVisible({ timeout: 30000 });
  const strip = page.getByRole("list", { name: "Order progress" }).getByRole("listitem");
  await expect(strip).toHaveText([/Placed/, /Packed/, /Shipped/, /Delivered/]);
  await expect(page.locator('.ex-flow-step[data-state="done"]')).toHaveCount(2);
  await expect(page.locator('.ex-flow-step[data-state="active"]')).toContainText("Shipped");
  await expect(page.getByRole("link", { name: "Hot-swap mechanical keyboard" })).toHaveAttribute("href", "/dashboard/shop/mechanical-keyboard");
});

test("a delivered order has every step done", async ({ page }) => {
  await page.goto("/dashboard/orders/lo-1042");
  await expect(page.getByRole("heading", { level: 1, name: "Order LO-1042" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.ex-flow-step[data-state="done"]')).toHaveCount(4);
});

test("an unknown order is a 404", async ({ page }) => {
  const response = await page.goto("/dashboard/orders/lo-0000");
  expect(response?.status()).toBe(404);
});

test("the wishlist shows five shop items with prices, a lock note and disabled buttons", async ({ page }) => {
  await page.goto("/dashboard/orders?tab=wishlist");
  await expect(page.getByRole("navigation", { name: "Orders and wishlist" }).getByRole("link", { name: /^Wishlist/ })).toHaveAttribute("aria-current", "page", { timeout: 30000 });
  await expect(page.locator(".ex-wish")).toHaveCount(5);
  await expect(page.locator(".ex-wish").filter({ hasText: "Digital oscilloscope" })).toContainText("Needs Hardware LV.8");
  const remove = page.getByRole("button", { name: /^Remove / });
  await expect(remove).toHaveCount(5);
  for (const button of await remove.all()) await expect(button).toBeDisabled();
  await expect(page.getByRole("button", { name: "Add an item" })).toBeDisabled();
  await expect(page.getByText(`Ordering and wishlists open with the Shop release. ${CLOSED}`)).toBeVisible();
});

test("an unknown tab shows the orders", async ({ page }) => {
  await page.goto("/dashboard/orders?tab=cart");
  await expect(page.locator(".ex-order")).toHaveCount(3, { timeout: 30000 });
});

for (const path of PAGES) {
  for (const [width, height] of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      test(`${path} has no WCAG 2.2 AA violations or sideways scroll at ${width}px, ${scheme}`, async ({ page }) => {
        await setTheme(page, width, height, scheme);
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeAttached({ timeout: 30000 });
        // The title arrives with the page's metadata, a moment after the content; axe flags a missing title if it runs first.
        await expect(page).toHaveTitle(/- LOADOUT$/);
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }
}
