import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { openProjectTab } from "./new-project-helper";

// Redesign phase 2: the project creation wizard at /dashboard/projects/new (brief .ulpi/design/redesign-phase-2-wizard.md).
// Local development opens without sign-in as the builder test account. Every project made here is deleted through the project
// page at the end, so no rows are left behind. Screenshots go to the scratch folder, never into the repository.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const SHOTS = process.env.LOADOUT_SHOT_DIR ?? "C:\\Users\\jerem\\AppData\\Local\\Temp\\loadout-shots";
mkdirSync(SHOTS, { recursive: true });
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";

const IDEA = "A small packet router for my home network.";
const NAMES = ["kind", "idea", "name", "links", "review"] as const;

async function setup(page: Page, width: number, height: number, scheme: "dark" | "light" = "dark", reduced = true) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference", colorScheme: scheme });
  await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
}

async function openWizard(page: Page) {
  await page.goto("/dashboard/projects/new");
  await expect(page.getByRole("heading", { level: 1, name: "What kind of project is it?" })).toBeVisible({ timeout: 30000 });
}

// Picks Software, goes to the Track step and picks a track, and stays on that step. Retried until the page has its script,
// because an early click does nothing.
async function pickSoftware(page: Page, track = "Systems") {
  await expect(async () => {
    const software = page.getByRole("radio", { name: /^Software/ });
    if (await software.isVisible()) {
      await software.check();
      await page.getByRole("button", { name: "Next" }).click();
    }
    await page.getByRole("radio", { name: new RegExp(`^${track}`) }).check();
    await expect(page.getByRole("button", { name: "Next" })).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
}

const next = (page: Page) => page.getByRole("button", { name: /^(Next|Skip)$/ });

async function toStep(page: Page, step: number, options: { track?: string; title?: string } = {}) {
  await openWizard(page);
  if (step === 0) return;
  await pickSoftware(page, options.track);
  await next(page).click();
  if (step === 1) return;
  await page.getByLabel("Your idea").fill(IDEA);
  await next(page).click();
  if (step === 2) return;
  await page.getByLabel("Project name").fill(options.title ?? "Mini router");
  await next(page).click();
  if (step === 3) return;
  await next(page).click();
}

async function deleteProject(page: Page, name: string) {
  await page.goto("/dashboard/projects");
  await page.getByRole("link", { name: new RegExp(name) }).first().click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
  await openProjectTab(page, "settings");
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name);
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe.configure({ mode: "default" });

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`each of the five steps shows at ${width}px with no sideways scroll`, async ({ page }) => {
    test.skip(STAFF_MODE, "participant pages are checked in builder mode");
    test.setTimeout(90000);
    await setup(page, width, height);
    const steps = page.getByRole("list", { name: "Steps" });
    await openWizard(page);
    await expect(steps.getByRole("listitem")).toHaveCount(5);
    await expect(steps.getByRole("button", { name: /^01 kind/ })).toHaveAttribute("aria-current", "step");
    // A new draft starts with nothing chosen, so Next waits for a pick.
    await expect(page.getByRole("radio", { name: /^Hardware/ })).not.toBeChecked();
    await expect(page.getByRole("radio", { name: /^Software/ })).not.toBeChecked();
    await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: join(SHOTS, `redesign-p2-step1-kind-${width}.png`) });

    await pickSoftware(page);
    await expect(page.getByRole("radio", { name: /^Systems/ })).toBeChecked();
    await page.screenshot({ path: join(SHOTS, `redesign-p2-step1-software-${width}.png`) });
    await next(page).click();
    await expect(page.getByRole("heading", { level: 1, name: "What's your idea?" })).toBeFocused();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await page.getByLabel("Your idea").fill(IDEA);
    await page.screenshot({ path: join(SHOTS, `redesign-p2-step2-idea-${width}.png`) });
    await next(page).click();
    await expect(page.getByRole("heading", { level: 1, name: "What's it called?" })).toBeFocused();
    await page.getByLabel("Project name").fill("Mini router");
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: join(SHOTS, `redesign-p2-step3-name-${width}.png`) });
    await next(page).click();
    await expect(page.getByRole("heading", { level: 1, name: "Link it up" })).toBeFocused();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: join(SHOTS, `redesign-p2-step4-links-${width}.png`) });
    await next(page).click();
    await expect(page.getByRole("heading", { level: 1, name: "Ready to start?" })).toBeFocused();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: join(SHOTS, `redesign-p2-step5-review-${width}.png`) });
    // Nothing was created, so there is nothing to clean up. Leaving drops the saved draft.
    await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
  });
}

