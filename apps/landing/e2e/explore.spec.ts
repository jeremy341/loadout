import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Explore after Stasis's Discover: a title and a paragraph, one search, one row of chips, ONE grid with infinite scroll (21 cards a
// page), kudos and Save on every card, and a public project page with the journal timeline. Local development opens as the builder
// test account (handle test_builder). Seeded by `bun run db:seed:local` and `bun run scripts/seed-local-explore.ts`: handles
// test_builder, juniper_dev, kestrel, pixel-fox, bolt_nine, atlas_bay (24 extra approved projects, so there are two pages); the
// builder has saved Tinyparse, Orbit Sim and Tape Deck; Tinyparse has three journal entries. Saving and giving kudos change the local
// database, so each test that does puts the seeded state back.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
// Lamp Bus's kudo and Saved flags, and the seeded saved count, are shared by several tests here. The runner otherwise puts
// them in two workers at once, where one test's toggle changes what the next one reads.
test.describe.configure({ mode: "serial" });

const grid = (page: Page) => page.locator(".pf-explore-grid");
const cards = (page: Page) => page.locator(".pf-explore-card");

async function type(page: Page, text: string) {
  const box = page.getByRole("searchbox", { name: "Search" });
  await box.fill(text);
  return box;
}

// Puts the Lamp Bus star and heart back to "not given", through the project page, whatever state a failed test left.
async function resetLampBus(page: Page) {
  await page.goto("/dashboard/explore/seed-lamp-bus");
  const star = page.getByRole("button", { name: /^Save Lamp Bus/ });
  await expect(star).toBeVisible({ timeout: 30000 });
  if ((await star.getAttribute("aria-pressed")) === "true") {
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await page.waitForTimeout(500);
  }
  const heart = page.getByRole("button", { name: /^Kudos for Lamp Bus/ });
  if ((await heart.getAttribute("aria-pressed")) === "true") {
    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "false");
    await page.waitForTimeout(500);
  }
}

