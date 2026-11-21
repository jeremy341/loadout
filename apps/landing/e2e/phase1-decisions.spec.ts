import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Phase 1 of the participant redesign: the running app matches the owner's decisions of 16 Nov 2026.
//   every project is public, drafts included; visitors see pending and approved hours, and Ore only as the balance on a profile; Overview is gone;
//   the profile has two tabs; Pin, Unpin and Delete live in the project Settings tab; the wizard opens with no sidebar.
// Local development opens as the builder test account (handle test_builder). Seeded by `bun run db:seed:local` and
// `bun run scripts/seed-local-explore.ts`. Screenshots go to the scratch folder, never into the repository.
const SHOTS = process.env.LOADOUT_SHOT_DIR ?? "C:/Users/jerem/AppData/Local/Temp/loadout-shots";
mkdirSync(SHOTS, { recursive: true });
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";

async function setup(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.addInitScript(() => localStorage.setItem("loadout-theme", "dark"));
}

test.beforeEach(() => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
});

test("a draft project page opens for a visitor with a plain draft notice, not a 404", async ({ page }) => {
  const response = await page.goto("/dashboard/explore/seed-notebook-sync");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Notebook Sync" })).toBeVisible({ timeout: 30000 });
  const notice = page.getByTestId("project-notice");
  await expect(notice).toHaveText("This project is a draft. The builder is still setting it up.");
  await expect(page.getByText(/only approved projects are public|private until approved/i)).toHaveCount(0);
  // An unknown id is still a plain 404.
  const missing = await page.goto("/dashboard/explore/does-not-exist-phase1");
  expect(missing?.status()).toBe(404);
});

