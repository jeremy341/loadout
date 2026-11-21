import { expect, type Page } from "@playwright/test";

export type WizardTrack = "Tools" | "Systems" | "Compute" | "Hardware";

// Makes a project through the creation wizard and ends on the new project's page. Used by every spec that needs a project.
// The default idea is under 40 characters on purpose, so the ship gate still asks for a longer description. The first click is retried until the page has loaded its script, because a click before that does nothing.
export async function createProjectViaWizard(
  page: Page,
  name: string,
  options: { track?: WizardTrack; idea?: string; repoUrl?: string; demoUrl?: string } = {},
) {
  const track = options.track ?? "Systems";
  const idea = options.idea ?? "A small test project.";
  await page.goto("/dashboard/projects/new");
  const next = page.getByRole("button", { name: /^(Next|Skip)$/ });
  await expect(page.getByRole("heading", { level: 1, name: "What kind of project is it?" })).toBeVisible({ timeout: 30000 });
  await expect(async () => {
    if (track === "Hardware") {
      await page.getByRole("radio", { name: /^Hardware/ }).check();
    } else {
      // Software has its own Track step after the kind step.
      const software = page.getByRole("radio", { name: /^Software/ });
      if (await software.isVisible()) {
        await software.check();
        await next.click();
      }
      await page.getByRole("radio", { name: new RegExp(`^${track}`) }).check();
    }
    await expect(next).toBeEnabled({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await next.click();
  await page.getByLabel("Your idea").fill(idea);
  await next.click();
  await page.getByLabel("Project name").fill(name);
  await next.click();
  if (options.repoUrl) await page.getByLabel("Source address").fill(options.repoUrl);
  if (options.demoUrl) await page.getByLabel("Demo address").fill(options.demoUrl);
  await next.click();
  // The click starts a navigation to the new page; do not wait for it here, the heading below does.
  await page.getByRole("button", { name: "Create project" }).click({ noWaitAfter: true });
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({ timeout: 30000 });
}

export type ProjectTab = "journal" | "ship" | "toolbelt" | "settings";
const TAB_LABEL: Record<ProjectTab, string> = { journal: "Journal", ship: "Ship", toolbelt: "Toolbelt", settings: "Settings" };

// Opens a tab of the project page you are on by its address (?tab=), so it works before the page has loaded its script.
export async function openProjectTab(page: Page, tab: ProjectTab) {
  const url = new URL(page.url());
  url.searchParams.delete("created");
  if (tab === "journal") url.searchParams.delete("tab");
  else url.searchParams.set("tab", tab);
  await page.goto(url.pathname + url.search);
  await expect(page.getByRole("tab", { name: TAB_LABEL[tab], exact: true })).toHaveAttribute("aria-selected", "true", { timeout: 30000 });
}

// Fills the Settings tab form. Only the fields given are changed. Does not press Save.
export async function fillProjectSettings(page: Page, fields: { name?: string; description?: string; repoUrl?: string; demoUrl?: string; track?: WizardTrack }) {
  const form = page.getByRole("region", { name: "Project details" });
  if (fields.name !== undefined) await form.getByLabel("Project name").fill(fields.name);
  if (fields.description !== undefined) await form.getByLabel(/^Description/).fill(fields.description);
  if (fields.repoUrl !== undefined) await form.getByLabel(/^Source code address/).fill(fields.repoUrl);
  if (fields.demoUrl !== undefined) await form.getByLabel(/^Demo address/).fill(fields.demoUrl);
  if (fields.track) await form.getByRole("radio", { name: new RegExp(`^${fields.track}`) }).check();
}

// Opens Settings, fills the form and saves it, then waits for the saved line.
export async function saveProjectSettings(page: Page, fields: Parameters<typeof fillProjectSettings>[1]) {
  await openProjectTab(page, "settings");
  await fillProjectSettings(page, fields);
  await page.getByRole("region", { name: "Project details" }).getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("region", { name: "Project details" }).getByRole("status")).toHaveText("Saved.", { timeout: 15000 });
}

// Writes one journal entry on the full page writer (/dashboard/projects/[id]/journal/new) and ends back on the project page.
// hours may be a decimal in quarter hours, such as 2.5. Starts on the project page, where the New journal entry link lives.
export async function addJournalEntryViaPage(page: Page, entry: { title: string; body: string; hours: number }) {
  await page.getByRole("link", { name: "New journal entry" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
  const whole = Math.floor(entry.hours);
  const minutes = Math.round((entry.hours - whole) * 60);
  await page.getByLabel("Title").fill(entry.title);
  await page.getByLabel("What did you work on?").fill(entry.body);
  await page.getByLabel("Hours", { exact: true }).fill(String(whole));
  await page.getByLabel("Minutes", { exact: true }).selectOption(String(minutes));
  await page.getByRole("button", { name: "Save journal entry" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects\/[^/]+(\?.*)?$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { level: 1 }).first()).not.toHaveText("New journal entry");
}
