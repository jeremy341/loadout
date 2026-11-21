import { expect, test, type Page } from "@playwright/test";
import { addJournalEntryViaPage, createProjectViaWizard, openProjectTab, saveProjectSettings } from "./new-project-helper";

// The builder side of shipping (plans/proposals/platform-full-roadmap.md P2): the checklist and its blockers, the submit dialog,
// the lock that follows, and taking a ship back. Nothing here approves anything. The builder test account opens without sign-in
// locally. The test makes its own draft project and deletes it through the UI at the end.
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

test("a draft with gaps shows its blockers, ships once complete, locks, and can be taken back", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(120000);
  const name = `Ship check ${Date.now()}`;
  await createProject(page, name);
  // The checklist lives in the Ship tab only.
  await openProjectTab(page, "ship");
  const ship = page.locator("#ship");
  const list = page.locator("#ship-checklist");
  const submit = ship.getByRole("button", { name: "Submit for review" }).first();
  try {
    // A bare draft: the blockers read in plain words and the button is off, with the first blocker as its reason.
    await expect(list.getByText("Write a description of at least 40 characters", { exact: false }).first()).toBeVisible();
    // The wizard always sets a track, so that blocker only belongs to old projects.
    await expect(list.getByText("Pick one of the four tracks", { exact: false })).toHaveCount(0);
    await expect(list.getByText("Add the public https address of your source code.")).toBeVisible();
    await expect(list.getByText("Write at least one journal entry about the work.")).toBeVisible();
    // Uploads off: the image check waits. Uploads on (LOADOUT_UPLOADS): it is a real check and shows its label.
    await expect(list.getByText("Waiting for uploads", { exact: false }).or(list.getByText("Journal entries have photos"))).toBeVisible();
    await expect(list.getByText("Waiting for Hackatime. It does not block you yet.")).toBeVisible();
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveAccessibleDescription(/Write a description of at least 40 characters/);
    // The cover control: the not connected box while uploads are off, the real upload when they are on.
    await expect(page.getByText("Cover upload is off on this site for now", { exact: false }).or(page.getByTestId("cover-upload"))).toBeVisible();

    // Fill the gaps in the Settings tab.
    await saveProjectSettings(page, {
      description: "A small tool that turns a messy log file into a tidy table for quick reading.",
      // A real GitHub source with a README: other hosts fail closed in the README gate and would keep the button off.
      repoUrl: "https://github.com/jeremy341/loadout",
      track: "Tools",
    });
    await openProjectTab(page, "ship");
    await expect(list.getByText("Write at least one journal entry about the work.")).toBeVisible({ timeout: 15000 });
    await expect(list.getByText("Pick one of the four tracks", { exact: false })).toHaveCount(0);

    // One journal entry with enough text for the hours it logs.
    await addJournalEntryViaPage(page, {
      title: "Parsed the first file",
      body: "Read the log format, wrote a parser for the header lines and checked it against three sample files. The table now prints with aligned columns.",
      hours: 1,
    });
    await openProjectTab(page, "ship");
    await expect(submit).toBeEnabled({ timeout: 15000 });

    // The dialog: the confirm button waits for the tick.
    await submit.click();
    const dialog = page.getByRole("dialog", { name: "Submit for review" });
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole("button", { name: "Submit for review" });
    await expect(confirm).toBeDisabled();
    await expect(dialog.locator(".pf-ship-reason", { hasText: "Confirm this is not school work" })).toBeVisible();
    await dialog.getByLabel("I confirm this is not school work and not paid Hack Club work.").check();
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(dialog).toBeHidden({ timeout: 15000 });

    // Submitted: the status shows, and the project is locked.
    await expect(page.locator(".pf-column-pill")).toHaveAttribute("data-status", "submitted", { timeout: 15000 });
    await expect(page.locator(".pf-column-pill")).toHaveText("Submitted");
    await expect(ship.getByText("Submitted. Nobody has picked it up yet", { exact: false })).toBeVisible();
    // Submitted: the journal is closed, so there is no New journal entry control at all.
    await expect(page.getByRole("button", { name: "New journal entry" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "New journal entry" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Delete entry/ })).toHaveCount(0);
    await openProjectTab(page, "settings");
    const locked = page.getByRole("region", { name: "Project details" });
    await expect(locked.getByRole("radio", { name: /Tools/ })).toBeDisabled();
    await expect(locked.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await openProjectTab(page, "ship");

    // Taking it back works while nobody has picked it up.
    await ship.getByRole("button", { name: "Take it back" }).click();
    await expect(page.locator(".pf-column-pill")).toHaveAttribute("data-status", "draft", { timeout: 15000 });
    await expect(page.getByRole("link", { name: "New journal entry" }).first()).toBeVisible();
    await expect(submit).toBeEnabled();
  } finally {
    // A failure above stays the reported error: a broken page can't be deleted from, so this gives up quickly.
    page.setDefaultTimeout(10000);
    await deleteProject(page, name).catch(() => undefined);
  }
});

// Edge cases around the same gate. Each makes its own draft, removes it in a finally, and never touches seeded accounts.
const EDGE_DESCRIPTION = "A small tool that turns a messy log file into a tidy table for quick reading.";
// The README gate only reads GitHub sources: any other host fails closed as "no README" and blocks the button. Use a real
// public repo with a README so a draft can be genuinely ready here (the same source project-journal.spec.ts uses).
const EDGE_REPO = "https://github.com/jeremy341/loadout";
const EDGE_ENTRY = {
  title: "Parsed the first file",
  body: "Read the log format, wrote a parser for the header lines and checked it against three sample files. The table now prints with aligned columns.",
  hours: 1,
};

