import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createProjectViaWizard, openProjectTab } from "./new-project-helper";

// Expeditions (list and detail), Referrals and Orders (Events lives in community.spec.ts, under the Community tabs). These pages are read-only fixtures, so no database state is needed beyond the
// local builder test account that opens the dashboard without sign-in (see platform.spec.ts).
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VIEWPORTS = [
  [375, 812],
  [1440, 900],
] as const;
const SCHEMES = ["dark", "light"] as const;
const EXPEDITION_PAGES = [
  "/dashboard/shop/expeditions",
  "/dashboard/shop/expeditions?page=2",
  "/dashboard/shop/expeditions?track=tools&q=first",
  "/dashboard/shop/expeditions?q=zebra",
  "/dashboard/shop/expeditions/profile-it",
  "/dashboard/shop/expeditions/bare-metal",
  "/dashboard/shop/expeditions/first-tool",
];
const EXPEDITION_VIEWPORTS = [
  [320, 700],
  [390, 844],
  [720, 900],
  [1440, 900],
] as const;
const PAGES = [
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

test("Expeditions is one search, one track select and one grid of cards, open work first", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions");
  await expect(page.getByRole("heading", { level: 1, name: "Expeditions" })).toBeAttached({ timeout: 30000 });
  // Nothing else filters the list: no chip rows, no tabs, no status control.
  await expect(page.getByRole("search", { name: "Expeditions" }).getByRole("searchbox", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Track" })).toHaveValue("");
  await expect(page.getByRole("combobox")).toHaveCount(1);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: /Filter by/ })).toHaveCount(0);
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveCount(6);
  await expect(page.locator(".ex-card")).toHaveCount(6);
  await expect(page.locator(".ex-card").first()).toHaveAttribute("data-state", "in-progress");
  await expect(page.getByRole("status")).toContainText("10 expeditions. 3 in progress, 2 ready, 3 locked, 2 done.");
  const card = page.locator(".ex-card").filter({ hasText: "Profile before you optimise" });
  await expect(card).toContainText("Tools");
  await expect(card).toContainText("2 of 4 steps");
  await expect(card).toContainText("Find the hot spot");
  await expect(card).not.toContainText("Draft reward");
  await expect(page.getByText("every reward is a draft")).toHaveCount(0);
});

test("a card is one link, and a locked card names what to finish first", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions");
  await expect(page.locator(".ex-card").first()).toBeVisible({ timeout: 30000 });
  for (const card of await page.locator(".ex-card").all()) await expect(card.getByRole("link")).toHaveCount(1);
  const locked = page.locator(".ex-card").filter({ hasText: "Bare metal boot" });
  await expect(locked).toHaveAttribute("data-state", "locked");
  await expect(locked).toContainText("Finish first");
  await expect(locked).toContainText("Speak a protocol");
  await expect(page.locator("main").getByText(/restoration|npc|region/i)).toHaveCount(0);
});

test("the list pages by link, six at a time, and the pager keeps the track and search", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions");
  const pager = page.getByRole("navigation", { name: "Expedition pages" });
  await expect(pager).toContainText("Page 1 of 2", { timeout: 30000 });
  await expect(pager.getByRole("link", { name: "Previous" })).toHaveCount(0);
  await pager.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/\/dashboard\/shop\/expeditions\?page=2$/);
  await expect(page.locator(".ex-card")).toHaveCount(4);
  await expect(pager).toContainText("Page 2 of 2");
  await expect(pager.getByRole("link", { name: "Next" })).toHaveCount(0);
  await pager.getByRole("link", { name: "Previous" }).click();
  await expect(page).toHaveURL(/\/dashboard\/shop\/expeditions$/);
  await page.goto("/dashboard/shop/expeditions?page=99");
  await expect(page.getByRole("navigation", { name: "Expedition pages" })).toContainText("Page 2 of 2", { timeout: 30000 });
  await page.goto("/dashboard/shop/expeditions?track=tools");
  await expect(page.locator(".ex-card")).toHaveCount(3, { timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Expedition pages" })).toHaveCount(0);
});

