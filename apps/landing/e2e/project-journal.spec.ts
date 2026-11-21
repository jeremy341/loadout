import { expect, test, type Page } from "@playwright/test";
import { addJournalEntryViaPage, createProjectViaWizard, openProjectTab, saveProjectSettings } from "./new-project-helper";

// The journal on the project page (plans/proposals/platform-gap-analysis.md A4). The builder test account opens without sign-in
// locally. Each test makes its own draft project through the creation wizard and deletes it through the UI at the end.
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";

async function createProject(page: Page, name: string) {
  await createProjectViaWizard(page, name);
}

async function deleteProject(page: Page, name: string) {
  await page.keyboard.press("Escape");
  await openProjectTab(page, "settings");
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name);
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

// The new edge-case tests each own a project. Capturing its id at creation means cleanup works from any page the test reached,
// including the full-page writer and the public page, so a failure never leaves a project behind.
function currentProjectId(page: Page): string {
  const match = /\/dashboard\/projects\/([^/?]+)/.exec(page.url());
  if (!match) throw new Error(`no project id in ${page.url()}`);
  return match[1];
}

async function deleteOwnProject(page: Page, id: string, name: string) {
  await page.goto(`/dashboard/projects/${id}?tab=settings`);
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name);
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

test("a builder adds a journal entry, sees the hours, is told off for a bad quarter hour, and deletes it", async ({ page }) => {
  test.setTimeout(120000);
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const name = `Journal check ${Date.now()}`;
  await createProject(page, name);

  await expect(page.getByRole("heading", { level: 2, name: "Journal" })).toBeVisible();
  await expect(page.getByText("No journal entries yet.")).toBeVisible();
  await expect(page.getByTestId("journal-total")).toHaveText("0 entries, 0 hours logged");

  // The writer is a full page, not a dialog.
  const open = page.getByRole("link", { name: "New journal entry" }).first();
  await open.click();
  await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // An empty title, then a bad quarter hour, then a long session that earns the timelapse advice.
  await page.getByRole("button", { name: "Save journal entry" }).click();
  await expect(page.getByText("Give the entry a title.")).toBeVisible();
  await page.getByLabel("Title").fill("Wired the first board");
  await page.getByLabel("What did you work on?").fill("Soldered the **header**.\nChecked each pin with a meter. <b>not bold</b> [bad](javascript:alert(1))");
  // Preview shows how the Markdown will read, then goes back to the box.
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByTestId("journal-preview").locator("strong")).toHaveText("header");
  await page.getByRole("button", { name: "Write" }).click();
  await expect(page.getByLabel("What did you work on?")).toBeVisible();
  // No hours yet: the server says so next to the field.
  await page.getByRole("button", { name: "Save journal entry" }).click();
  await expect(page.getByText("Enter the hours you worked.")).toBeVisible();
  await page.getByLabel("Hours", { exact: true }).fill("9");
  await expect(page.getByText("A session over 7 hours is easier to review with a timelapse.", { exact: false })).toBeVisible();

  await page.getByLabel("Hours", { exact: true }).fill("2");
  await page.getByLabel("Minutes", { exact: true }).selectOption("30");
  await expect(page.getByText("A session over 7 hours")).toHaveCount(0);
  await page.getByRole("button", { name: "Save journal entry" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects\/[^/]+$/, { timeout: 15000 });

  const entry = page.getByTestId("journal-entry");
  await expect(entry).toHaveCount(1);
  await expect(entry.getByRole("heading", { level: 3, name: "Wired the first board" })).toBeVisible();
  await expect(entry).toContainText("2.5 hours logged");
  // Markdown is rendered, raw HTML is not: the tag shows as typed and is never an element, and a script link has no address.
  await expect(entry.locator("strong")).toHaveText("header");
  await expect(entry).toContainText("<b>not bold</b>");
  await expect(entry.locator("b")).toHaveCount(0);
  await expect(entry.locator("a[href^='javascript']")).toHaveCount(0);
  // The Stasis entry header: who, hours and date; the timeline ends with the project start.
  await expect(entry.locator(".pf-spp-entry-head")).toContainText("added to the journal");
  await expect(entry.locator(".pf-spp-entry-head time")).toBeVisible();
  await expect(page.getByTestId("journal-total")).toHaveText("1 entry, 2.5 hours logged");
  // The checklist is in the Ship tab only; the Journal tab has one line about how many checks are left.
  await expect(page.getByTestId("ship-left")).toBeVisible();
  await expect(page.getByTestId("journal-entry-started")).toContainText("started this project");

  // Edit: the owner changes the title and the text, and the entry shows the new words.
  await entry.getByRole("link", { name: /^Edit entry/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Edit journal entry" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByLabel("Title")).toHaveValue("Wired the first board");
  await expect(page.getByLabel("Hours", { exact: true })).toHaveValue("2");
  await expect(page.getByLabel("Minutes", { exact: true })).toHaveValue("30");
  await page.getByLabel("Title").fill("Wired the second board");
  await page.getByLabel("What did you work on?").fill("Checked *every* pin.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects\/[^/]+$/, { timeout: 15000 });
  await expect(page.getByTestId("journal-entry").getByRole("heading", { level: 3, name: "Wired the second board" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("journal-entry").locator("em")).toHaveText("every");

  // The public page shows the same entry, with no owner buttons and no Ore.
  await page.goto(page.url().replace("/dashboard/projects/", "/dashboard/explore/").split("?")[0]);
  const visitor = page.getByTestId("journal-entry");
  await expect(visitor).toHaveCount(1);
  await expect(visitor.getByRole("heading", { level: 3, name: "Wired the second board" })).toBeVisible();
  await expect(visitor.getByRole("button")).toHaveCount(0);
  await expect(page.locator(".pf-spp-facts")).toContainText("Not connected");
  await expect(page.locator(".pf-spp").getByText(/\bOre\b/)).toHaveCount(0);
  await page.goto(page.url().replace("/dashboard/explore/", "/dashboard/projects/"));

  // Delete: the confirm modal is accepted.
  await entry.getByRole("button", { name: /^Delete entry/ }).click();
  await page.getByRole("dialog", { name: "Delete entry" }).getByRole("button", { name: "Delete it" }).click();
  await expect(page.getByTestId("journal-entry")).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByTestId("journal-total")).toHaveText("0 entries, 0 hours logged");

  await deleteProject(page, name);
});

test("a submitted or approved project shows its journal locked", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await page.goto("/dashboard/projects/seed-cable-tidy");
  const missing = (await page.getByRole("heading", { level: 1, name: "Cable Tidy" }).count()) === 0;
  test.skip(missing, "needs the seeded approved project Cable Tidy");
  await expect(page.getByRole("note")).toContainText("its journal is locked");
  await expect(page.getByRole("button", { name: "New journal entry" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "New journal entry" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Delete entry/ })).toHaveCount(0);
});

test("a logging project lists its entries newest first", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  await page.goto("/dashboard/projects/seed-mini-router");
  const entries = page.getByTestId("journal-entry");
  test.skip((await entries.count()) < 2, "needs the seeded sample journal entries");
  await expect(entries.first().getByRole("heading", { level: 3 })).toHaveText(/routing table/i);
});

// Edge cases the single-entry walkthrough above does not pin down. Each test makes its own project, so it needs no seed data,
// and deletes it in a finally so neither a pass nor a failure leaves a project behind for the next run.
test("a new project has an empty journal with a write-first link and no entry controls", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(90000);
  const name = `Journal empty ${Date.now()}`;
  await createProject(page, name);
  const id = currentProjectId(page);
  try {
    await openProjectTab(page, "journal");
    await expect(page.getByRole("heading", { level: 2, name: "Journal" })).toBeVisible();
    await expect(page.getByTestId("journal-total")).toHaveText("0 entries, 0 hours logged");
    await expect(page.getByText("No journal entries yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Write the first entry" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New journal entry" }).first()).toBeVisible();
    await expect(page.getByTestId("journal-entry")).toHaveCount(0);
    // The timeline still ends at the project start, and the Ship tab still has a note about what is missing.
    await expect(page.getByTestId("journal-entry-started")).toBeVisible();
    await expect(page.getByTestId("ship-left")).toBeVisible();
    // With no entry there is nothing to edit or delete, and no locked note on a draft.
    await expect(page.getByRole("link", { name: /^Edit entry/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Delete entry/ })).toHaveCount(0);
    await expect(page.getByRole("note")).toHaveCount(0);
  } finally {
    await deleteOwnProject(page, id, name);
  }
});

test("several entries add up, show newest first and each keep their owner controls", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(150000);
  const name = `Journal many ${Date.now()}`;
  await createProject(page, name);
  const id = currentProjectId(page);
  const added = [
    { title: "First board wired", body: "Wired the first board and checked every pin with a meter before powering it.", hours: 1 },
    { title: "Second board wired", body: "Wired the second board, then compared both boards under the same test setup.", hours: 2 },
    { title: "Third board wired", body: "Wired the third board and wrote down the differences so the next build is quicker.", hours: 3 },
  ];
  try {
    for (const entry of added) await addJournalEntryViaPage(page, entry);

    await openProjectTab(page, "journal");
    const entries = page.getByTestId("journal-entry");
    await expect(entries).toHaveCount(added.length);
    await expect(page.getByTestId("journal-total")).toHaveText("3 entries, 6 hours logged");
    for (const [index, entry] of added.entries()) {
      await expect(entries.getByRole("heading", { level: 3, name: entry.title })).toBeVisible();
      await expect(entries.nth(index)).toContainText("added to the journal");
    }
    // Newest first: the last entry written is the first card, and the start marker stays at the end of the timeline.
    await expect(entries.first().getByRole("heading", { level: 3 })).toHaveText(added[added.length - 1].title);
    await expect(page.locator(".pf-spp-items > li").last()).toHaveAttribute("data-testid", "journal-entry-started");
    // Every entry has its own Edit and Delete; the empty state is gone.
    await expect(page.getByRole("link", { name: /^Edit entry/ })).toHaveCount(added.length);
    await expect(page.getByRole("button", { name: /^Delete entry/ })).toHaveCount(added.length);
    await expect(page.getByText("No journal entries yet.")).toHaveCount(0);

    // The public page mirrors all the entries but has no owner buttons and no Ore.
    await page.goto(`/dashboard/explore/${id}`);
    const visitor = page.getByTestId("journal-entry");
    await expect(visitor).toHaveCount(added.length);
    for (const entry of added) await expect(visitor.getByRole("heading", { level: 3, name: entry.title })).toBeVisible();
    await expect(visitor.getByRole("link", { name: /^Edit entry/ })).toHaveCount(0);
    await expect(visitor.getByRole("button", { name: /^Delete entry/ })).toHaveCount(0);
    await expect(page.locator(".pf-spp").getByText(/\bOre\b/)).toHaveCount(0);
  } finally {
    await deleteOwnProject(page, id, name);
  }
});

test("shipping locks the draft journal controls and taking it back opens them again", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(150000);
  const name = `Journal lock ${Date.now()}`;
  await createProject(page, name);
  const id = currentProjectId(page);
  try {
    // Fill the ship gaps the same way the builder ship test does, then add one entry that covers its own hour.
    await saveProjectSettings(page, {
      description: "A small tool that turns a messy log file into a tidy table for quick reading.",
      repoUrl: "https://codeberg.org/example-handle/log-table",
      track: "Tools",
    });
    await addJournalEntryViaPage(page, {
      title: "Parsed the first file",
      body: "Read the log format, wrote a parser for the header lines and checked it against three sample files. The table now prints with aligned columns.",
      hours: 1,
    });

    // Draft: the entry is editable and the writer link is there.
    await openProjectTab(page, "journal");
    await expect(page.getByTestId("journal-entry")).toHaveCount(1);
    await expect(page.getByTestId("journal-total")).toHaveText("1 entry, 1 hour logged");
    await expect(page.getByRole("link", { name: "New journal entry" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Edit entry/ })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete entry/ })).toHaveCount(1);

    await openProjectTab(page, "ship");
    const submit = page.getByRole("button", { name: "Submit for review" }).first();
    const describedBy = await submit.getAttribute("aria-describedby");
    const reason = describedBy ? await page.locator(`#${describedBy}`).textContent() : "";
    await expect(submit, `ship button blocked by: ${reason}`).toBeEnabled({ timeout: 15000 });
    await submit.click();
    const dialog = page.getByRole("dialog", { name: "Submit for review" });
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole("button", { name: "Submit for review" });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel("I confirm this is not school work and not paid Hack Club work.").check();
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
    await expect(page.locator(".pf-column-pill")).toHaveAttribute("data-status", "submitted", { timeout: 15000 });

    // Submitted: the entry is still readable, but every control that could change the journal is gone.
    await openProjectTab(page, "journal");
    await expect(page.getByRole("note")).toContainText("its journal is locked");
    await expect(page.getByTestId("journal-entry")).toHaveCount(1);
    await expect(page.getByTestId("journal-total")).toHaveText("1 entry, 1 hour logged");
    await expect(page.getByRole("link", { name: "New journal entry" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Edit entry/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Delete entry/ })).toHaveCount(0);

    // Taking it back while nobody has picked it up reopens the same controls on the same entry.
    await openProjectTab(page, "ship");
    await page.getByRole("button", { name: "Take it back" }).click();
    await expect(page.locator(".pf-column-pill")).toHaveAttribute("data-status", "draft", { timeout: 15000 });
    await openProjectTab(page, "journal");
    await expect(page.getByRole("link", { name: "New journal entry" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Edit entry/ })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Delete entry/ })).toHaveCount(1);
  } finally {
    await deleteOwnProject(page, id, name);
  }
});