test("Software reveals Tools, Systems and Compute, and Hardware needs no second choice", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  await openWizard(page);
  const steps = page.getByRole("list", { name: "Steps" });
  await expect(page.getByRole("radio", { name: /^(Tools|Systems|Compute)/ })).toHaveCount(0);
  await expect(page.getByText("Decide later")).toHaveCount(0);
  // Software adds the Track step, so the wizard grows to six stops and waits for a track.
  await expect(async () => {
    await page.getByRole("radio", { name: /^Software/ }).check();
    await expect(steps.getByRole("listitem")).toHaveCount(6, { timeout: 1000 });
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Which track is it?" })).toBeFocused({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await expect(steps.getByRole("button", { name: /^02 track/ })).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("radio", { name: /^Tools/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Systems/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Compute/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Hardware$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await page.getByRole("radio", { name: /^Compute/ }).check();
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
  // Hardware is its own kind on the first step, so picking it drops the Track step again.
  await steps.getByRole("button", { name: /^01 kind/ }).click();
  await page.getByRole("radio", { name: /^Hardware/ }).check();
  await expect(steps.getByRole("listitem")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "What's your idea?" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Tools/ })).toHaveCount(0);
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});

test("a spark fills the idea, More ideas rotates, and Undo brings back what was there", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  await toStep(page, 1);
  const idea = page.getByLabel("Your idea");
  const sparks = page.locator(".pf-wiz-spark");
  await expect(sparks).toHaveCount(3);
  const first = await sparks.allTextContents();
  await sparks.first().click();
  const wrote = await idea.inputValue();
  expect(wrote.toLowerCase()).toBe(first[0].toLowerCase());
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
  await expect(page.getByText(`${wrote.length} / 500`)).toBeVisible();

  // Rotation: the next three are different from these three.
  await page.getByRole("button", { name: "More ideas" }).click();
  const second = await sparks.allTextContents();
  expect(second.filter((line) => first.includes(line))).toHaveLength(0);

  // A second spark over typed text offers Undo.
  await idea.fill("My own words for this one.");
  await sparks.first().click();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(idea).toHaveValue("My own words for this one.");
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});