test("one title, one paragraph, one search and one grid with no rails", async ({ page }) => {
  await page.goto("/dashboard/explore");
  await expect(page.getByRole("heading", { level: 1, name: "Explore" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("searchbox")).toHaveCount(1);
  // No rails: a rail would bring a section heading, and the page has only the one grid of cards.
  await expect(page.locator("#platform-main").getByRole("heading", { level: 2 })).toHaveCount(0);
  await expect(grid(page)).toHaveCount(1);
  await expect(cards(page)).toHaveCount(14);
  await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 3");
  await expect(page.locator(".pf-explore-count")).toContainText(/^\d+ projects\./);
  // a card: check badge, kudos heart with its count, two line text, author chip, entries and the time of the last entry
  const tinyparse = cards(page).filter({ hasText: "Tinyparse" });
  await expect(tinyparse.getByText("Approved")).toHaveCount(1);
  await expect(tinyparse.getByRole("button", { name: /^Kudos for Tinyparse, 3 kudos$/ })).toBeVisible();
  await expect(tinyparse.getByRole("link", { name: "juniper_dev" })).toHaveAttribute("href", "/dashboard/builders/juniper_dev");
  await expect(tinyparse).toContainText("3 entries");
  await expect(tinyparse.locator("time")).toHaveCount(1);
  await expect(tinyparse.getByRole("link", { name: "Tinyparse" })).toHaveAttribute("href", "/dashboard/explore/seed-tinyparse");
  // open source first: Lamp Bus (no source link) comes after the projects that have one, so Tinyparse leads
  await expect(cards(page).first()).toContainText("Tinyparse");
  await expect(page.locator(".pf-explore-card .pf-core-depth")).toHaveCount(0);
});

test("Load more adds the next cards, then says everything is shown", async ({ page }) => {
  await page.goto("/dashboard/explore");
  await expect(cards(page)).toHaveCount(21, { timeout: 30000 });
  const total = Number((await page.locator(".pf-explore-count").textContent())?.trim().match(/^(\d+) projects/i)?.[1] ?? 0);
  test.skip(total <= 21, "Run scripts/seed-local-explore.ts first: Explore needs more than 21 approved projects.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const more = page.getByRole("button", { name: "Load more" });
  const shown = page.locator(".pf-explore-shown");
  // Other specs create and delete projects in the same database, so read the running count from the page rather than
  // pinning a total that can change between two requests.
  const shownNumber = async () => Number(((await shown.textContent()) ?? "").trim().match(/^(?:All )?(\d+)/)?.[1] ?? 0);
  await expect(more).toBeVisible({ timeout: 30000 });
  await expect(shown).toHaveText(/^21 of \d+ projects shown\.$/);
  // Drafts are listed now, so the feed runs in pages of 21: one click adds a page and says how many are shown. Once every
  // project is on screen it says "All ... shown." instead of counting.
  await more.click();
  await expect.poll(shownNumber, { timeout: 15000 }).toBeGreaterThan(21);
  await expect(cards(page)).toHaveCount(await shownNumber(), { timeout: 15000 });
  for (let pageNumber = 0; pageNumber < 10 && (await more.count()) > 0; pageNumber += 1) {
    const before = await shownNumber();
    await more.click();
    await expect.poll(shownNumber, { timeout: 15000 }).toBeGreaterThan(before);
    await expect(cards(page)).toHaveCount(await shownNumber(), { timeout: 15000 });
  }
  await expect(shown).toHaveText(/^All \d+ projects shown\.$/);
  await expect(cards(page)).toHaveCount(await shownNumber());
  await expect(page.getByRole("button", { name: /Load more|Loading/ })).toHaveCount(0);
});

test("scrolling to the end loads the next page by itself", async ({ page }) => {
  await page.goto("/dashboard/explore");
  await expect(cards(page)).toHaveCount(21, { timeout: 30000 });
  const total = Number((await page.locator(".pf-explore-count").textContent())?.trim().match(/^(\d+) projects/i)?.[1] ?? 0);
  test.skip(total <= 21, "Run scripts/seed-local-explore.ts first.");
  // Each scroll to the end loads another page until the button disappears. Other specs add and delete projects in the
  // same database, so read the finished count from the page instead of pinning the total seen at the start.
  const shown = page.locator(".pf-explore-shown");
  for (let guard = 0; guard < 6; guard += 1) {
    const before = (await shown.textContent()) ?? "";
    if (/^All /.test(before)) break;
    await page.locator(".pf-explore-more").scrollIntoViewIfNeeded();
    await expect.poll(async () => (await shown.textContent()) ?? "", { timeout: 30000 }).not.toBe(before);
  }
  await expect(shown).toHaveText(/^All \d+ projects shown\.$/, { timeout: 30000 });
  await expect(cards(page)).toHaveCount(Number(((await shown.textContent()) ?? "").match(/\d+/)?.[0] ?? 0));
});

test("the feed endpoint returns handles only, 21 at a time, with a cursor", async ({ page }) => {
  await page.goto("/dashboard/explore");
  const first = await page.request.get("/platform-explore");
  expect(first.status()).toBe(200);
  const body = await first.json();
  expect(body.cards).toHaveLength(21);
  expect(JSON.stringify(body)).not.toMatch(/@|displayName|email/);
  expect(body.next).toBe("c21");
  const second = await (await page.request.get("/platform-explore?cursor=c21")).json();
  const ids = new Set(body.cards.map((c: { id: string }) => c.id));
  expect(second.cards.some((c: { id: string }) => ids.has(c.id))).toBe(false);
  expect((await page.request.get("/platform-explore?q=zzzz")).status()).toBe(200);
});

test("typing searches the grid: a title, a builder, by:handle and track:", async ({ page }) => {
  await page.goto("/dashboard/explore");
  const box = await type(page, "tinyp");
  await expect(page).toHaveURL(/\/dashboard\/explore\?q=tinyp$/, { timeout: 15000 });
  await expect(cards(page)).toHaveCount(1);
  await expect(grid(page).getByRole("link", { name: "Tinyparse" })).toBeVisible();
  await expect(page.locator(".pf-explore-count")).toContainText("1 project.");

  await type(page, "kestrel");
  await expect(grid(page).getByRole("link", { name: "Orbit Sim" })).toBeVisible({ timeout: 15000 });
  await expect(grid(page).getByRole("link", { name: "Gridlock" })).toBeVisible();
  await expect(grid(page).getByRole("link", { name: "Tinyparse" })).toHaveCount(0);

  await type(page, "by:pixel-fox");
  await expect(grid(page).getByRole("link", { name: "Lamp Bus" })).toBeVisible({ timeout: 15000 });
  await expect(grid(page).getByRole("link", { name: "Orbit Sim" })).toHaveCount(0);

  await type(page, "track:hardware");
  await expect(grid(page).getByRole("link", { name: "Pocket Synth" })).toBeVisible({ timeout: 15000 });
  await expect(grid(page).getByRole("link", { name: "Lamp Bus" })).toBeVisible();
  await expect(grid(page).getByRole("link", { name: "Tinyparse" })).toHaveCount(0);

  await box.fill("");
  await expect(page).toHaveURL(/\/dashboard\/explore$/, { timeout: 15000 });
  await expect(cards(page)).toHaveCount(14);
});

test("no results: the message and the Clear link", async ({ page }) => {
  await page.goto("/dashboard/explore");
  await type(page, "zzzz nothing matches");
  await expect(page.locator(".pf-empty")).toContainText("No projects match.", { timeout: 15000 });
  await expect(grid(page)).toHaveCount(0);
  await page.locator(".pf-empty").getByRole("link", { name: "Clear the search" }).click();
  await expect(page).toHaveURL(/\/dashboard\/explore$/);
  await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("");
});

test("the Clear button empties the field and keeps focus in it", async ({ page }) => {
  await page.goto("/dashboard/explore");
  const box = await type(page, "tinyp");
  await expect(cards(page)).toHaveCount(1, { timeout: 15000 });
  await page.locator(".pf-explore-field").getByRole("button", { name: "Clear" }).click();
  await expect(box).toHaveValue("");
  await expect(box).toBeFocused();
  await expect(cards(page)).toHaveCount(21, { timeout: 15000 });
});

test("the Saved chip filters to the saved projects and says the list is private", async ({ page }) => {
  await page.goto("/dashboard/explore");
  await page.getByRole("link", { name: /^Saved \d+$/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/explore\?saved=1$/);
  await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveAttribute("aria-current", "page");
  await expect(cards(page)).toHaveCount(3);
  for (const title of ["Tinyparse", "Orbit Sim", "Tape Deck"]) await expect(grid(page).getByRole("link", { name: title })).toBeVisible();
  await expect(page.locator(".pf-explore-count")).toContainText("3 projects.");
  await expect(page.getByText("Only you can see this list.")).toBeVisible();

  await page.goto("/dashboard/explore?saved=1&q=zzzz");
  await expect(page.locator(".pf-empty")).toContainText("No saved projects match.");
  await page.goto("/dashboard/explore?saved=1&track=tools");
  await expect(cards(page)).toHaveCount(1);
  await expect(grid(page).getByRole("link", { name: "Tinyparse" })).toBeVisible();
});

test("saving and unsaving from a card updates the count and survives a reload", async ({ page }) => {
  try {
    await resetLampBus(page);
    await page.goto("/dashboard/explore?track=hardware");
    const star = grid(page).getByRole("button", { name: "Save Lamp Bus" });
    await expect(star).toHaveAttribute("aria-pressed", "false", { timeout: 30000 });
    await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 3");
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await expect(star).toBeFocused();
    await expect(page.locator(".pf-saved-status")).toHaveText("Saved.", { timeout: 10000 });
    await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 4", { timeout: 10000 });
    await expect(star).toHaveAccessibleName("Save Lamp Bus");
    await page.reload();
    await expect(grid(page).getByRole("button", { name: "Save Lamp Bus" })).toHaveAttribute("aria-pressed", "true");
    await grid(page).getByRole("button", { name: "Save Lamp Bus" }).click();
    await expect(page.locator(".pf-saved-status")).toHaveText("Removed from Saved.", { timeout: 10000 });
    await expect(page.getByRole("link", { name: /^Saved \d+$/ })).toHaveText("Saved 3", { timeout: 10000 });
  } finally {
    await resetLampBus(page);
  }
});

test("kudos from a card flips the heart and the count, survives a reload, and can be taken back", async ({ page }) => {
  try {
    // Tests run fully parallel in two workers, so start from the seeded state even if an earlier run left a kudo behind.
    await resetLampBus(page);
    await page.goto("/dashboard/explore?track=hardware");
    const heart = grid(page).getByRole("button", { name: /^Kudos for Lamp Bus/ });
    await expect(heart).toHaveAttribute("aria-pressed", "false", { timeout: 30000 });
    await expect(heart).toHaveAccessibleName("Kudos for Lamp Bus, No kudos yet");
    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    await expect(heart).toHaveAccessibleName("Kudos for Lamp Bus, 1 kudo");
    await expect(page.locator(".pf-saved-status")).toHaveText("Kudos given.", { timeout: 10000 });
    await page.reload();
    const again = grid(page).getByRole("button", { name: /^Kudos for Lamp Bus/ });
    await expect(again).toHaveAttribute("aria-pressed", "true");
    await expect(again).toHaveAccessibleName("Kudos for Lamp Bus, 1 kudo");
    await again.click();
    await expect(page.locator(".pf-saved-status")).toHaveText("Kudos taken back.", { timeout: 10000 });
    await page.reload();
    await expect(grid(page).getByRole("button", { name: /^Kudos for Lamp Bus/ })).toHaveAttribute("aria-pressed", "false");
  } finally {
    await resetLampBus(page);
  }
});

test("you cannot give kudos to your own project: no button, the count is plain", async ({ page }) => {
  await page.goto("/dashboard/explore?q=cable");
  const own = cards(page).filter({ hasText: "Cable Tidy" });
  await expect(own).toHaveCount(1, { timeout: 30000 });
  await expect(own.getByRole("button", { name: /^Kudos/ })).toHaveCount(0);
  await expect(own.getByRole("img", { name: /kudos on your project$/ })).toBeVisible();
});

test("the project page copies Stasis: back link, one header box, facts, Source, and a journal timeline, newest first", async ({ page }) => {
  await page.goto("/dashboard/explore/seed-tinyparse");
  await expect(page.getByRole("heading", { level: 1, name: "Tinyparse" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: "Save Tinyparse" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /^Kudos for Tinyparse, 3 kudos$/ })).toHaveAttribute("aria-pressed", "false");
  // The facts: approved and pending hours and an honest Hackatime line. No Ore, and no Depth repeating the approved hours.
  const facts = page.locator(".pf-spp-facts");
  for (const label of ["Approved hours", "Pending hours", "Hackatime"]) await expect(facts).toContainText(label);
  await expect(facts).toContainText("Not connected");
  await expect(facts).not.toContainText("Depth");
  await expect(page.locator("#platform-main").getByText(/\bOre\b/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Source github\.com\/example-handle\/tinyparse$/ })).toHaveAttribute("href", /^https:\/\//);
  for (const name of ["Journal", "Toolbelt"]) await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  await expect(page.getByRole("link", { name: "juniper_dev", exact: true }).first()).toHaveAttribute("href", "/dashboard/builders/juniper_dev");
  await expect(page.getByRole("link", { name: "Back to Explore" })).toHaveAttribute("href", "/dashboard/explore");
  // One track tag, and no status tag or repeated track on the page (a not approved project has a notice instead).
  await expect(page.locator(".pf-spp-head .pf-spp-tag")).toHaveCount(1);
  await expect(page.locator(".pf-spp-head .pf-badge")).toHaveCount(0);
  const titles = await page.locator(".pf-spp-entry-title").allInnerTexts();
  expect(titles.map((t) => t.toLowerCase())).toEqual(["release notes and a readme", "readable error messages", "first parser pass"]);
  const first = page.getByTestId("journal-entry").first();
  await expect(first).toContainText("1.5 hours logged");
  await expect(first).toContainText("added to the journal");
  await expect(first.locator("time")).toBeVisible();
  await expect(page.getByTestId("journal-entry-started")).toContainText("started this project");
  // A visitor has no owner buttons.
  await expect(page.getByRole("button", { name: /^(Edit|Delete) entry/ })).toHaveCount(0);
});

test("a project without entries says so, a draft opens with a notice, and only an unknown id is a 404", async ({ page }) => {
  await page.goto("/dashboard/explore/seed-gridlock");
  await expect(page.getByText("No journal entries on this project yet.")).toBeVisible({ timeout: 30000 });
  for (const id of ["seed-notebook-sync", "seed-fan-curve"]) {
    const response = await page.goto(`/dashboard/explore/${id}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("project-notice")).toBeVisible();
    // Kudos and Save work on drafts too (owner, 16 Nov 2026).
    await expect(page.getByRole("button", { name: /^Kudos for / }).or(page.getByRole("img", { name: /kudos on your project$/ }))).toBeVisible();
    await expect(page.getByRole("button", { name: /^Save / })).toBeVisible();
  }
  const response = await page.goto("/dashboard/explore/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("the page works with no script: the grid, search, Load more to ?cursor= and back", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  try {
    await page.goto("/dashboard/explore");
    await expect(cards(page)).toHaveCount(21, { timeout: 30000 });
    const total = Number((await page.locator(".pf-explore-count").textContent())?.trim().match(/^(\d+) projects/i)?.[1] ?? 0);
    const more = page.getByRole("link", { name: "Load more" });
    await expect(more).toHaveAttribute("href", "/dashboard/explore?cursor=c21");
    await more.click();
    await expect(page).toHaveURL(/\?cursor=c21$/);
    // A ?cursor= page holds at most 21 cards; with more than 42 projects there is another page after it.
    const onSecond = Math.min(21, total - 21);
    const shown = 21 + onSecond;
    await expect(cards(page)).toHaveCount(onSecond);
    await expect(page.locator(".pf-explore-shown")).toHaveText(`${shown} of ${total} projects shown.`);
    const moreAgain = page.getByRole("link", { name: "Load more" });
    if (shown < total) await expect(moreAgain).toHaveAttribute("href", `/dashboard/explore?cursor=c${shown}`);
    else await expect(moreAgain).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Earlier projects" })).toHaveAttribute("href", "/dashboard/explore");
    await page.goto("/dashboard/explore?cursor=c99");
    await expect(page).toHaveURL(/\/dashboard\/explore$/);

    await page.goto("/dashboard/explore?q=kestrel&track=compute");
    // A draft by the same builder is listed too, so the search finds two projects.
    await expect(cards(page)).toHaveCount(2);
    await expect(page.locator(".pf-explore-count")).toContainText("2 projects.");
    await page.goto("/dashboard/explore");
    await page.getByRole("searchbox", { name: "Search" }).fill("pocket");
    await page.getByRole("searchbox", { name: "Search" }).press("Enter");
    await expect(page).toHaveURL(/\/dashboard\/explore\?q=pocket$/);
    await expect(grid(page).getByRole("link", { name: "Pocket Synth" })).toBeVisible();
    await page.getByRole("navigation", { name: "Filter by track" }).getByRole("link", { name: "Hardware" }).click();
    await expect(page).toHaveURL(/q=pocket&track=hardware$/);
  } finally {
    await context.close();
  }
});

test("keyboard: Tab goes heart, Save star, title link, author link", async ({ page }) => {
  await page.goto("/dashboard/explore?q=tinyp");
  await expect(cards(page)).toHaveCount(1, { timeout: 30000 });
  const card = cards(page).first();
  await card.getByRole("button", { name: /^Kudos for Tinyparse/ }).focus();
  await page.keyboard.press("Tab");
  await expect(card.getByRole("button", { name: "Save Tinyparse" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(card.getByRole("link", { name: "Tinyparse" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(card.getByRole("link", { name: "juniper_dev" })).toBeFocused();
});

for (const [width, height] of [[390, 844], [1440, 900]] as const) {
  for (const path of ["/dashboard/explore", "/dashboard/explore?saved=1", "/dashboard/explore?q=zzzz", "/dashboard/explore/seed-tinyparse"]) {
    test(`axe finds nothing on ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible({ timeout: 30000 });
      const found = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }
}