test("the track select lives in the address", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions");
  await expect(page.locator(".ex-card").first()).toBeVisible({ timeout: 30000 });
  await expect(async () => {
    await page.getByRole("combobox", { name: "Track" }).selectOption("hardware");
    await expect(page).toHaveURL(/\/dashboard\/shop\/expeditions\?track=hardware$/, { timeout: 4000 });
  }).toPass({ timeout: 30000 });
  await expect(page.locator(".ex-card")).toHaveCount(2);
  await expect(page.getByRole("combobox", { name: "Track" })).toHaveValue("hardware");
});

test("search matches names and step titles, and works from the address", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions?q=hot+spot");
  await expect(page.locator(".ex-card")).toHaveCount(1, { timeout: 30000 });
  await expect(page.locator(".ex-card")).toContainText("Profile before you optimise");
  await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("hot spot");
  await page.getByRole("searchbox", { name: "Search" }).fill("pcb");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/q=pcb/);
  await expect(page.locator(".ex-card")).toHaveCount(1);
  await expect(page.locator(".ex-card")).toContainText("Design your first PCB");
});

test("a search with no matches says so and offers a way back", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions?q=zebra");
  await expect(page.getByText("No expeditions match.")).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".ex-card")).toHaveCount(0);
  await page.getByRole("link", { name: "Clear the search" }).click();
  await expect(page.locator(".ex-card")).toHaveCount(6);
});

test("a no-match search keeps its track until the search is cleared", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions?q=zebra&track=tools");
  await expect(page.getByText("No expeditions match.")).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".ex-card")).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Track" })).toHaveValue("tools");
  await page.getByRole("link", { name: "Clear the search" }).click();
  await expect(page).toHaveURL(/\/dashboard\/shop\/expeditions$/);
  await expect(page.locator(".ex-card")).toHaveCount(6);
});

test("an unknown track or page is ignored", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions?track=art&page=abc");
  await expect(page.locator(".ex-card")).toHaveCount(6, { timeout: 30000 });
});

test("pager bounds land on a real page and keep plain links", async ({ page }) => {
  const pager = page.getByRole("navigation", { name: "Expedition pages" });
  await page.goto("/dashboard/shop/expeditions?page=0");
  await expect(pager).toContainText("Page 1 of 2", { timeout: 30000 });
  await expect(page.locator(".ex-card")).toHaveCount(6);
  await expect(pager.getByRole("link", { name: "Previous" })).toHaveCount(0);
  await expect(pager.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/dashboard/shop/expeditions?page=2");

  await page.goto("/dashboard/shop/expeditions?page=-1");
  await expect(pager).toContainText("Page 1 of 2");
  await expect(page.locator(".ex-card")).toHaveCount(6);

  await page.goto("/dashboard/shop/expeditions?page=1");
  await expect(pager).toContainText("Page 1 of 2");
  await expect(page.locator(".ex-card")).toHaveCount(6);

  await page.goto("/dashboard/shop/expeditions?page=2");
  await expect(pager).toContainText("Page 2 of 2");
  await expect(page.locator(".ex-card")).toHaveCount(4);
  await expect(pager.getByRole("link", { name: "Next" })).toHaveCount(0);
  await expect(pager.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/dashboard/shop/expeditions");
});

test("a page past the end of a filtered list leaves no pager behind", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions?track=hardware&page=99");
  await expect(page.locator(".ex-card")).toHaveCount(2, { timeout: 30000 });
  await expect(page.getByRole("combobox", { name: "Track" })).toHaveValue("hardware");
  await expect(page.getByRole("navigation", { name: "Expedition pages" })).toHaveCount(0);
});

test("filter values ignore case, whitespace-only search is no search, and long searches are trimmed", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions?track=ART");
  await expect(page.locator(".ex-card")).toHaveCount(6, { timeout: 30000 });
  await expect(page.getByRole("combobox", { name: "Track" })).toHaveValue("");

  await page.goto("/dashboard/shop/expeditions?track=Hardware");
  await expect(page.locator(".ex-card")).toHaveCount(2, { timeout: 30000 });
  await expect(page.getByRole("combobox", { name: "Track" })).toHaveValue("hardware");

  await page.goto("/dashboard/shop/expeditions?q=%20%20");
  await expect(page.locator(".ex-card")).toHaveCount(6, { timeout: 30000 });
  await expect(page.getByText("No expeditions match.")).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("");

  await page.goto(`/dashboard/shop/expeditions?q=${"a".repeat(100)}`);
  await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue("a".repeat(80));
  await expect(page.locator(".ex-card")).toHaveCount(0);
});

