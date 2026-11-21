import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createProjectViaWizard, openProjectTab } from "./new-project-helper";

// Toolbelt on the project page (design specs .ulpi/design/profile-and-toolbelt.md and stardance-layout.md section F) and the source
// and demo address fields of Edit project. The builder test account opens without sign-in locally. Seeded tools: Tinyparse and
// Palette Forge by juniper_dev, Orbit Sim and Gridlock by kestrel, Pocket Synth by pixel-fox, Tape Deck by bolt_nine. The test
// builder has saved Tinyparse, Tape Deck and Orbit Sim. Each test makes its own project through the creation wizard and deletes
// it through the UI at the end.
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";
// The Saved set belongs to the one builder test account in the shared database, and two tests here toggle it. Keep this
// file in one worker so its own Save test cannot race its keyboard and axe tests.
test.describe.configure({ mode: "serial" });

async function createProject(page: Page, name: string) {
  await createProjectViaWizard(page, name);
  // The Toolbelt is its own tab on the project page.
  await openProjectTab(page, "toolbelt");
  await expect(page.getByRole("heading", { level: 2, name: "Toolbelt" })).toBeVisible();
}

async function deleteProject(page: Page, name: string) {
  // A failed step may leave a dialog open; Escape closes it so the clean-up can reach the page.
  await page.keyboard.press("Escape");
  await openProjectTab(page, "settings");
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name);
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

const finder = (page: Page) => page.getByRole("combobox", { name: "Find a tool" });
const NOTE_A = "The config feature reads its rules with Tinyparse in src/rules.ts.";
const NOTE_B = "The build pipeline schedules every step through Gridlock in src/jobs.ts.";

// Search and pick the one result with Enter (Enter waits for the rows of the typed text, so wait for them first).
async function pick(page: Page, query: string) {
  const box = finder(page);
  await box.fill(query);
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(box).toHaveAttribute("aria-activedescendant", /.+/);
  await box.press("Enter");
}

// Pick a tool, write the note, press Equip tool.
async function equip(page: Page, query: string, note: string) {
  await pick(page, query);
  await page.getByLabel("How does your project use it?").fill(note);
  await page.getByRole("button", { name: "Equip tool" }).click();
}

async function removeTool(page: Page, title: string) {
  await page.getByRole("button", { name: `Remove ${title}` }).click();
  const confirm = page.getByRole("dialog", { name: `Remove ${title}?` });
  await confirm.getByRole("button", { name: "Remove tool" }).click();
  await expect(confirm).toBeHidden({ timeout: 15000 });
}