test("an approved project has no draft notice", async ({ page }) => {
  await page.goto("/dashboard/explore/seed-tinyparse");
  await expect(page.getByRole("heading", { level: 1, name: "Tinyparse" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId("project-notice")).toHaveCount(0);
});

test("visitor pages show pending and approved hours, and Ore only on a profile", async ({ page }) => {
  for (const path of ["/dashboard/explore/seed-tinyparse", "/dashboard/explore/seed-notebook-sync"]) {
    await page.goto(path);
    const main = page.locator("#platform-main");
    await expect(main.locator("h1")).toBeVisible({ timeout: 30000 });
    const stats = main.locator(".pf-spp-facts");
    await expect(stats).toContainText("Approved hours");
    await expect(stats).toContainText("Pending hours");
    await expect(main.getByText(/\bOre\b/)).toHaveCount(0);
  }
  await page.goto("/dashboard/builders/juniper_dev");
  const main = page.locator("#platform-main");
  await expect(main.getByRole("heading", { level: 1, name: "juniper_dev" })).toBeVisible({ timeout: 30000 });
  // The owner amendment of 16 Nov: a visitor sees the Ore balance on a profile, like Stasis shows a balance.
  await expect(main.locator(".pf-sp-ore-label")).toHaveText("Ore");
  const card = main.locator("a.pf-sp-project", { hasText: "Tinyparse" });
  await expect(card).toContainText("H approved");
  await expect(card).toContainText("H pending");
});

test("Explore lists drafts too", async ({ page }) => {
  await page.goto("/dashboard/explore?q=notebook");
  await expect(page.locator(".pf-explore-card").filter({ hasText: "Notebook Sync" })).toHaveCount(1, { timeout: 30000 });
  await expect(page.getByText("Every project here is approved")).toHaveCount(0);
});

test("/dashboard redirects to Projects and the sidebar has no Overview", async ({ page, request }) => {
  const response = await request.get("/dashboard", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(/\/dashboard\/projects$/);
  await setup(page, 1440, 900);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/projects$/);
  const nav = page.getByRole("navigation", { name: "Participant" });
  await expect(nav.getByRole("list", { name: "Build" }).getByRole("link")).toHaveText(["Projects", "Review Queue"]);
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveCount(0);
  await expect(page.getByText("Only approved projects are public")).toHaveCount(0);
  await expect(page.getByText("Private until approved")).toHaveCount(0);
});

test("the profile has no tabs and the old Journal and Toolbelt links go to the bare profile", async ({ page }) => {
  await page.goto("/dashboard/profile");
  await expect(page.getByRole("heading", { level: 2, name: "Projects" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("tablist")).toHaveCount(0);
  for (const old of ["journal", "toolbelt"]) {
    await page.goto(`/dashboard/profile?tab=${old}`);
    await expect(page).toHaveURL(/\/dashboard\/profile$/);
  }
});

test("the Settings tab holds Pin, Unpin and Delete, and the profile has no Pin control", async ({ page }) => {
  await page.goto("/dashboard/profile");
  await expect(page.locator("#platform-main").getByRole("link", { name: /Cable Tidy/ })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: /^(Pin to profile|Unpin)$/ })).toHaveCount(0);

  await page.goto("/dashboard/projects/seed-cable-tidy?tab=settings");
  const settings = page.getByRole("tabpanel", { name: "Settings" });
  await expect(settings.getByRole("region", { name: "Project details" })).toBeVisible({ timeout: 30000 });
  await expect(settings.getByRole("button", { name: /^(Pin to profile|Unpin)$/ })).toHaveCount(1);
  await expect(settings.getByRole("button", { name: "Delete project..." })).toBeVisible();
  // Pin then Unpin run on the server; the seed is put back whatever the start state was.
  const toggle = settings.getByRole("button", { name: /^(Pin to profile|Unpin)$/ });
  const startedPinned = (await toggle.textContent())?.includes("Unpin") ?? false;
  await toggle.click();
  await expect(page.getByRole("status").filter({ hasText: startedPinned ? "Unpinned Cable Tidy." : "Pinned Cable Tidy." })).toBeVisible({ timeout: 15000 });
  await settings.getByRole("button", { name: /^(Pin to profile|Unpin)$/ }).click();
  await expect(page.getByRole("status").filter({ hasText: startedPinned ? "Pinned Cable Tidy." : "Unpinned Cable Tidy." })).toBeVisible({ timeout: 15000 });
  // Delete opens the confirmation and is cancelled: nothing is deleted.
  await settings.getByRole("button", { name: "Delete project..." }).click();
  const dialog = page.getByRole("dialog", { name: "Delete project" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Permanently delete project" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});

test("the project tab row works with the keyboard and keeps the tab in the address", async ({ page }) => {
  await page.goto("/dashboard/projects/seed-cable-tidy");
  const list = page.getByRole("tablist", { name: "Project sections" });
  await expect(list.getByRole("tab")).toHaveText(["Journal", "Ship", "Toolbelt", "Settings"], { timeout: 30000 });
  const journal = list.getByRole("tab", { name: "Journal" });
  await expect(journal).toHaveAttribute("aria-selected", "true");
  await expect(journal).toHaveAttribute("tabindex", "0");
  await expect(async () => {
    await journal.focus();
    await page.keyboard.press("ArrowRight");
    await expect(list.getByRole("tab", { name: "Ship" })).toHaveAttribute("aria-selected", "true", { timeout: 1500 });
  }).toPass({ timeout: 15000 });
  await expect(list.getByRole("tab", { name: "Ship" })).toBeFocused();
  await expect(page).toHaveURL(/\?tab=ship$/);
  await page.keyboard.press("End");
  await expect(list.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/\?tab=settings$/);
  await page.keyboard.press("ArrowRight"); // wraps to the first tab
  await expect(journal).toBeFocused();
  await expect(page).toHaveURL(/\/dashboard\/projects\/seed-cable-tidy$/);
  await page.keyboard.press("ArrowLeft"); // wraps to the last
  await expect(list.getByRole("tab", { name: "Settings" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(journal).toHaveAttribute("aria-selected", "true");
  // A reload keeps the tab, and an unknown tab shows Journal.
  await page.goto("/dashboard/projects/seed-cable-tidy?tab=ship");
  await expect(list.getByRole("tab", { name: "Ship" })).toHaveAttribute("aria-selected", "true");
  await page.goto("/dashboard/projects/seed-cable-tidy?tab=nonsense");
  await expect(list.getByRole("tab", { name: "Journal" })).toHaveAttribute("aria-selected", "true");
});

test("the ship checklist lives in the Ship tab only; the Journal tab has one line linking to it", async ({ page }) => {
  // Mini Router is a logging project of the test builder, so it still has ship checks left.
  await page.goto("/dashboard/projects/seed-mini-router");
  const journal = page.getByRole("tabpanel", { name: "Journal" });
  await expect(journal).toBeVisible({ timeout: 30000 });
  await expect(journal.locator("#ship-checklist")).toHaveCount(0);
  await expect(page.locator("#ship-checklist")).toHaveCount(1);
  await expect(page.locator("#ship-checklist")).toBeHidden();
  await expect(page.getByRole("heading", { level: 2, name: "Ship requirements" })).toBeHidden();
  const left = journal.getByTestId("ship-left");
  await expect(left).toHaveText(/^\d+ ship checks? left\./);
  await expect(left.getByRole("link")).toHaveAttribute("href", "/dashboard/projects/seed-mini-router?tab=ship");
  await page.goto("/dashboard/projects/seed-mini-router?tab=ship");
  await expect(page.locator("#ship-checklist")).toBeVisible({ timeout: 30000 });
});

test("the wizard opens with no sidebar and no top bar, and a Close control back to Projects", async ({ page }) => {
  await page.goto("/dashboard/projects/new");
  await expect(page.getByRole("heading", { level: 1, name: "What kind of project is it?" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("complementary", { name: "Site" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Participant" })).toHaveCount(0);
  await expect(page.locator(".pf-strip")).toHaveCount(0);
  await expect(page.locator("a.pf-ore")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Account" })).toHaveCount(0);
  const close = page.getByRole("link", { name: /Close/ });
  await expect(close).toHaveAttribute("href", "/dashboard/projects");
  await expect(page.getByRole("list", { name: "Steps" }).getByRole("listitem")).toHaveCount(5);
  // The rest of the app keeps its sidebar.
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("navigation", { name: "Participant" })).toBeVisible({ timeout: 30000 });
});

test("phase 1 screenshots at 1440 and 390 in dark", async ({ page }) => {
  test.setTimeout(240_000);
  const pages: [string, string][] = [
    ["projects", "/dashboard/projects"],
    ["owner-journal", "/dashboard/projects/seed-mini-router"],
    ["owner-ship", "/dashboard/projects/seed-mini-router?tab=ship"],
    ["owner-settings", "/dashboard/projects/seed-cable-tidy?tab=settings"],
    ["visitor-draft", "/dashboard/explore/seed-notebook-sync"],
    ["visitor-approved", "/dashboard/explore/seed-tinyparse"],
    ["profile", "/dashboard/profile"],
    ["visitor-profile", "/dashboard/builders/juniper_dev"],
    ["wizard", "/dashboard/projects/new"],
  ];
  for (const [width, height] of [[1440, 900], [390, 844]] as const) {
    await setup(page, width, height);
    for (const [name, path] of pages) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(SHOTS, `phase1-${name}-${width}-dark.png`), fullPage: true });
    }
  }
});
