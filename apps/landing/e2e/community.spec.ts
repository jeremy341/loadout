import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The Community section of the participant platform: fixture-driven, read only. Local development opens without sign-in as
// the builder test account (see platform.spec.ts), so these tests need the same local Postgres and seeded accounts.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VIEWPORTS = [
  [375, 812],
  [1440, 900],
] as const;
const SCHEMES = ["dark", "light"] as const;
const PAGES = [
  "/dashboard/community",
  "/dashboard/community/show-and-tell",
  "/dashboard/community/show-and-tell/session-2",
  "/dashboard/community/ideas",
  "/dashboard/community/ideas/parts-checklist",
  "/dashboard/community/news",
  "/dashboard/community/leaderboard",
  "/dashboard/community/leaderboard?track=hardware&range=all-time",
  "/dashboard/community/goals",
  "/dashboard/community/events",
];
const TABS = ["Overview", "Show & Tell", "Ideas", "News", "Leaderboard", "Goals", "Events"];
const CLOSED = "Nothing here is saved.";

async function setTheme(page: Page, width: number, height: number, scheme: (typeof SCHEMES)[number]) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
}

test("the Community hub has the tab row, the Era and one short preview of each page", async ({ page }) => {
  await page.goto("/dashboard/community");
  // The heading is visible and comes before the tab row.
  await expect(page.getByRole("heading", { level: 1, name: "Community" })).toBeVisible({ timeout: 30000 });
  const tabs = page.getByRole("navigation", { name: "Community" }).getByRole("link");
  await expect(tabs).toHaveText(TABS, { timeout: 30000 });
  await expect(tabs.first()).toHaveAttribute("aria-current", "page");

  await expect(page.getByRole("heading", { level: 2, name: "Community Era" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Example Era sequence" }).getByRole("listitem")).toHaveCount(5);
  await expect(page.getByText("+10% of base Ore (planned)")).toBeVisible();
  // No threshold, countdown or percentage for the Era.
  await expect(page.locator(".cm-era")).not.toContainText(/\d+\s?%\s?(complete|done)/i);

  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveText(["Community Era", "Show & Tell", "Leaderboard", "Top ideas", "Latest news", "Referrals"]);
  await expect(page.getByRole("link", { name: "Next session: date to be announced." })).toBeVisible();
  // Three rows at most in any preview, and nothing that looks like a feed or a repost.
  await expect(page.locator(".cm-mini")).toHaveCount(4);
  for (const list of await page.locator(".cm-mini").all()) {
    expect(await list.locator(":scope > li").count()).toBeLessThanOrEqual(3);
  }
  await expect(page.getByRole("list", { name: "Top builders this week by approved hours, all tracks" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByText(/repost/i)).toHaveCount(0);
  await expect(page.getByText(/invented samples/)).toBeVisible();
  // Referrals has no tab; it is a plain link from the hub.
  await page.getByRole("link", { name: "Open Referrals" }).click();
  await expect(page).toHaveURL(/\/dashboard\/referrals$/);
  await page.goBack();

  await page.getByRole("link", { name: "See all Top ideas" }).click();
  await expect(page).toHaveURL(/\/dashboard\/community\/ideas$/);
  await expect(page.getByRole("navigation", { name: "Community" }).getByRole("link", { name: "Ideas" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Community" }).getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current", "page");
});

test("Events says nothing is scheduled and shows no date, price or registration, with RSVP off", async ({ page }) => {
  await page.goto("/dashboard/community/events");
  await expect(page.getByRole("heading", { level: 1, name: "Events" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Community" }).getByRole("link", { name: "Events" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 3, name: "Show and Tell" })).toBeVisible();
  await expect(page.getByText("Nothing on this page is scheduled.")).toBeVisible();
  const open = page.locator(".ex-open");
  for (const label of ["Dates", "Format"]) await expect(open.getByText(label, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "RSVP" })).toBeDisabled();
  await expect(page.getByText(`RSVPs are not open. Registration opens only once the dates and details are confirmed. ${CLOSED}`)).toBeVisible();
  const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  expect(text).not.toMatch(/20\d{2}/);
  expect(text).not.toMatch(/[€$£]/);
});

test("the main navigation keeps Community highlighted on its sub pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/community/goals");
  await expect(page.getByRole("navigation", { name: "Participant" }).getByRole("link", { name: "Community" })).toHaveAttribute("aria-current", "page", { timeout: 30000 });
});

test("Show & Tell names no date for an upcoming session and disables sign-up", async ({ page }) => {
  await page.goto("/dashboard/community/show-and-tell");
  await expect(page.getByText("Next session: date to be announced.")).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: "Offer a showcase" })).toBeDisabled();
  await expect(page.getByText("Showcase sign-up opens with the community release. Nothing here is saved.")).toBeVisible();
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveText(["Upcoming", "Past sessions"]);

  await page.getByRole("link", { name: "Tools that rescued a bad afternoon" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Session 3/ })).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".cm-showcases > li")).toHaveCount(2);

  await page.goto("/dashboard/community/show-and-tell/next-session");
  await expect(page.getByText("To be announced")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("No showcases are listed yet.")).toBeVisible();
});

test("the idea board filters and sorts from the address, and voting is disabled", async ({ page }) => {
  await page.goto("/dashboard/community/ideas");
  await expect(page.getByText("Voting opens with the community release. Nothing here is saved.").first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/cannot be shop requests/)).toBeVisible();

  const rows = page.locator(".cm-idea");
  await expect(rows).toHaveCount(6);
  await expect(rows.first().getByRole("heading", { level: 2 })).toHaveText("Build-along threads for each Era objective");
  const upvotes = page.getByRole("button", { name: /^Upvote:/ });
  await expect(upvotes).toHaveCount(6);
  for (const button of await upvotes.all()) await expect(button).toBeDisabled();

  const statuses = page.getByRole("navigation", { name: "Filter by status" }).getByRole("link");
  await expect(statuses).toHaveText(["All ideas", "Open", "Planned", "Built", "Declined"]);
  await expect(statuses.first()).toHaveAttribute("aria-current", "page");
  await statuses.filter({ hasText: "Declined" }).click();
  await expect(page).toHaveURL(/\/dashboard\/community\/ideas\?status=declined$/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Peer scores on every project");

  await page.goto("/dashboard/community/ideas?sort=newest");
  await expect(rows.first().getByRole("heading", { level: 2 })).toHaveText("Pin one project to your profile", { timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Sort ideas" }).getByRole("link", { name: "Newest" })).toHaveAttribute("aria-current", "true");

  // Unknown values fall back to the default view.
  await page.goto("/dashboard/community/ideas?status=shop&sort=random");
  await expect(rows).toHaveCount(6, { timeout: 30000 });
});

test("an idea opens read only with its team reply, and an unknown idea is a 404", async ({ page }) => {
  await page.goto("/dashboard/community/ideas/peer-scores");
  await expect(page.getByRole("heading", { level: 1, name: "Peer scores on every project" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { level: 2, name: "Team reply" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Upvote:/ })).toBeDisabled();
  await expect(page.getByText("Voting opens with the community release. Nothing here is saved.")).toBeVisible();
  const response = await page.goto("/dashboard/community/ideas/not-an-idea");
  expect(response?.status()).toBe(404);
  const session = await page.goto("/dashboard/community/show-and-tell/not-a-session");
  expect(session?.status()).toBe(404);
});

test("news is a short list of notes with no dates or prices", async ({ page }) => {
  await page.goto("/dashboard/community/news");
  await expect(page.locator(".cm-news > li")).toHaveCount(5, { timeout: 30000 });
  await expect(page.locator(".cm-news")).not.toContainText(/[$€£]/);
  await expect(page.locator(".cm-news")).not.toContainText(/\b20\d\d\b/);
});

test("the leaderboard ranks by approved hours with ties, from the address", async ({ page }) => {
  await page.goto("/dashboard/community/leaderboard");
  await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeAttached({ timeout: 30000 });
  const ranges = page.getByRole("navigation", { name: "Choose a range" }).getByRole("link");
  await expect(ranges).toHaveText(["This week", "All time"]);
  await expect(ranges.first()).toHaveAttribute("aria-current", "page");
  const tracks = page.getByRole("navigation", { name: "Filter by track" }).getByRole("link");
  await expect(tracks).toHaveText(["All tracks", "Tools", "Systems", "Compute", "Hardware"]);

  const rows = page.locator(".cm-leader tbody tr");
  await expect(rows).toHaveCount(8);
  await expect(rows.first()).toContainText("mothvector");
  await expect(rows.first()).toContainText("16 H");
  await expect(rows.first()).toContainText("16 M deeper");
  // Equal hours share a rank and say so in words.
  await expect(rows.nth(1)).toContainText("2 tied");
  await expect(rows.nth(2)).toContainText("2 tied");
  await expect(page.locator("main").getByText(/\bOre\b/)).toHaveCount(0);

  await tracks.filter({ hasText: "Hardware" }).click();
  await expect(page).toHaveURL(/\/dashboard\/community\/leaderboard\?track=hardware$/);
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText("1 tied");
  await expect(rows.nth(1)).toContainText("1 tied");
  await expect(rows.nth(2)).toContainText("3");

  await page.getByRole("navigation", { name: "Choose a range" }).getByRole("link", { name: "All time" }).click();
  await expect(page).toHaveURL(/track=hardware&range=all-time$/);
  await expect(rows.first()).toContainText("brasskettle");
  await expect(rows.first()).toContainText("-120 M");

  // Unknown values show the default view.
  await page.goto("/dashboard/community/leaderboard?track=art&range=forever");
  await expect(rows).toHaveCount(8, { timeout: 30000 });
});

test("goals are plain bars with the figures written out and a provisional label", async ({ page }) => {
  await page.goto("/dashboard/community/goals");
  const bars = page.getByRole("progressbar");
  await expect(bars).toHaveCount(3, { timeout: 30000 });
  await expect(bars.first()).toHaveAttribute("aria-valuetext", "1,240 of 2,000 approved hours, 62%");
  await expect(page.getByText("1,240 of 2,000 approved hours")).toBeVisible();
  await expect(page.getByText("Provisional", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Shared reward")).toHaveCount(3);
});

test("community pages do not scroll sideways at phone width", async ({ page }) => {
  await setTheme(page, 375, 812, "dark");
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached({ timeout: 30000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

for (const path of PAGES) {
  for (const [width, height] of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      test(`${path} has no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
        await setTheme(page, width, height, scheme);
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeAttached({ timeout: 30000 });
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      });
    }
  }
}
