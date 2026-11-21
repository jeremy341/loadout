import { expect, test, type Page } from "@playwright/test";

// The builder test account and its API keys live in one shared local database. Run this file serially so the five-key
// quota test cannot overlap another test's create, and revoke every key a test creates before it finishes.
test.describe.configure({ mode: "serial" });

async function createKey(page: Page, name: string): Promise<void> {
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel(/^Profile/).check();
  await page.getByRole("button", { name: "Create key" }).click();
  await expect(page.locator("#sa-reveal-key")).toHaveValue(/^ldk_[A-Za-z0-9_-]{43}$/);
  // revalidatePath refreshes the server-rendered list, so wait for the new row before reading the active-count state.
  await expect(page.locator('.sa-key[data-state="active"]', { hasText: name })).toBeVisible();
}

async function revokeKey(page: Page, name: string): Promise<void> {
  // Reload and scope to the active row: the reveal panel and earlier revokes can leave stale rows in the client tree.
  await page.goto("/dashboard/settings");
  const row = page.locator('.sa-key[data-state="active"]').filter({ hasText: name });
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: `Revoke the key ${name}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Revoke key" }).click();
  await expect(page.locator('.sa-key[data-state="revoked"]').filter({ hasText: name })).toBeVisible({ timeout: 15000 });
}

test("settings: create a key, see it once, revoke it, and cancel an erasure request", async ({ page }) => {
  const name = `E2E key ${Date.now()}`;
  try {
    await page.goto("/dashboard/settings");
    await expect(page.getByText("Keys can only read. They can never change anything.")).toBeVisible();

    await createKey(page, name);
    await expect(page.locator("#sa-reveal-key")).toHaveValue(/^ldk_[A-Za-z0-9_-]{43}$/);
    await expect(page.getByText("This is the only time the key is shown.")).toBeVisible();

    await revokeKey(page, name);

    await page.getByRole("button", { name: "Delete my account" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox").fill("not my handle");
    await dialog.getByRole("button", { name: "Delete my account" }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
  } finally {
    // A failure between create and revoke must not leave a live key for the quota tests below or a later run.
    await page.goto("/dashboard/settings");
    const active = page.locator('.sa-key[data-state="active"]', { hasText: name });
    if (await active.count()) await revokeKey(page, name);
  }
});

test("settings: a key with no scope is refused with a visible error", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await page.getByLabel("Name", { exact: true }).fill("E2E scope-less key");
  // No permission is checked: the server rejects the empty selection and the form shows why. No key is made, so nothing to clean up.
  await page.getByRole("button", { name: "Create key" }).click();
  await expect(page.locator(".sa-form").getByRole("alert")).toHaveText("Choose at least one permission.");
  await expect(page.locator("#sa-reveal-key")).toHaveCount(0);
  await expect(page.locator(".sa-key", { hasText: "E2E scope-less key" })).toHaveCount(0);
});

test("settings: cancelling a revoke confirmation leaves the key active", async ({ page }) => {
  await page.goto("/dashboard/settings");
  const name = `E2E cancel revoke ${Date.now()}`;
  await createKey(page, name);
  try {
    await page.getByRole("button", { name: `Revoke the key ${name}` }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Revoke this key?" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.sa-key[data-state="active"]', { hasText: name })).toBeVisible();
  } finally {
    await revokeKey(page, name);
  }
});

test("settings: five active keys reach the quota and disable creation", async ({ page }) => {
  // Creating and revoking up to five keys through the UI takes longer than the default 30 s on a loaded runner.
  test.setTimeout(120000);
  await page.goto("/dashboard/settings");
  const create = page.getByRole("button", { name: "Create key" });
  const prefix = `E2E quota ${Date.now()}`;
  const created: string[] = [];
  // Top up to the limit: a failed earlier run could have left keys behind. createKey waits for the refreshed list before
  // returning, so the button's disabled state is settled before the next iteration reads it.
  for (let i = 0; i < 5; i++) {
    if (await create.isDisabled()) break;
    const name = `${prefix} ${i + 1}`;
    await createKey(page, name);
    created.push(name);
  }
  try {
    await expect(create).toBeDisabled();
    await expect(page.getByText("You have five active keys. Revoke one to make another.")).toBeVisible();
  } finally {
    for (const name of created) await revokeKey(page, name);
  }
});