// Gets a fresh draft to the point where the only thing left is the in-dialog confirmation. Returns the project's query-free URL.
async function makeReadyDraft(page: Page, name: string) {
  await createProject(page, name);
  await saveProjectSettings(page, { description: EDGE_DESCRIPTION, repoUrl: EDGE_REPO, track: "Tools" });
  await addJournalEntryViaPage(page, EDGE_ENTRY);
  await openProjectTab(page, "ship");
  await expect(page.locator("#ship").getByRole("button", { name: "Submit for review" })).toBeEnabled({ timeout: 15000 });
  return page.url().split("?")[0];
}

test("a ready draft with no source address stays blocked until one is saved", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(120000);
  const name = `No source ${Date.now()}`;
  await createProject(page, name);
  const list = page.locator("#ship-checklist");
  const submit = page.locator("#ship").getByRole("button", { name: "Submit for review" }).first();
  try {
    // Fill every gate requirement except the source address: no repoUrl is passed to the wizard or saved here.
    await saveProjectSettings(page, { description: EDGE_DESCRIPTION, track: "Tools" });
    await addJournalEntryViaPage(page, EDGE_ENTRY);
    await openProjectTab(page, "ship");

    // The missing source is the one blocker: its checklist item fails and the button names it as the reason.
    await expect(list.locator('[data-code="source_required"]')).toHaveAttribute("data-state", "fail");
    await expect(list.getByText("Add the public https address of your source code.")).toBeVisible();
    await expect(submit).toBeDisabled();
    await expect(submit).toHaveAccessibleDescription(/Add the public https address of your source code/);

    // Saving a valid address flips that check to a pass and frees the button; nothing else changed.
    await saveProjectSettings(page, { repoUrl: EDGE_REPO });
    await openProjectTab(page, "ship");
    await expect(list.locator('[data-code="source_required"]')).toHaveCount(0);
    await expect(list.locator('[data-code="source_invalid"]')).toHaveAttribute("data-state", "pass");
    await expect(submit).toBeEnabled({ timeout: 15000 });
  } finally {
    page.setDefaultTimeout(10000);
    await deleteProject(page, name).catch(() => undefined);
  }
});

test("submitting locks the journal writer and taking it back reopens it", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(120000);
  const name = `Journal lock ${Date.now()}`;
  await createProject(page, name);
  let projectUrl = "";
  try {
    await saveProjectSettings(page, { description: EDGE_DESCRIPTION, repoUrl: EDGE_REPO, track: "Tools" });
    await addJournalEntryViaPage(page, EDGE_ENTRY);
    await openProjectTab(page, "ship");
    projectUrl = page.url().split("?")[0];
    const submit = page.locator("#ship").getByRole("button", { name: "Submit for review" });
    await expect(submit).toBeEnabled({ timeout: 15000 });
    await submit.click();
    const dialog = page.getByRole("dialog", { name: "Submit for review" });
    await dialog.getByLabel("I confirm this is not school work and not paid Hack Club work.").check();
    await dialog.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.locator(".pf-column-pill")).toHaveAttribute("data-status", "submitted", { timeout: 15000 });

    // The writer refuses even on a direct visit: the lock note replaces the form while the project is submitted.
    await page.goto(`${projectUrl}/journal/new`);
    await expect(page.locator(".pf-journal-locked")).toHaveText(
      "This project is submitted, so its journal is locked. It opens again if a reviewer asks for changes.",
      { timeout: 15000 },
    );
    await expect(page.locator("form.pf-jw-form")).toHaveCount(0);

    // Take it back, then the same direct visit offers the writer again.
    await page.goto(`${projectUrl}?tab=ship`);
    await page.locator("#ship").getByRole("button", { name: "Take it back" }).click();
    await expect(page.locator(".pf-column-pill")).toHaveAttribute("data-status", "draft", { timeout: 15000 });
    await page.goto(`${projectUrl}/journal/new`);
    await expect(page.locator("form.pf-jw-form")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".pf-journal-locked")).toHaveCount(0);
  } finally {
    page.setDefaultTimeout(10000);
    await page.goto(projectUrl).catch(() => undefined);
    await deleteProject(page, name).catch(() => undefined);
  }
});

test("cancelling the submit dialog leaves the draft untouched and discards the confirmation", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(120000);
  const name = `Cancel ship ${Date.now()}`;
  let projectUrl = "";
  try {
    projectUrl = await makeReadyDraft(page, name);
    const ship = page.locator("#ship");
    const submit = ship.getByRole("button", { name: "Submit for review" });
    const dialog = page.getByRole("dialog", { name: "Submit for review" });
    await submit.click();
    await expect(dialog).toBeVisible();
    // Even with the confirmation ticked, Cancel throws the dialog away without submitting.
    await dialog.getByLabel("I confirm this is not school work and not paid Hack Club work.").check();
    await expect(dialog.getByRole("button", { name: "Submit for review" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".pf-column-pill")).toHaveAttribute("data-status", "draft");
    await expect(ship.getByText("Submitted.", { exact: false })).toHaveCount(0);
    // The draft still offers the submit and the journal: nothing was half-submitted.
    await expect(submit).toBeEnabled();
    await expect(page.getByRole("link", { name: "New journal entry" }).first()).toBeVisible();

    // Reopening starts from a fresh tick: closing the dialog discarded the confirmation state.
    await submit.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("I confirm this is not school work and not paid Hack Club work.")).not.toBeChecked();
    await expect(dialog.getByRole("button", { name: "Submit for review" })).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  } finally {
    page.setDefaultTimeout(10000);
    await page.goto(projectUrl).catch(() => undefined);
    await deleteProject(page, name).catch(() => undefined);
  }
});