test("repeated filter and page values use the first one", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions?track=tools&track=art");
  await expect(page.locator(".ex-card")).toHaveCount(3, { timeout: 30000 });
  await expect(page.getByRole("combobox", { name: "Track" })).toHaveValue("tools");

  await page.goto("/dashboard/shop/expeditions?page=2&page=1");
  await expect(page.getByRole("navigation", { name: "Expedition pages" })).toContainText("Page 2 of 2", { timeout: 30000 });
});

test("the old status filter goes back to the list and keeps a valid track", async ({ request }) => {
  const plain = await request.get("/dashboard/shop/expeditions?status=locked", { maxRedirects: 0 });
  expect([307, 308]).toContain(plain.status());
  expect(plain.headers()["location"]).toBe("/dashboard/shop/expeditions");
  const track = await request.get("/dashboard/shop/expeditions?track=tools&status=locked", { maxRedirects: 0 });
  expect(track.headers()["location"]).toBe("/dashboard/shop/expeditions?track=tools");
});

test("the old status filter drops an invalid track on its way back to the list", async ({ request }) => {
  const invalid = await request.get("/dashboard/shop/expeditions?track=art&status=locked", { maxRedirects: 0 });
  expect([307, 308]).toContain(invalid.status());
  expect(invalid.headers()["location"]).toBe("/dashboard/shop/expeditions");
  const valid = await request.get("/dashboard/shop/expeditions?track=Hardware&status=shipped&q=tool", { maxRedirects: 0 });
  expect(valid.headers()["location"]).toBe("/dashboard/shop/expeditions?track=hardware");
});