test("the Toolbelt shows the finder, two free slots and a gate card that never claims payment", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt gate ${Date.now()}`;
  await createProject(page, name);
  try {
    const belt = page.getByRole("region", { name: "Toolbelt" });
    await expect(belt.getByText("0 of 2 slots in use")).toBeVisible();
    await expect(finder(page)).toBeVisible();
    await expect(belt.getByText("Search approved open-source projects from other builders. Press the star to save one for later.")).toBeVisible();
    await expect(belt.getByText("Slot 1 is free")).toBeVisible();
    await expect(belt.getByText("Slot 2 is free")).toBeVisible();
    // No dialog is used to equip.
    await expect(page.getByRole("button", { name: "Equip a tool" })).toHaveCount(0);

    const gate = belt.getByRole("region", { name: "Before a use counts" });
    await expect(gate.getByText("The project has 25 approved hours")).toBeVisible();
    await expect(gate.getByText("0 of 25 H")).toBeVisible();
    await expect(gate.getByText("Checked at review")).toHaveCount(3);
    await expect(gate.getByText("A reviewer confirms each use after you submit. Nothing here pays Ore.")).toBeVisible();
    // Only the hours line can tick, and nothing is ticked at 0 hours.
    await expect(gate.locator('li[data-done="true"]')).toHaveCount(0);

    // The reward numbers appear once, marked provisional, with no link.
    await expect(page.getByText(/50 Ore/)).toHaveCount(1);
    const note = belt.locator(".pf-belt-note");
    await expect(note).toContainText("Rewards: 50 Ore once per tool");
    await expect(note.getByRole("link")).toHaveCount(0);
  } finally {
    await deleteProject(page, name);
  }
});

test("a builder finds tools with the combobox, equips two with an inline step, sees the exact refusals and removes both", async ({ page }) => {
  test.setTimeout(120000);
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt equip ${Date.now()}`;
  await createProject(page, name);
  try {
    const box = finder(page);
    // ARIA wiring of the editable combobox.
    await expect(box).toHaveAttribute("aria-autocomplete", "list");
    await expect(box).toHaveAttribute("aria-expanded", "false");

    // Typing shows the match with the typed text marked, and the status line follows after a pause.
    await box.fill("tinyp");
    const option = page.getByRole("option");
    await expect(option).toHaveCount(1);
    await expect(option).toContainText("Tinyparse");
    await expect(option.locator("mark").first()).toHaveText("Tinyp");
    await expect(option).toContainText("github.com/example-handle/tinyparse");
    await expect(page.getByRole("status").filter({ hasText: "1 tool matches." })).toBeVisible();
    await expect(box).toHaveAttribute("aria-expanded", "true");
    // A lone result is already active.
    await expect(box).toHaveAttribute("aria-activedescendant", /.+/);

    // Your own project, a closed-source one and one still in review are never offered.
    for (const absent of ["cable tidy", "lamp bus", "fan curve"]) {
      await box.fill(absent);
      await expect(page.getByRole("status").filter({ hasText: "No tools match. Clear the search." })).toBeVisible();
      await expect(page.getByRole("option")).toHaveCount(0);
    }
    await box.fill("zzzz");
    await expect(page.locator(".pf-finder-pop").getByRole("button", { name: "Clear", exact: true })).toBeVisible();

    // Pick Tinyparse with Enter: the inline step opens, the note has focus, no dialog.
    await box.fill("tinyp");
    await expect(option).toHaveCount(1);
    await box.press("Enter");
    const step = page.getByRole("group", { name: "Equip Tinyparse" });
    await expect(step).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const noteField = page.getByLabel("How does your project use it?");
    await expect(noteField).toBeFocused();
    await expect(step.getByText("Name the file or feature that uses the tool. Example:")).toBeVisible();
    await expect(step.locator(".pf-belt-counter")).toHaveText("0 of 500");

    // Empty note, then a note that names nothing: the server's messages, next to the field.
    await step.getByRole("button", { name: "Equip tool" }).click();
    await expect(step.getByText(/^Write at least 10 characters\. Say where it is used/)).toBeVisible();
    await expect(noteField).toHaveAttribute("aria-invalid", "true");
    await expect(noteField).toBeFocused();
    await noteField.fill("I like it a lot.");
    await step.getByRole("button", { name: "Equip tool" }).click();
    await expect(step.getByText(/^Name the file or feature that uses it\./)).toBeVisible();
    await expect(step.locator(".pf-belt-counter")).toHaveText("16 of 500");

    // Escape inside the step cancels it and gives focus back to the finder.
    await page.keyboard.press("Escape");
    await expect(step).toBeHidden();
    await expect(box).toBeFocused();
    await expect(box).toHaveValue("");

    await equip(page, "tinyp", NOTE_A);
    // The new slot shows the Pending chip, the note and Remove; the chip has focus; the status line says what happens next.
    const slot = page.locator("li.pf-belt-slot", { hasText: "Tinyparse" });
    await expect(slot.locator(".pf-belt-chip")).toHaveText("Pending", { timeout: 15000 });
    await expect(slot.locator(".pf-belt-chip")).toBeFocused();
    await expect(slot.getByText(NOTE_A)).toBeVisible();
    await expect(slot.getByRole("link", { name: "juniper_dev" })).toHaveAttribute("href", "/dashboard/builders/juniper_dev");
    await expect(page.getByRole("status").filter({ hasText: "Equip sent. It stays Pending until a reviewer confirms it." })).toBeVisible();
    await expect(page.getByText("1 of 2 slots in use").first()).toBeVisible();
    await expect(page.getByText("Slot 2 is free")).toBeVisible();

    // A tool already on the belt is not offered again.
    await finder(page).fill("tinyp");
    await expect(page.getByRole("status").filter({ hasText: "No tools match. Clear the search." })).toBeVisible();

    // A second tool fills the belt: the finder goes and the line says why.
    await equip(page, "gridl", NOTE_B);
    await expect(page.getByText("Both slots are in use. Remove one to equip another.")).toBeVisible({ timeout: 15000 });
    await expect(finder(page)).toHaveCount(0);
    await expect(page.getByText("2 of 2 slots in use").first()).toBeVisible();

    // Remove opens a confirm dialog with Cancel focused. Escape cancels and focus returns to the Remove button.
    const confirm = page.getByRole("dialog", { name: "Remove Gridlock?" });
    await page.getByRole("button", { name: "Remove Gridlock" }).click();
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText("Its use note is deleted. You can equip it again later.")).toBeVisible();
    await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(confirm).toBeHidden();
    await expect(page.getByRole("button", { name: "Remove Gridlock" })).toBeFocused();

    // Confirm: the slot empties, the status line says so, and focus goes to the finder.
    await page.getByRole("button", { name: "Remove Gridlock" }).click();
    await confirm.getByRole("button", { name: "Remove tool" }).click();
    await expect(confirm).toBeHidden({ timeout: 15000 });
    await expect(page.getByRole("status").filter({ hasText: "Removed Gridlock." })).toBeVisible();
    await expect(finder(page)).toBeFocused({ timeout: 15000 });

    await removeTool(page, "Tinyparse");
    await expect(page.getByText("0 of 2 slots in use").first()).toBeVisible({ timeout: 15000 });
  } finally {
    await deleteProject(page, name);
  }
});