test("the idea needs 10 characters and says so, and short text under 40 gets the ship hint", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  await toStep(page, 1);
  const idea = page.getByLabel("Your idea");
  await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
  await idea.fill("Too short");
  // Enter is a newline in the idea box; the Next button is what asks for the missing characters.
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "What's your idea?" })).toBeVisible();
  await expect(page.getByText("Write at least 10 characters.")).toBeVisible();
  await expect(idea).toHaveAttribute("aria-invalid", "true");
  await expect(idea).toHaveAccessibleDescription(/Write at least 10 characters/);
  await idea.fill("A slightly longer idea");
  await expect(page.getByText("Add a bit more before you ship: 40 characters is the minimum.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});

test("the preview card follows the name, the idea and the track", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  await toStep(page, 2, { track: "Compute" });
  const card = page.getByTestId("project-preview");
  await expect(card).toContainText("untitled");
  await expect(card).toContainText("Compute");
  await expect(card).toContainText(IDEA);
  await page.getByLabel("Project name").fill("Neural scratchpad");
  await expect(card).toContainText("Neural scratchpad");
  await expect(card).not.toContainText("untitled");
  await expect(page.getByText("17 / 80")).toBeVisible();
  await expect(page.getByText("Every project is public, including drafts and journals. Do not put personal details in them.")).toBeVisible();
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});

test("the links step is optional, checks the addresses and shows no Hackatime notice", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  await toStep(page, 3);
  // No Hackatime notice and no invented projects or hours while it is not connected.
  await expect(page.getByText(/Hackatime/i)).toHaveCount(0);
  await expect(page.getByText(/\d+(\.\d+)? ?h\b/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  const repo = page.getByLabel("Source address");
  await repo.fill("http://github.com/example/router");
  await repo.blur();
  await expect(page.getByText("The source link must start with https://.")).toBeVisible();
  await expect(repo).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  await repo.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Link it up" })).toBeVisible();
  await repo.fill("https://github.com/example/router");
  await repo.blur();
  await expect(page.getByText("The source link must start with https://.")).toHaveCount(0);
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});

test("the hardware path shows the Lapse note instead of Hackatime", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  await openWizard(page);
  await expect(async () => {
    await page.getByRole("radio", { name: /^Hardware/ }).check();
    await expect(next(page)).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await next(page).click();
  await page.getByLabel("Your idea").fill("A line following robot.");
  await next(page).click();
  await page.getByLabel("Project name").fill("Line bot");
  await next(page).click();
  await expect(page.getByText("Hardware projects use a Lapse recording. You will link it in your journal entry.")).toBeVisible();
  await expect(page.getByText("Hackatime is not connected yet.")).toHaveCount(0);
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});

test("review shows the track, Create lands on the new project's page with the draft, and the grid tile opens the wizard", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(90000);
  await setup(page, 1440, 900);
  const name = `Wizard check ${Date.now()}`;
  await toStep(page, 2);
  await page.getByLabel("Project name").fill(name);
  await next(page).click();
  await page.getByLabel("Source address").fill("https://github.com/example/router");
  await next(page).click();
  const review = page.getByRole("heading", { level: 1, name: "Ready to start?" });
  await expect(review).toBeVisible();
  // Clicking Skip or Next on the links step must never create the project: only Create project does.
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/\/dashboard\/projects\/new$/);
  // The last screen is only the project card, with its track.
  await expect(page.getByTestId("project-preview")).toContainText("Systems");
  await page.getByRole("button", { name: "Create project" }).click({ noWaitAfter: true });
  try {
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Project created. It is public. Write your first journal entry when you start work.")).toBeVisible();
    await expect(page.locator(".pf-column-pill")).toHaveText("Draft");
    await expect(page.locator(".pf-column-tag")).toHaveText("Systems");
    await expect(page.locator(".pf-project-lead")).toHaveText(IDEA);
    await page.screenshot({ path: join(SHOTS, "redesign-p2-created-1440.png") });
    // The saved draft is gone, so a new wizard starts empty. The grid tile opens the page.
    await page.goto("/dashboard/projects");
    await page.getByTestId("new-project").click();
    await expect(page).toHaveURL(/\/dashboard\/projects\/new$/);
    await expect(page.getByRole("heading", { level: 1, name: "What kind of project is it?" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /^Software/ })).not.toBeChecked();
  } finally {
    await deleteProject(page, name);
  }
});

test("a refresh keeps the draft and Close asks before it throws it away", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  await toStep(page, 2, { title: "Half done" });
  await page.getByLabel("Project name").fill("Half done");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "What's it called?" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByLabel("Project name")).toHaveValue("Half done");
  await page.getByRole("link", { name: /Close/ }).click();
  const dialog = page.getByRole("dialog", { name: "Leave without creating?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Leave without creating? Nothing is saved.")).toBeVisible();
  await dialog.getByRole("button", { name: "Stay" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel("Project name")).toHaveValue("Half done");
  await page.getByRole("link", { name: /Close/ }).click();
  await dialog.getByRole("button", { name: "Leave" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
  await page.goto("/dashboard/projects/new");
  await expect(page.getByRole("heading", { level: 1, name: "What kind of project is it?" })).toBeVisible({ timeout: 30000 });
});

test("a keyboard alone finishes every step and focus follows the heading", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(90000);
  await setup(page, 1440, 900);
  const name = `Keys check ${Date.now()}`;
  await openWizard(page);
  // Wait for the script before typing keys.
  await expect(async () => {
    await page.getByRole("radio", { name: /^Hardware/ }).check();
    await expect(next(page)).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  // Move focus onto the radios with Tab, pick Software with the arrow key, then Enter moves to the Track step, where Tab
  // reaches the Tools radio.
  await page.getByRole("radio", { name: /^Hardware/ }).focus();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("radio", { name: /^Software/ })).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Which track is it?" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: /^Tools/ })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: /^Tools/ })).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "What's your idea?" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Your idea")).toBeFocused();
  await page.keyboard.type("A tool that tidies my notes.");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "What's it called?" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Project name")).toBeFocused();
  await page.keyboard.type(name);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Link it up" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Source address")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Ready to start?" })).toBeFocused();
  const create = page.getByRole("button", { name: "Create project" });
  await create.focus();
  await page.keyboard.press("Enter");
  try {
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
  } finally {
    await deleteProject(page, name);
  }
});

test("step buttons go back to a finished step and never forward past an invalid one", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  await toStep(page, 2);
  const steps = page.getByRole("list", { name: "Steps" });
  await expect(steps.getByRole("button", { name: /^05 links/ })).toBeDisabled();
  await steps.getByRole("button", { name: /^01 kind/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "What kind of project is it?" })).toBeFocused();
  await expect(page.getByRole("radio", { name: /^Software/ })).toBeChecked();
  // The Track step is finished too, and it kept its pick.
  await steps.getByRole("button", { name: /^02 track/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Which track is it?" })).toBeFocused();
  await expect(page.getByRole("radio", { name: /^Systems/ })).toBeChecked();
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});

for (const scheme of ["dark", "light"] as const) {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    test(`axe finds nothing on any of the five steps at ${width}px in ${scheme}`, async ({ page }) => {
      test.skip(STAFF_MODE, "participant pages are checked in builder mode");
      test.setTimeout(120000);
      await setup(page, width, height, scheme);
      for (let step = 0; step < 5; step += 1) {
        if (step === 0) await openWizard(page);
        else if (step === 1) {
          await pickSoftware(page);
          await next(page).click();
        } else if (step === 2) {
          await page.getByLabel("Your idea").fill(IDEA);
          await next(page).click();
        } else if (step === 3) {
          await page.getByLabel("Project name").fill("Axe router");
          await next(page).click();
        } else {
          await next(page).click();
        }
        await expect(page.getByRole("heading", { level: 1, name: /^(What kind of project is it\?|What's your idea\?|What's it called\?|Link it up|Ready to start\?)$/ })).toBeVisible();
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(result.violations.map((v) => `step ${NAMES[step]}: ${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
        expect(await overflow(page)).toBeLessThanOrEqual(0);
        if (scheme === "light") await page.screenshot({ path: join(SHOTS, `redesign-p2-step${step + 1}-${NAMES[step]}-${width}-light.png`) });
      }
      await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
    });
  }
}

test("with motion allowed the step change still lands on the heading, and the page does not scroll sideways at 320", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 320, 568, "dark", false);
  await openWizard(page);
  await pickSoftware(page);
  await next(page).click();
  await expect(page.getByRole("heading", { level: 1, name: "What's your idea?" })).toBeFocused();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});

test("a saved draft with no track stays on the kind step", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await setup(page, 1440, 900);
  // A draft with a name and an idea but no track.
  await page.goto("/dashboard/projects");
  await page.evaluate(() => sessionStorage.setItem("loadout-new-project", JSON.stringify({ track: "", description: "A valid idea that is long enough.", title: "No track", repoUrl: "", demoUrl: "" })));
  await page.goto("/dashboard/projects/new");
  await expect(page.getByRole("heading", { level: 1, name: "What kind of project is it?" })).toBeVisible({ timeout: 30000 });
  await expect(next(page)).toBeDisabled();
  await page.evaluate(() => sessionStorage.removeItem("loadout-new-project"));
});