test("an expedition is one column: header, steps with progress shown once, then reward, what it needs and what to send in", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions");
  await page.getByRole("link", { name: "Profile before you optimise" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Profile before you optimise" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveText(["Steps"]);
  await expect(page.locator(".ex-step")).toHaveCount(4);
  await expect(page.locator('.ex-step[data-state="done"]')).toHaveCount(2);
  await expect(page.locator('.ex-step[data-state="current"]')).toHaveCount(1);
  await expect(page.locator(".ex-step[data-state=current]")).toContainText("Find the hot spot");
  await expect(page.getByText("2 of 4 steps")).toHaveCount(1);
  const terms = page.locator(".ex-terms");
  await expect(terms).toContainText("40 Ore and CLOCKED");
  await expect(terms.getByRole("link", { name: "Build your first tool" })).toBeVisible();
  await expect(terms).toContainText("The before and after measurements");
  // Nothing repeats: no Next step, Prerequisites, Submission or Keep going boxes, and no disabled Submit button.
  await expect(page.getByRole("heading", { name: /Next step|Prerequisites|Submission|Keep going/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit for review" })).toHaveCount(0);
});

test("a locked expedition has no Equip button and links to what to finish first", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions/bare-metal");
  await expect(page.getByRole("heading", { level: 1, name: "Bare metal boot" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.ex-step[data-state="current"]')).toHaveCount(0);
  const line = page.locator(".ex-equip-line");
  await expect(line).toContainText("Finish Speak a protocol first");
  await expect(line.getByRole("link", { name: "Speak a protocol" })).toHaveAttribute("href", "/dashboard/shop/expeditions/packet-pusher");
  await expect(page.getByRole("button", { name: /^Equip/ })).toHaveCount(0);
});

test("a finished expedition has every step done and cannot be equipped again, and an untouched one starts at step 1", async ({ page }) => {
  await page.goto("/dashboard/shop/expeditions/first-tool");
  await expect(page.locator(".ex-equip-line")).toContainText("can't be equipped again", { timeout: 30000 });
  await expect(page.locator('.ex-step[data-state="done"]')).toHaveCount(5);
  await expect(page.getByRole("button", { name: /^Equip/ })).toHaveCount(0);
  await page.goto("/dashboard/shop/expeditions/toolmaker");
  await expect(page.locator(".ex-step[data-state=current]")).toContainText("Name who it is for", { timeout: 30000 });
});

async function deleteProject(page: Page, name: string) {
  await page.keyboard.press("Escape");
  // A failed step may leave the browser anywhere; return to the list and find the project before opening its settings.
  await page.goto("/dashboard/projects");
  const link = page.getByRole("link", { name, exact: true }).first();
  if ((await link.count()) === 0) return;
  await link.click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
  await openProjectTab(page, "settings");
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name);
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

// A failed earlier run can leave an expedition equipped on a leftover project. Free it, otherwise the Equip button never
// appears and the "one expedition at a time" message is replaced by the older equipment line.
async function freeExpedition(page: Page, slug: string, title: string) {
  const url = `/dashboard/shop/expeditions/${slug}`;
  await page.goto(url);
  try {
    for (let guard = 0; guard < 5 && (await page.getByRole("button", { name: "Equip on a project" }).count()) === 0; guard += 1) {
      const href = await page.locator(".ex-equip-line a").first().getAttribute("href");
      if (!href) break;
      await page.goto(href);
      await openProjectTab(page, "toolbelt");
      const takeOff = page.getByRole("button", { name: `Take ${title} off this project` });
      try {
        await expect(takeOff).toBeVisible({ timeout: 15000 });
      } catch {
        break;
      }
      await takeOff.click();
    }
  } finally {
    // Leave the browser on the expedition page even when a leftover project could not be freed.
    await page.goto(url);
  }
}

test("a builder equips an expedition on a project, sees it there, and a second equip is refused", async ({ page }) => {
  test.setTimeout(120000);
  const name = `Trial run ${Date.now()}`;
  await createProjectViaWizard(page, name, { track: "Tools" });
  try {
    await freeExpedition(page, "toolmaker", "Ship a tool someone else uses");
    // An expedition in another track cannot be equipped: Bare metal is Systems and locked besides.
    await expect(page.getByRole("heading", { level: 1, name: "Ship a tool someone else uses" })).toBeVisible({ timeout: 30000 });
    await expect(async () => {
      await page.getByRole("button", { name: "Equip on a project" }).click();
      await expect(page.getByRole("dialog", { name: "Equip Ship a tool someone else uses" })).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30000 });
    const dialog = page.getByRole("dialog", { name: "Equip Ship a tool someone else uses" });
    // Modal look: square radios, the grid on the panel and the backdrop, and the grain canvas inside the dialog.
    const look = await dialog.evaluate((element) => {
      const radio = element.querySelector("input[type=radio]");
      return {
        radius: radio ? getComputedStyle(radio).borderRadius : "missing",
        panelRadius: getComputedStyle(element).borderRadius,
        panelGrid: getComputedStyle(element).backgroundImage,
        backdropGrid: getComputedStyle(element, "::backdrop").backgroundImage,
        grain: element.querySelectorAll("canvas.grain").length,
      };
    });
    expect(look.radius).toBe("0px");
    expect(look.panelRadius).toBe("0px");
    expect(look.panelGrid).toContain("linear-gradient");
    expect(look.backdropGrid).toContain("linear-gradient");
    expect(look.grain).toBe(1);
    await dialog.getByRole("radio", { name }).check();
    await dialog.getByRole("button", { name: "Equip", exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
    // The detail shows the project and the hours counted, and the state is Equipped.
    const line = page.locator(".ex-equip-line");
    await expect(line).toContainText("Equipped on", { timeout: 15000 });
    await expect(line.getByRole("link", { name })).toBeVisible();
    await expect(line).toContainText("0 of 10 approved H counted");
    await expect(page.locator(".ex-status")).toHaveText("Equipped");
    await expect(page.getByRole("button", { name: /^Equip/ })).toHaveCount(0);

    // A second expedition cannot join the same project: the button is off and says why.
    await freeExpedition(page, "profile-it", "Profile before you optimise");
    await expect(page.getByRole("heading", { level: 1, name: "Profile before you optimise" })).toBeVisible({ timeout: 30000 });
    const equipButton = page.getByRole("button", { name: "Equip on a project" });
    if ((await equipButton.count()) > 0) {
      // Other Tools projects may exist from other runs; the new one must still be refused inside the dialog.
      await equipButton.click();
      const second = page.getByRole("dialog", { name: "Equip Profile before you optimise" });
      await expect(second.getByRole("radio", { name })).toBeDisabled();
      await expect(second).toContainText("A project carries one expedition at a time");
      await second.getByRole("button", { name: "Cancel" }).click();
    } else {
      await expect(page.locator(".ex-equip-line")).toContainText("A project carries one expedition at a time");
    }

    // The list shows where it is equipped.
    await page.goto("/dashboard/shop/expeditions?q=tool");
    const card = page.locator(".ex-card").filter({ hasText: "Ship a tool someone else uses" });
    await expect(card).toContainText("Equipped", { timeout: 30000 });
    await expect(card).toContainText(`On ${name}`);

    // The project's Toolbelt tab shows it with its steps, and the other Tools expeditions are off with the reason.
    await page.goto("/dashboard/projects");
    await page.getByRole("link", { name }).first().click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
    await openProjectTab(page, "toolbelt");
    const section = page.getByRole("region", { name: "Expedition" });
    await expect(section.getByRole("link", { name: "Ship a tool someone else uses" })).toBeVisible({ timeout: 15000 });
    await expect(section).toContainText("0 of 4 steps");
    await expect(section.getByRole("button", { name: "Take Ship a tool someone else uses off this project" })).toBeVisible();

    // Taking it off frees the project: the choice of expeditions comes back with Equip buttons.
    await section.getByRole("button", { name: "Take Ship a tool someone else uses off this project" }).click();
    await expect(section.getByRole("button", { name: "Equip Profile before you optimise" })).toBeEnabled({ timeout: 15000 });
    await expect(section.getByRole("button", { name: "Equip Build your first tool" })).toBeDisabled();
    await expect(section).toContainText("is finished, so it can");
    // Equip from the tab, then a second equip is refused by the page.
    await section.getByRole("button", { name: "Equip Profile before you optimise" }).click();
    await expect(section.getByRole("button", { name: "Take Profile before you optimise off this project" })).toBeVisible({ timeout: 15000 });
    await expect(section).toContainText("A project carries one expedition at a time");
    await expect(section.getByRole("button", { name: /^Equip / })).toHaveCount(0);
  } finally {
    await deleteProject(page, name).catch(() => undefined);
  }
});

// Review captures for the owner (list, detail, equip dialog, project tab). Off unless LOADOUT_TRIALS_SHOTS is set.
test("captures the trials screens", async ({ page }) => {
  test.skip(!process.env.LOADOUT_TRIALS_SHOTS, "captures only on request");
  test.setTimeout(240000);
  const name = `Shots run ${Date.now()}`;
  await createProjectViaWizard(page, name, { track: "Tools" });
  try {
    const out = "C:/Users/jerem/AppData/Local/Temp/loadout-shots";
    for (const [width, height] of [[1440, 900], [390, 844]] as const) {
      for (const scheme of SCHEMES) {
        await page.setViewportSize({ width, height });
        await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
        await page.evaluate((theme) => localStorage.setItem("loadout-theme", theme), scheme);
        const tag = `${width}-${scheme}`;
        await page.goto("/dashboard/shop/expeditions");
        await expect(page.locator(".ex-card").first()).toBeVisible({ timeout: 30000 });
        await page.screenshot({ path: `${out}/trials-list-${tag}.png`, fullPage: true });
        await page.goto("/dashboard/shop/expeditions/toolmaker");
        await expect(page.getByRole("heading", { level: 1, name: "Ship a tool someone else uses" })).toBeVisible({ timeout: 30000 });
        await page.screenshot({ path: `${out}/trials-detail-${tag}.png`, fullPage: true });
        await expect(async () => {
          await page.getByRole("button", { name: "Equip on a project" }).click();
          await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2000 });
        }).toPass({ timeout: 30000 });
        await page.screenshot({ path: `${out}/trials-equip-${tag}.png` });
        await page.keyboard.press("Escape");
        await page.goto("/dashboard/shop/expeditions/bare-metal");
        await expect(page.getByRole("heading", { level: 1, name: "Bare metal boot" })).toBeVisible({ timeout: 30000 });
        await page.screenshot({ path: `${out}/trials-locked-${tag}.png`, fullPage: true });
        await page.goto("/dashboard/projects");
        await page.getByRole("link", { name }).first().click();
        await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
        await openProjectTab(page, "toolbelt");
        await expect(page.getByRole("region", { name: "Expedition" }).getByRole("button", { name: "Equip Build your first tool" })).toBeVisible({ timeout: 15000 });
        await page.screenshot({ path: `${out}/trials-project-${tag}.png`, fullPage: true });
      }
    }
  } finally {
    await deleteProject(page, name).catch(() => undefined);
  }
});

test("an unknown expedition is a 404", async ({ page }) => {
  const response = await page.goto("/dashboard/shop/expeditions/no-such-mission");
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

test("Referrals has no tab; the account menu links to it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Participant" }).getByRole("link", { name: "Referrals" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open Referrals" })).toHaveCount(0);
  await page.getByRole("button", { name: /^Account/ }).click();
  await page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "Referrals" }).click();
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

test("an uppercase order number and uppercase tab names are still read", async ({ page }) => {
  await page.goto("/dashboard/orders/LO-1057");
  await expect(page.getByRole("heading", { level: 1, name: "Order LO-1057" })).toBeVisible({ timeout: 30000 });
  await page.goto("/dashboard/orders?tab=ORDERS");
  await expect(page.locator(".ex-order")).toHaveCount(3, { timeout: 30000 });
  await page.goto("/dashboard/orders?tab=WISHLIST");
  await expect(page.locator(".ex-wish")).toHaveCount(5, { timeout: 30000 });
});

for (const path of EXPEDITION_PAGES) {
  for (const [width, height] of EXPEDITION_VIEWPORTS) {
    for (const scheme of SCHEMES) {
      test(`${path} has no WCAG 2.2 AA violations or sideways scroll at ${width}px, ${scheme}`, async ({ page }) => {
        await setTheme(page, width, height, scheme);
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeAttached({ timeout: 30000 });
        await expect(page).toHaveTitle(/- LOADOUT$/);
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        if (width === 1440 || width === 390) {
          const name = path.replace(/^\/dashboard\/shop\/expeditions\/?/, "").replace(/[^a-z0-9]+/gi, "-") || "list";
          await page.screenshot({ path: `C:/Users/jerem/AppData/Local/Temp/loadout-shots/expeditions-e2e-${name}-${width}-${scheme}.png`, fullPage: true });
        }
      });
    }
  }
}

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