test("the combobox works from the keyboard: Down opens and wraps, Enter picks, Escape closes then clears, Tab reaches the actions", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt keys ${Date.now()}`;
  await createProject(page, name);
  try {
    const box = finder(page);
    const status = page.getByRole("status").filter({ hasText: "Saved and most used tools." });
    // The finder's key handler is attached on hydration. Retry the whole Down press until the results status appears, so
    // a press lost to a cold route does not fail the keyboard behaviour this test is here to check.
    await expect(async () => {
      await box.focus();
      await page.keyboard.press("ArrowDown");
      await expect(status).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 30000 });
    // The empty query shows the Saved group first (Tinyparse, Tape Deck and Orbit Sim are saved for the test builder).
    const saved = page.getByRole("group", { name: "Saved" });
    await expect(saved).toBeVisible({ timeout: 15000 });
    await expect(saved.getByRole("option")).toHaveCount(3);
    await expect(page.getByRole("listbox", { name: "Tools" })).toBeVisible();
    const options = page.getByRole("option");
    // Focus stays in the field while the arrows move the active option.
    await expect(box).toBeFocused();
    const first = await options.first().getAttribute("id");
    const last = await options.last().getAttribute("id");
    await page.keyboard.press("ArrowUp");
    await expect(box).toHaveAttribute("aria-activedescendant", last!);
    await page.keyboard.press("ArrowDown");
    await expect(box).toHaveAttribute("aria-activedescendant", first!);
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await expect(box).toBeFocused();

    // Escape once closes the list and keeps the text; Escape again clears it.
    await box.fill("tape");
    await expect(options).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(box).toHaveAttribute("aria-expanded", "false");
    await expect(box).toHaveValue("tape");
    await page.keyboard.press("Escape");
    await expect(box).toHaveValue("");

    // Enter on the active option opens the step; Escape cancels it and the finder has focus again.
    await box.fill("orbit");
    await expect(options).toHaveCount(1);
    await expect(options).toContainText("Orbit Sim");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("group", { name: "Equip Orbit Sim" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(box).toBeFocused();

    // Tab reaches the finder's actions before leaving. The list stays open while focus is inside it.
    await box.fill("pa");
    await expect(options.first()).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Clear search" })).toBeFocused();
    await expect(page.getByRole("listbox", { name: "Tools" })).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /^Save / }).first()).toBeFocused();
    await page.getByRole("heading", { level: 2, name: "Toolbelt" }).click();
    await expect(box).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("group", { name: /^Equip / })).toHaveCount(0);
  } finally {
    await deleteProject(page, name);
  }
});

test("the Save star in a result flips at once, reports in the status line and puts the project first next time", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt save ${Date.now()}`;
  await createProject(page, name);
  try {
    const box = finder(page);
    await box.fill("orbit");
    const star = page.getByRole("button", { name: "Save Orbit Sim" });
    await expect(star).toHaveAttribute("aria-pressed", "true");
    // The label never changes with the state; aria-pressed carries it.
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await expect(star).toHaveAccessibleName("Save Orbit Sim");
    await expect(page.getByRole("status").filter({ hasText: "Removed Orbit Sim from Saved." })).toBeVisible();
    // Alt+S toggles the highlighted result (the lone result is already active).
    await box.press("Alt+s");
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status").filter({ hasText: "Saved Orbit Sim." })).toBeVisible();

    // Save Gridlock, and it is in the Saved group the next time the list opens.
    await box.fill("gridl");
    const gridlock = page.getByRole("button", { name: "Save Gridlock" });
    await gridlock.click();
    await expect(gridlock).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status").filter({ hasText: "Saved Gridlock." })).toBeVisible();
    await box.fill("");
    await expect(page.getByRole("group", { name: "Saved" }).getByRole("option")).toHaveCount(4, { timeout: 10000 });
    // Put it back.
    await box.fill("gridl");
    await page.getByRole("button", { name: "Save Gridlock" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Removed Gridlock from Saved." })).toBeVisible();
  } finally {
    // Restore the seeded Saved set even if a step above failed, then delete the project.
    const restore = async (query: string, label: string, wantSaved: boolean) => {
      await finder(page).fill(query);
      const star = page.getByRole("button", { name: label });
      if ((await star.getAttribute("aria-pressed")) !== String(wantSaved)) await star.click();
    };
    await restore("orbit", "Save Orbit Sim", true).catch(() => undefined);
    await restore("gridl", "Save Gridlock", false).catch(() => undefined);
    await deleteProject(page, name);
  }
});

test("a saved tool is offered under the slots and equips in two actions", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt saved ${Date.now()}`;
  await createProject(page, name);
  try {
    const saved = page.getByRole("region", { name: "Saved tools" });
    await expect(saved.getByRole("button", { name: "Equip Tinyparse" })).toBeVisible();
    await expect(saved.getByRole("link", { name: "See all saved" })).toHaveAttribute("href", "/dashboard/explore?saved=1");
    await saved.getByRole("button", { name: "Equip Tinyparse" }).click();
    await expect(page.getByRole("group", { name: "Equip Tinyparse" })).toBeVisible();
    await expect(finder(page)).toHaveValue("Tinyparse");
    await page.getByLabel("How does your project use it?").fill(NOTE_A);
    await page.getByRole("button", { name: "Equip tool" }).click();
    await expect(page.locator("li.pf-belt-slot", { hasText: "Tinyparse" }).locator(".pf-belt-chip")).toHaveText("Pending", { timeout: 15000 });
    // Once equipped it leaves the Saved tools list.
    await expect(saved.getByRole("button", { name: "Equip Tinyparse" })).toHaveCount(0);
    await removeTool(page, "Tinyparse");
    await expect(page.getByText("0 of 2 slots in use").first()).toBeVisible({ timeout: 15000 });
  } finally {
    await deleteProject(page, name);
  }
});

test("the server refuses a duplicate and a third tool with its own messages", async ({ page, context }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(120000);
  const name = `Belt refuse ${Date.now()}`;
  await createProject(page, name);
  const other = await context.newPage();
  try {
    await other.goto(page.url());
    await expect(finder(other)).toBeVisible({ timeout: 30000 });

    // Page one opens the step for Tinyparse; page two equips it first.
    await pick(page, "tinyp");
    await page.getByLabel("How does your project use it?").fill(NOTE_A);
    await equip(other, "tinyp", NOTE_A);
    await expect(other.locator("li.pf-belt-slot", { hasText: "Tinyparse" })).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Equip tool" }).click();
    await expect(page.getByText("That tool is already equipped in this project.")).toBeVisible({ timeout: 15000 });

    // Page one opens the step for a third tool; page two fills the belt first, so the server refuses the third.
    await page.bringToFront();
    await pick(page, "orbit");
    await page.getByLabel("How does your project use it?").fill("The simulation feature calls Orbit Sim in src/orbit.ts.");
    await equip(other, "gridl", NOTE_B);
    await expect(other.getByText("Both slots are in use. Remove one to equip another.")).toBeVisible({ timeout: 15000 });
    await page.bringToFront();
    await page.getByRole("button", { name: "Equip tool" }).click();
    await expect(page.getByText("A project can equip up to 2 tools. Remove one first.")).toBeVisible({ timeout: 15000 });
  } finally {
    await other.close();
    await page.reload();
    for (const title of ["Tinyparse", "Gridlock"]) {
      if ((await page.getByRole("button", { name: `Remove ${title}` }).count()) > 0) {
        await removeTool(page, title);
        await expect(page.getByRole("button", { name: `Remove ${title}` })).toHaveCount(0, { timeout: 15000 });
      }
    }
    await deleteProject(page, name);
  }
});

test("Settings checks the source and demo addresses with plain messages and saves good ones", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt links ${Date.now()}`;
  await createProject(page, name);
  try {
    await openProjectTab(page, "settings");
    const form = page.getByRole("region", { name: "Project details" });
    const save = form.getByRole("button", { name: "Save changes" });
    const repo = form.getByLabel(/^Source code address/);
    const demo = form.getByLabel(/^Demo address/);
    await expect(form.getByText("A public https address. Needed if you want other builders to equip your project from the Toolbelt.")).toBeVisible();

    await repo.fill("http://github.com/example-handle/spec-tool");
    await save.click();
    await expect(form.getByText("The source link must start with https://.")).toBeVisible();
    await expect(repo).toHaveAttribute("aria-invalid", "true");

    await repo.fill("not an address");
    await save.click();
    await expect(form.getByText(/^The source link has a space or an unusual character./)).toBeVisible();

    await repo.fill("https://github.com/example-handle/spec-tool");
    await demo.fill("https://localhost/demo");
    await save.click();
    await expect(form.getByText(/^The demo link has to point at a public website/)).toBeVisible();
    await expect(repo).not.toHaveAttribute("aria-invalid", "true");

    await demo.fill("https://spec-tool.example/demo");
    await save.click();
    await expect(form.getByRole("status")).toHaveText("Saved.", { timeout: 15000 });

    // Saved: reloading the tab shows both addresses, and the header lists them.
    await openProjectTab(page, "settings");
    await expect(page.getByRole("region", { name: "Project details" }).getByLabel(/^Source code address/)).toHaveValue("https://github.com/example-handle/spec-tool");
    await expect(page.getByRole("region", { name: "Project details" }).getByLabel(/^Demo address/)).toHaveValue("https://spec-tool.example/demo");
    await expect(page.getByRole("link", { name: /^Source/ })).toHaveAttribute("href", "https://github.com/example-handle/spec-tool");
    await expect(page.getByRole("link", { name: /^Demo/ })).toHaveAttribute("href", "https://spec-tool.example/demo");
  } finally {
    await deleteProject(page, name);
  }
});

