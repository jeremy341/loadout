import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Builder profiles (own and public), the account control and the Explore handle changes. Local development opens as the
// builder test account (handle test_builder). Seeded builders: juniper_dev, kestrel, pixel-fox, bolt_nine. The test account
// "none" has no handle. Needs the local database with `bun run db:seed:local`.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const NO_HANDLE = { name: "loadout_preview_role", value: "none", url: "http://localhost:3010" };

async function asNoHandle(page: Page) {
  const base = process.env.LOADOUT_TEST_BASE_URL ?? `http://localhost:${process.env.LOADOUT_TEST_PORT ?? "3001"}`;
  await page.context().addCookies([{ ...NO_HANDLE, url: base }]);
}

test("own profile shows the handle plate, pinned strip, projects, toolbelt and activity, and no name or email", async ({ page }) => {
  await page.goto("/dashboard/profile");
  await expect(page.getByRole("heading", { level: 1, name: "test_builder" })).toBeVisible({ timeout: 30000 });
  for (const name of ["Pinned", "Loadout", "Projects", "Toolbelt", "Recent activity"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.getByText("No journal entries yet. Journals open in a later release.")).toBeVisible();
  await expect(page.getByText(/builder@loadout\.test/)).toHaveCount(0);
  await expect(page.getByText("Test builder", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Other builders see your approved projects and the ones you show as building.")).toBeVisible();
});

test("status and track filters live in the address and carry counts in their names", async ({ page }) => {
  await page.goto("/dashboard/profile");
  const status = page.getByRole("navigation", { name: "Project status" });
  await expect(status.getByRole("link", { name: /^All, \d+ projects?$/ })).toHaveAttribute("aria-current", "page");
  await status.getByRole("link", { name: /^Draft, \d+ projects?$/ }).click();
  await expect(page).toHaveURL(/\?tab=draft#profile-projects$/);
  await page.getByRole("navigation", { name: "Filter by track" }).getByRole("link", { name: "Hardware" }).click();
  await expect(page).toHaveURL(/\?tab=draft&track=hardware#profile-projects$/);
  await expect(page.getByRole("heading", { level: 3, name: "Draft Radio" })).toBeVisible();
  await page.goto("/dashboard/profile?tab=in-review");
  await expect(page.getByText("No In review projects.")).toBeVisible();
  await page.getByRole("link", { name: "Show all" }).click();
  await expect(page).toHaveURL(/\/dashboard\/profile#profile-projects$/);
  await page.goto("/dashboard/profile?tab=approved&track=hardware");
  await expect(page.getByText("No projects match.")).toBeVisible();
});

test("a public profile shows only what the owner shows, never levels or private work", async ({ page }) => {
  await page.goto("/dashboard/builders/juniper_dev");
  await expect(page.getByRole("heading", { level: 1, name: "juniper_dev" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("link", { name: "Back to Explore" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Loadout" })).toHaveCount(0);
  await expect(page.getByText("Top track")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit profile" })).toHaveCount(0);
  await expect(page.getByText("Notebook Sync")).toHaveCount(0); // a draft
  await expect(page.getByText("Private", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Pin to profile|Unpin|Hide from profile/ })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Project status" }).getByRole("link", { name: /^Approved, 2 projects$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "kestrel" })).toBeVisible(); // uses Tinyparse
});

test("a builder shown as building has a Building tab", async ({ page }) => {
  await page.goto("/dashboard/builders/kestrel");
  await page.getByRole("navigation", { name: "Project status" }).getByRole("link", { name: /^Building, 1 project$/ }).click();
  await expect(page).toHaveURL(/\?tab=building#profile-projects$/);
  await expect(page.getByRole("heading", { level: 3, name: "Ray Marcher" })).toBeVisible();
  await expect(page.getByText("Projects this builder is working on now.")).toBeVisible();
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

test("Pin and Unpin run on the server and announce the result", async ({ page }) => {
  await page.goto("/dashboard/profile?tab=approved");
  const unpin = page.getByRole("button", { name: "Unpin" });
  await expect(unpin).toBeVisible({ timeout: 30000 });
  await unpin.click();
  await expect(page.getByRole("status").filter({ hasText: "Unpinned." })).toBeVisible();
  const pin = page.getByRole("button", { name: "Pin to profile" });
  await expect(pin).toBeVisible();
  await pin.click();
  await expect(page.getByRole("status").filter({ hasText: "Pinned Cable Tidy." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unpin" })).toBeVisible();
});

test("the account control opens, lists Profile and Settings, and closes on Escape and outside press", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/dashboard");
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
  await page.mouse.click(200, 600);
  await expect(panel).toBeHidden();
  // The phone Menu and the account panel close each other.
  await button.click();
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(panel).toBeHidden();
  await button.click();
  await expect(page.getByRole("button", { name: "Close" })).toHaveCount(0);
  await panel.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await expect(panel).toBeHidden();
  await expect(button).toHaveAttribute("data-current", "true");
});

test("Explore shows handles, never display names, searches by handle and counts confirmed uses", async ({ page }) => {
  await page.goto("/dashboard/explore");
  const card = page.getByRole("link", { name: /Tinyparse/ });
  await expect(card).toContainText("by juniper_dev", { timeout: 30000 });
  await expect(card).toContainText("Used by 1");
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
  await expect(page.getByRole("link", { name: "juniper_dev" })).toHaveAttribute("href", "/dashboard/builders/juniper_dev");
  await expect(page.locator(".pf-meta-box")).toContainText("Used by");
  await expect(page.getByRole("link", { name: "github.com/example-handle/tinyparse" })).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByRole("heading", { level: 2, name: "Used by" }).locator("..").getByRole("link", { name: "kestrel" })).toBeVisible();
  await page.goto("/dashboard/explore/seed-orbit-sim");
  const tools = page.getByRole("heading", { level: 2, name: "Tools in this project" }).locator("..");
  await expect(tools.getByRole("link", { name: "Tinyparse" })).toBeVisible();
  await expect(tools).toContainText("by juniper_dev");
  await expect(tools).toContainText("src/config/load.ts");
  // a project that equips nothing says so, and a project with no source address has no Used by cell
  await page.goto("/dashboard/explore/seed-lamp-bus");
  await expect(page.getByText("This project does not equip any tools.")).toBeVisible();
  await expect(page.locator(".pf-meta-box")).not.toContainText("Used by");
});

test("Settings shows the handle and links to the profile", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await expect(page.locator(".pf-facts-account")).toContainText("test_builder", { timeout: 30000 });
  await page.getByRole("link", { name: "Open Profile" }).click();
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
