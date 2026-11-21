import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Builder profiles (own and public), the account control and the Explore handle changes. Local development opens as the
// builder test account (handle test_builder). Seeded builders: juniper_dev, kestrel, pixel-fox, bolt_nine. The test account
// "none" has no handle. Needs the local database with `bun run db:seed:local`.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const SHOTS = process.env.LOADOUT_SHOT_DIR ?? "C:/Users/jerem/AppData/Local/Temp/loadout-shots";
mkdirSync(SHOTS, { recursive: true });
const NO_HANDLE = { name: "loadout_preview_role", value: "none", url: "http://localhost:3010" };

async function expectTrackLevels(card: Locator) {
  const rows = card.locator("li.pf-sp-level");
  await expect(rows).toHaveCount(4);
  const names = ["Tools", "Systems", "Compute", "Hardware"];
  for (let i = 0; i < 4; i++) {
    await expect(rows.nth(i).locator(".pf-sp-level-name")).toHaveText(names[i]);
    await expect(rows.nth(i).locator(".pf-sp-level-lv")).toHaveText(/^LV\.\d+ of 20$/);
    await expect(rows.nth(i).locator(".pf-sp-level-hours")).toHaveText(/^\d+ h approved$/);
    await expect(rows.nth(i)).toHaveAttribute("data-track", names[i].toLowerCase());
  }
}

async function asNoHandle(page: Page) {
  const base = process.env.LOADOUT_TEST_BASE_URL ?? `http://localhost:${process.env.LOADOUT_TEST_PORT ?? "3001"}`;
  await page.context().addCookies([{ ...NO_HANDLE, url: base }]);
}

test("own profile is the Stasis two columns: profile card and Activity on the left, Track levels and Projects on the right, no tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/profile");
  await expect(page.getByRole("heading", { level: 1, name: "test_builder" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("link", { name: "Back to Projects" })).toHaveAttribute("href", "/dashboard/projects");
  const card = page.locator(".pf-sp-profile");
  const cardBox = await card.boundingBox();
  expect(cardBox && Math.round(cardBox.width)).toBe(320);
  // left column: profile card, then Activity; right column: Badges, then Projects
  const activity = page.getByRole("region", { name: "Activity" });
  const badges = page.getByRole("region", { name: "Track levels" });
  const projects = page.getByRole("region", { name: "Projects" });
  const [a, b, p] = await Promise.all([activity.boundingBox(), badges.boundingBox(), projects.boundingBox()]);
  expect(a && a.y).toBeGreaterThan(cardBox ? cardBox.y + cardBox.height : 0);
  expect(a && a.x).toBe(cardBox?.x);
  expect(b && b.x).toBeGreaterThan(cardBox ? cardBox.x + cardBox.width : 0);
  expect(p && p.y).toBeGreaterThan(b ? b.y + b.height : 0);
  expect(b?.y).toBe(cardBox?.y);
  await expectTrackLevels(badges);
  await expect(page.getByText("No badges yet")).toHaveCount(0);
  // balance, buttons; nothing Stasis does not have; no tabs, no old header or rail, no name or email
  await expect(card.locator(".pf-sp-ore-label")).toHaveText("Ore");
  await expect(card.locator(".pf-sp-ore-figure")).toBeVisible();
  for (const gone of ["Top track", "Depth", "Joined"]) await expect(card.getByText(gone, { exact: true })).toHaveCount(0);
  await expect(page.getByText("Hours are self-reported")).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Edit profile" })).toBeVisible();
  await expect(card.getByRole("button", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await expect(page.getByText(/builder@loadout.test/)).toHaveCount(0);
  await expect(page.getByText("Test builder", { exact: true })).toHaveCount(0);
});

test("the old tab links go to the bare profile", async ({ page }) => {
  for (const old of ["journal", "toolbelt"]) {
    await page.goto(`/dashboard/profile?tab=${old}`);
    await expect(page).toHaveURL(/\/dashboard\/profile$/);
    await page.goto(`/dashboard/builders/juniper_dev?tab=${old}`);
    await expect(page).toHaveURL(/\/dashboard\/builders\/juniper_dev$/);
  }
});

test("Share copies the address and says Copied! for two seconds", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await page.goto("/dashboard/profile");
  const share = page.getByRole("button", { name: "Share" });
  await expect(share).toBeVisible({ timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await share.click();
  await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeAttached();
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible({ timeout: 5000 });
  const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
  if (copied !== null) expect(copied).toMatch(/\/dashboard\/profile$/);
});

test("the Activity heatmap is 12 weeks with five levels, a legend and a dark tooltip", async ({ page }) => {
  await page.goto("/dashboard/profile");
  const heatmap = page.locator(".pf-hm");
  await expect(heatmap).toBeVisible({ timeout: 30000 });
  await expect(heatmap.getByRole("heading", { level: 2, name: "Activity" })).toBeVisible();
  await expect(heatmap.getByText(/hrs$/)).toBeVisible();
  await expect(heatmap.locator(".pf-hm-col")).toHaveCount(13); // the weekday column and 12 weeks (the run is 80 days)
  await expect(heatmap.locator(".pf-hm-day").filter({ hasText: /^(Mon|Wed|Fri)$/ })).toHaveCount(3);
  await expect(heatmap.locator(".pf-hm-month").filter({ hasText: /^[A-Z][a-z]{2}$/ }).first()).toBeVisible();
  await expect(heatmap.locator("button.pf-hm-cell").first()).toHaveAttribute("aria-label", /\d{4}: (.* h logged|no hours logged)/);
  await expect(heatmap.locator(".pf-hm-legend")).toContainText(/Less.*More/);
  await expect(heatmap.locator(".pf-hm-legend .pf-hm-cell")).toHaveCount(5);
  const cell = heatmap.locator("button.pf-hm-cell").nth(60);
  await cell.hover();
  await expect(page.getByRole("tooltip")).toContainText(/\d{4}/);
  await expect(page.getByRole("tooltip")).toContainText(/logged|No activity/);
  await page.mouse.move(0, 0);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("one heatmap square is the tab stop, the arrows move it, and the page does not scroll sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/profile");
  await expect(page.locator(".pf-hm-scroll")).toBeVisible({ timeout: 30000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('button.pf-hm-cell[tabindex="0"]')).toHaveCount(1);
  const stop = page.locator('button.pf-hm-cell[tabindex="0"]');
  await stop.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  const before = await stop.getAttribute("aria-label");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('button.pf-hm-cell[tabindex="0"]')).not.toHaveAttribute("aria-label", before ?? "");
});

test("project covers carry no depth chip and the Ore balance is never negative", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/profile");
  await expect(page.locator(".pf-sp-ore-figure")).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".pf-sp-grid .pf-core-depth")).toHaveCount(0);
  await expect(page.locator(".pf-sp-grid .pf-sp-foot").first()).toContainText("H approved");
  const ore = (await page.locator(".pf-sp-ore-figure").innerText()).trim();
  expect(ore.startsWith("-") || ore.startsWith("−")).toBe(false);
});