test("an approved project shows closed slots with a reason and the maker view with Block", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await page.goto("/dashboard/projects");
  const card = page.getByRole("link", { name: /Cable Tidy/ });
  test.skip((await card.count()) === 0, "needs the seeded approved project Cable Tidy");
  await card.first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Cable Tidy" })).toBeVisible({ timeout: 30000 });
  await openProjectTab(page, "toolbelt");

  // No finder: the reason line says why, and the slots stay listed as empty.
  await expect(finder(page)).toHaveCount(0);
  await expect(page.getByText("Equips are closed once a project is submitted. They open again if a reviewer asks for changes.")).toBeVisible();
  await expect(page.getByText("Slot 1 is empty")).toBeVisible();

  // The maker view: Cable Tidy is approved and has a source address. Block opens its confirm dialog; Cancel leaves everything as it was.
  await expect(page.getByRole("heading", { level: 2, name: "Toolbelt users" })).toBeVisible();
  const block = page.getByRole("button", { name: /^Block / }).first();
  if ((await block.count()) > 0) {
    await block.click();
    const confirm = page.getByRole("dialog", { name: /^Block / });
    await expect(confirm).toBeVisible();
    await expect(confirm.getByText("They cannot equip any of your tools again.")).toBeVisible();
    await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(confirm).toBeHidden();
    await expect(block).toBeFocused();
  }
});

