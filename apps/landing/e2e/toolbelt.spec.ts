import { expect, test, type Page } from "@playwright/test";

// Toolbelt on the project page (design spec .ulpi/design/profile-and-toolbelt.md, 3.14 to 3.16) and the source and demo
// address fields of Edit project. The builder test account opens without sign-in locally. Seeded tools: Tinyparse and Palette
// Forge by juniper_dev, Orbit Sim and Gridlock by kestrel, Pocket Synth by pixel-fox, Tape Deck by bolt_nine.
// Each test makes its own project through the New project dialog and deletes it through the UI at the end.
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";

async function createProject(page: Page, name: string) {
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible({ timeout: 30000 });
  await expect(async () => {
    await page.getByTestId("new-project").click();
    await expect(page.getByRole("dialog", { name: "New project" })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await page.getByLabel("Project name").fill(name);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create project" }).click();
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { level: 2, name: "Toolbelt" })).toBeVisible();
}

async function deleteProject(page: Page, name: string) {
  // A failed step may leave a dialog open; Escape closes it so the clean-up can reach the page.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name);
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

const equipSlot = (page: Page) => page.getByRole("button", { name: "Equip a tool" }).first();

test("the Toolbelt box shows two empty slots and a gate card that never claims payment", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt gate ${Date.now()}`;
  await createProject(page, name);
  try {
    const belt = page.getByRole("region", { name: "Toolbelt" });
    await expect(belt.getByText("0 of 2 slots in use")).toBeVisible();
    await expect(belt.getByRole("button", { name: "Equip a tool" })).toHaveCount(2);
    await expect(belt.getByText("Pick an approved open-source project.")).toHaveCount(2);

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
    await expect(note).toContainText("Provisional rewards, not paid yet: 50 Ore once per tool");
    await expect(note.getByRole("link")).toHaveCount(0);

    // The header summary under the project's numbers.
    await expect(page.locator(".pf-belt-summary")).toContainText("0 of 2 slots in use. Used by 0 builders.");
  } finally {
    await deleteProject(page, name);
  }
});

test("a builder equips a tool, sees the exact refusals, equips a second, and removes both", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt equip ${Date.now()}`;
  await createProject(page, name);
  try {
    const dialog = page.getByRole("dialog", { name: "Equip a tool" });
    await equipSlot(page).click();
    await expect(dialog).toBeVisible();
    // Initial focus is the search field.
    await expect(dialog.getByRole("searchbox", { name: "Find a tool" })).toBeFocused();

    // Your own tool is not offered; other builders' open-source tools are.
    await expect(dialog.getByRole("radio", { name: /^Cable Tidy/ })).toHaveCount(0);
    await expect(dialog.getByRole("radio", { name: /^Tinyparse/ })).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /^Orbit Sim/ })).toBeVisible();
    // Closed-source and in-review projects are not offered either.
    await expect(dialog.getByRole("radio", { name: /^Lamp Bus/ })).toHaveCount(0);
    await expect(dialog.getByRole("radio", { name: /^Fan Curve/ })).toHaveCount(0);

    // Search runs in the browser and the result line follows after a pause.
    const results = dialog.locator(".pf-belt-results");
    await expect(results).toHaveText(/^\d+ tools?\.$/);
    await dialog.getByRole("searchbox", { name: "Find a tool" }).fill("tinyp");
    await expect(results).toHaveText("1 tool matches.");
    await dialog.getByRole("searchbox", { name: "Find a tool" }).fill("zzzz");
    await expect(results).toHaveText("No tools match. Clear the search.");
    await dialog.getByRole("searchbox", { name: "Find a tool" }).fill("");
    await expect(results).toHaveText(/^\d+ tools?\.$/);

    // No tool picked.
    await dialog.getByRole("button", { name: "Equip tool" }).click();
    await expect(dialog.getByText("Pick a tool.")).toBeVisible();

    // Empty note, then a note that names nothing, then a good one.
    await dialog.getByRole("radio", { name: /^Tinyparse/ }).check();
    await dialog.getByRole("button", { name: "Equip tool" }).click();
    await expect(dialog.getByText(/^Write at least 10 characters\. Say where it is used/)).toBeVisible();
    await dialog.getByLabel("How does your project use it?").fill("I like it a lot.");
    await dialog.getByRole("button", { name: "Equip tool" }).click();
    await expect(dialog.getByText(/^Name the file or feature that uses it\./)).toBeVisible();
    await expect(dialog.locator(".pf-belt-counter")).toHaveText("16 of 500");

    await dialog.getByLabel("How does your project use it?").fill("The config feature reads its rules with Tinyparse in src/rules.ts.");
    await dialog.getByRole("button", { name: "Equip tool" }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });

    // The new slot shows the Pending chip, the note and Remove; the chip has focus; the status line says what happens next.
    const slot = page.locator("li.pf-belt-slot", { hasText: "Tinyparse" });
    await expect(slot.locator(".pf-belt-chip")).toHaveText("Pending");
    await expect(slot.locator(".pf-belt-chip")).toBeFocused();
    await expect(slot.getByText("The config feature reads its rules with Tinyparse in src/rules.ts.")).toBeVisible();
    await expect(slot.getByRole("link", { name: "juniper_dev" })).toHaveAttribute("href", "/dashboard/builders/juniper_dev");
    await expect(page.getByRole("status").filter({ hasText: "Equip sent. It stays Pending until a reviewer confirms it." })).toBeVisible();
    await expect(page.getByText("1 of 2 slots in use").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Equip a tool" })).toHaveCount(1);

    // A tool already on the belt is not offered again.
    await equipSlot(page).click();
    await expect(dialog.getByRole("radio", { name: /^Tinyparse/ })).toHaveCount(0);
    await expect(dialog.getByRole("radio", { name: /^Gridlock/ })).toBeVisible();

    // A second, different tool fills the belt. A third cannot be started: no slot is drawn and the line says why.
    await dialog.getByRole("radio", { name: /^Gridlock/ }).check();
    await dialog.getByLabel("How does your project use it?").fill("The build pipeline schedules every step through Gridlock in src/jobs.ts.");
    await dialog.getByRole("button", { name: "Equip tool" }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Equip a tool" })).toHaveCount(0);
    await expect(page.getByText("Both slots are in use. Remove one to equip another.")).toBeVisible();
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

    // Confirm: the slot empties, the status line says so, and focus goes to the Equip slot.
    await page.getByRole("button", { name: "Remove Gridlock" }).click();
    await confirm.getByRole("button", { name: "Remove tool" }).click();
    await expect(confirm).toBeHidden({ timeout: 15000 });
    await expect(page.getByRole("status").filter({ hasText: "Removed Gridlock." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Equip a tool" })).toHaveCount(1);
    await expect(equipSlot(page)).toBeFocused();

    await page.getByRole("button", { name: "Remove Tinyparse" }).click();
    await page.getByRole("dialog", { name: "Remove Tinyparse?" }).getByRole("button", { name: "Remove tool" }).click();
    await expect(page.getByRole("button", { name: "Equip a tool" })).toHaveCount(2, { timeout: 15000 });
    await expect(page.getByText("0 of 2 slots in use").first()).toBeVisible();
  } finally {
    await deleteProject(page, name);
  }
});

test("the equip dialog works from the keyboard and Escape gives focus back", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt keys ${Date.now()}`;
  await createProject(page, name);
  try {
    const dialog = page.getByRole("dialog", { name: "Equip a tool" });
    await equipSlot(page).focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    const search = dialog.getByRole("searchbox", { name: "Find a tool" });
    await expect(search).toBeFocused();

    // Search, then Tab into the radio group; the arrows move the choice; Tab reaches the note, then Cancel and Equip.
    await search.fill("palette");
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("radio", { name: /^Palette Forge/ })).toBeFocused();
    await page.keyboard.press("Space");
    await expect(dialog.getByRole("radio", { name: /^Palette Forge/ })).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(dialog.getByLabel("How does your project use it?")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Equip tool" })).toBeFocused();

    // Escape closes without confirmation; focus is back on the slot that opened it; reopening starts clean.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(equipSlot(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("searchbox", { name: "Find a tool" })).toHaveValue("");
    await expect(dialog.getByRole("radio", { checked: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
  } finally {
    await deleteProject(page, name);
  }
});

test("Edit project checks the source and demo addresses with plain messages and saves good ones", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Belt links ${Date.now()}`;
  await createProject(page, name);
  try {
    await page.getByRole("button", { name: "Edit project" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit project" });
    await expect(dialog).toBeVisible();
    const repo = dialog.getByLabel(/^Source code address/);
    const demo = dialog.getByLabel(/^Demo address/);
    await expect(dialog.getByText("A public https address. Needed if you want other builders to equip your project from the Toolbelt.")).toBeVisible();

    await repo.fill("http://github.com/example-handle/spec-tool");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog.getByText("The source link must start with https://.")).toBeVisible();
    await expect(repo).toHaveAttribute("aria-invalid", "true");

    await repo.fill("not an address");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog.getByText(/^The source link has a space or an unusual character\./)).toBeVisible();

    await repo.fill("https://github.com/example-handle/spec-tool");
    await demo.fill("https://localhost/demo");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog.getByText(/^The demo link has to point at a public website/)).toBeVisible();
    await expect(repo).not.toHaveAttribute("aria-invalid", "true");

    await demo.fill("https://spec-tool.example/demo");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });

    // Saved: reopening shows both addresses (the page refreshes a moment after the dialog closes).
    await expect(async () => {
      await page.getByRole("button", { name: "Edit project" }).click();
      try {
        await expect(dialog.getByLabel(/^Source code address/)).toHaveValue("https://github.com/example-handle/spec-tool", { timeout: 1500 });
      } catch (error) {
        await page.keyboard.press("Escape");
        throw error;
      }
    }).toPass({ timeout: 15000 });
    await expect(dialog.getByLabel(/^Demo address/)).toHaveValue("https://spec-tool.example/demo");
    await dialog.getByRole("button", { name: "Cancel" }).click();
  } finally {
    await deleteProject(page, name);
  }
});

test("an approved project shows closed slots with a reason and the maker view", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await page.goto("/dashboard/projects");
  const card = page.getByRole("link", { name: /Cable Tidy/ });
  test.skip((await card.count()) === 0, "needs the seeded approved project Cable Tidy");
  await card.first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Cable Tidy" })).toBeVisible({ timeout: 30000 });

  const slots = page.getByRole("button", { name: "Equip a tool" });
  await expect(slots).toHaveCount(2);
  await expect(slots.first()).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("Equips are closed once a project is submitted. They open again if a reviewer asks for changes.")).toBeVisible();
  // Activating a closed slot does nothing.
  await slots.first().click({ force: true });
  await expect(page.getByRole("dialog", { name: "Equip a tool" })).toBeHidden();

  // The maker view: Cable Tidy is approved and has a source address.
  await expect(page.getByRole("heading", { level: 2, name: "Toolbelt users" })).toBeVisible();
});