test("Edit profile opens the dialog and saves the bio", async ({ page }) => {
  await page.goto("/dashboard/profile");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Edit profile" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  await expect(dialog).toBeVisible();
  const bio = dialog.getByRole("textbox", { name: /Bio/ });
  const before = await bio.inputValue();
  await bio.fill("Bio from the card.");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".pf-sp-profile").getByText("Bio from the card.")).toBeVisible();
  // restore
  await page.getByRole("button", { name: "Edit profile" }).click();
  await dialog.getByRole("textbox", { name: /Bio/ }).fill(before);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
});

test("the Projects card is one grid with no filter rows, and shows every project", async ({ page }) => {
  await page.goto("/dashboard/profile");
  const panel = page.getByRole("region", { name: "Projects" });
  await expect(panel.getByText("Draft Radio")).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Project status" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Filter by track" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Hide from profile|Show as building/ })).toHaveCount(0);
  await expect(panel.getByRole("link", { name: /Draft Radio/ })).toHaveAttribute("href", /\/dashboard\/projects\//);
});

test("a visitor sees the same cards and every project, but no private fields", async ({ page }) => {
  await page.goto("/dashboard/builders/juniper_dev");
  await expect(page.getByRole("heading", { level: 1, name: "juniper_dev" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("link", { name: "Back to Explore" })).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(0);
  for (const name of ["Activity", "Track levels", "Projects"]) await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Loadout" })).toHaveCount(0);
  await expectTrackLevels(page.getByRole("region", { name: "Track levels" }));
  // the Ore balance is public (as in Stasis); the pending line is for the owner only
  await expect(page.locator(".pf-sp-ore .pf-sp-ore-figure")).toBeVisible();
  await expect(page.locator(".pf-sp-ore-label")).toHaveText("Ore");
  expect(((await page.locator(".pf-sp-ore-figure").innerText()).trim()).startsWith("-")).toBe(false);
  await expect(page.getByText(/Ore pending review|[0-9]+ pending$/)).toHaveCount(0);
  // no picture is stored for the seeded builders, so the letter plate shows
  await expect(page.locator(".pf-sp-plate-letter")).toHaveText("J");
  await expect(page.locator(".pf-sp-photo")).toHaveCount(0);
  for (const gone of ["Top track", "Depth", "Joined"]) await expect(page.getByText(gone, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Edit profile|Edit bio/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pin to profile|Unpin|Hide from profile/ })).toHaveCount(0);
  // every project is public, drafts included: listed, and every card opens its public page
  const panel = page.getByRole("region", { name: "Projects" });
  await expect(panel.getByText("Notebook Sync")).toBeVisible();
  await expect(panel.getByRole("link", { name: /Notebook Sync/ })).toHaveAttribute("href", /\/dashboard\/explore\/seed-notebook-sync$/);
  await expect(panel.getByRole("link", { name: /Tinyparse/ })).toHaveAttribute("href", /\/dashboard\/explore\//);
  // project cards show pending and approved hours, never Ore
  await expect(panel.getByRole("link", { name: /Tinyparse/ })).toContainText("H pending");
  await expect(panel.getByRole("link", { name: /Tinyparse/ })).toContainText("H approved");
  await expect(panel.getByText(/\bOre\b/)).toHaveCount(0);
});

test("profile screenshots at 1440 and 390 in dark and light", async ({ page }) => {
  test.setTimeout(240_000);
  for (const scheme of ["dark", "light"] as const) {
    for (const [width, height] of [[1440, 900], [390, 844]] as const) {
      await page.setViewportSize({ width, height });
      for (const [name, path] of [["own", "/dashboard/profile"], ["visitor", "/dashboard/builders/juniper_dev"]] as const) {
        await page.goto(path);
        await page.evaluate((theme) => localStorage.setItem("loadout-theme", theme), scheme);
        await page.reload();
        await expect(page.locator("h1")).toBeVisible({ timeout: 30000 });
        await page.waitForLoadState("networkidle");
        await page.screenshot({ path: join(SHOTS, `profile-identity-${name}-${width}-${scheme}.png`), fullPage: true });
      }
    }
  }
});

test("own handle redirects to the own profile, mixed case to lower case, unknown handles are a 404", async ({ page }) => {
  await page.goto("/dashboard/builders/test_builder");
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await page.goto("/dashboard/builders/Juniper_Dev");
  await expect(page).toHaveURL(/\/dashboard\/builders\/juniper_dev$/);
  const response = await page.goto("/dashboard/builders/nobody_here_9");
  expect(response?.status()).toBe(404);
});

test("a builder without a handle is asked to choose one and the dialog explains each rule", async ({ page }) => {
  await asNoHandle(page);
  await page.goto("/dashboard/profile");
  await expect(page.getByRole("heading", { level: 1, name: "Your profile" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { level: 2, name: "Choose a handle" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit profile" })).toHaveCount(0);
  await page.locator(".pf-next").getByRole("button", { name: "Choose a handle" }).click();
  const dialog = page.getByRole("dialog", { name: "Choose a handle" });
  await expect(dialog).toBeVisible();
  const handle = dialog.getByRole("textbox", { name: "Handle" });
  await expect(handle).toBeFocused();
  const tries: [string, string][] = [
    ["", "Choose a handle."],
    ["ab", "Use 3 to 24 characters."],
    ["9lives", "Use a to z, 0 to 9, _ and - only. Start with a letter."],
    ["has space", "Use a to z, 0 to 9, _ and - only. Start with a letter."],
    ["admin", "That handle is not available."],
    ["kestrel", "That handle is taken. Try another."],
  ];
  for (const [value, message] of tries) {
    await handle.fill(value);
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog.getByText(message)).toBeVisible();
    await expect(handle).toHaveAttribute("aria-invalid", "true");
    await expect(handle).toBeFocused();
    await expect(handle).toHaveValue(value); // a rejected value is kept
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("saving the profile closes the dialog, says so and puts focus on the heading", async ({ page }) => {
  await page.goto("/dashboard/profile");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Edit profile" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  await expect(dialog.getByRole("textbox", { name: "Handle" })).toHaveValue("test_builder");
  await expect(dialog.getByText("Changing your handle changes your profile address.")).toBeVisible();
  await dialog.getByRole("textbox", { name: /Bio/ }).fill("The local test builder. Not a real person.");
  await expect(dialog.getByText("42 of 160")).toBeVisible();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "test_builder" })).toBeFocused();
});

test("the profile has no Pin control; a pinned project shows a pin glyph, and Pin and Unpin run in the project Settings tab", async ({ page }) => {
  await page.goto("/dashboard/profile");
  const panel = page.getByRole("region", { name: "Projects" });
  await expect(panel.getByRole("link", { name: /Cable Tidy/ })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: /^(Pin to profile|Unpin)$/ })).toHaveCount(0);
  await expect(panel.getByRole("link", { name: /Cable Tidy/ }).getByTestId("pinned-tag")).toBeVisible();
  await page.goto("/dashboard/projects/seed-cable-tidy?tab=settings");
  const unpin = page.getByRole("button", { name: "Unpin" });
  await expect(unpin).toBeVisible({ timeout: 30000 });
  await unpin.click();
  await expect(page.getByRole("status").filter({ hasText: "Unpinned Cable Tidy." })).toBeVisible();
  const pin = page.getByRole("button", { name: "Pin to profile" });
  await expect(pin).toBeVisible();
  await pin.click();
  await expect(page.getByRole("status").filter({ hasText: "Pinned Cable Tidy." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unpin" })).toBeVisible();
});

test("the account control opens, lists Profile and Settings, and closes on Escape and outside press", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/dashboard/projects");
  // The account control is in the top bar at the top right, so the drawer stays closed.
  const button = page.getByRole("button", { name: "Account" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  const panel = page.getByRole("navigation", { name: "Account" });
  await expect(panel.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/dashboard/profile");
  await expect(panel.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/dashboard/settings");
  const box = await panel.boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 390).toBe(true);
  await page.keyboard.press("Tab");
  await expect(panel.getByRole("link", { name: "Profile" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(button).toBeFocused();
  await button.press("Enter");
  await expect(panel).toBeVisible();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(panel).toBeHidden();
  await button.click();
  await panel.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await expect(panel).toBeHidden();
  await expect(page.locator(".pf-account-button")).toHaveAttribute("data-current", "true");
});

test("Explore shows handles, never display names, searches by handle and counts confirmed uses", async ({ page }) => {
  await page.goto("/dashboard/explore");
  // The card shows the author chip (a handle). The confirmed use count is on the project page, checked below.
  const card = page.locator(".pf-explore-card").filter({ hasText: "Tinyparse" });
  await expect(card).toContainText("juniper_dev", { timeout: 30000 });
  await expect(page.getByText("Sample Juniper")).toHaveCount(0);
  await page.goto("/dashboard/explore?q=kestrel");
  await expect(page.getByRole("link", { name: /Orbit Sim/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tinyparse/ })).toHaveCount(0);
  await page.goto("/dashboard/explore?q=Sample%20Kestrel");
  await expect(page.getByText("No projects match.")).toBeVisible();
});

test("the Explore detail links the builder, lists users and the tools a project equips", async ({ page }) => {
  await page.goto("/dashboard/explore/seed-tinyparse");
  await expect(page.getByRole("heading", { level: 1, name: "Tinyparse" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".pf-spp-by").getByRole("link", { name: "juniper_dev" })).toHaveAttribute("href", "/dashboard/builders/juniper_dev");
  await expect(page.getByRole("link", { name: /github\.com\/example-handle\/tinyparse/ })).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByTestId("project-used-by").getByRole("link", { name: "kestrel" })).toBeVisible();
  await page.goto("/dashboard/explore/seed-orbit-sim");
  const tools = page.getByRole("heading", { level: 2, name: "Toolbelt" }).locator("..");
  await expect(tools.getByRole("link", { name: "Tinyparse" })).toBeVisible();
  await expect(tools).toContainText("by juniper_dev");
  await expect(tools).toContainText("src/config/load.ts");
  // a project that equips nothing says so
  await page.goto("/dashboard/explore/seed-lamp-bus");
  // The Toolbelt is always shown to visitors; a project with no tools says so.
  await expect(page.getByRole("heading", { level: 2, name: "Toolbelt" })).toHaveCount(1);
  await expect(page.getByTestId("project-tools-empty")).toHaveText("No tools listed yet.");
});

test("Settings shows the handle and links to the profile", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await expect(page.locator(".pf-facts-account")).toContainText("test_builder", { timeout: 30000 });
  await page.getByRole("link", { name: "Edit profile" }).click();
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
});

for (const [width, height] of [[390, 844], [1440, 900]] as const) {
  for (const path of ["/dashboard/profile", "/dashboard/builders/pixel-fox", "/dashboard/explore/seed-tinyparse"]) {
    test(`axe finds nothing on ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible({ timeout: 30000 });
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
      const scrolls = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(scrolls).toBe(false);
    });
  }
}