test("on a phone the Toolbelt sits in the single column without sideways scroll", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/projects/seed-mini-router?tab=toolbelt");
  const heading = page.getByRole("heading", { level: 2, name: "Toolbelt" });
  await expect(heading).toBeVisible({ timeout: 30000 });
  // Stasis order: the journal and the requirements come first, so the Toolbelt is no longer within the first screen and a half.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const [width, height] of [[390, 844], [1440, 900]] as const) {
  for (const scheme of ["dark", "light"] as const) {
    test(`the open finder, the step and the full belt have no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
      test.skip(STAFF_MODE, "participant pages are checked in builder mode");
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
      const name = `Belt axe ${Date.now()}`;
      await createProject(page, name);
      const scan = async () => {
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      };
      try {
        // The list open on the empty query (the Saved group with its stars), then typed, then the step with an error.
        await finder(page).click();
        await expect(page.getByRole("group", { name: "Saved" })).toBeVisible();
        await scan();
        await finder(page).fill("pa");
        await expect(page.getByRole("option").first()).toBeVisible();
        await scan();
        await finder(page).fill("tinyp");
        await expect(page.getByRole("option")).toHaveCount(1);
        await expect(finder(page)).toHaveAttribute("aria-activedescendant", /.+/);
        await finder(page).press("Enter");
        await page.getByRole("button", { name: "Equip tool" }).click();
        await expect(page.getByText(/^Write at least 10 characters./)).toBeVisible();
        await scan();
        await page.keyboard.press("Escape");
        await equip(page, "tinyp", NOTE_A);
        await expect(page.locator("li.pf-belt-slot", { hasText: "Tinyparse" })).toBeVisible({ timeout: 30000 });
        await equip(page, "gridl", NOTE_B);
        await expect(page.getByText("Both slots are in use. Remove one to equip another.")).toBeVisible({ timeout: 30000 });
        await scan();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        await removeTool(page, "Gridlock");
        await expect(finder(page)).toBeVisible({ timeout: 15000 });
        await removeTool(page, "Tinyparse");
        await expect(page.getByText("0 of 2 slots in use").first()).toBeVisible({ timeout: 15000 });
      } finally {
        await deleteProject(page, name);
      }
    });
  }
}
