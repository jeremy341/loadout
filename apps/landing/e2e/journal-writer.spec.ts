import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadSharp } from "../lib/platform/sharp-loader";
import { addJournalEntryViaPage, createProjectViaWizard, openProjectTab, saveProjectSettings } from "./new-project-helper";

// The full page journal writer and journal photos (plans/proposals/participant-redesign-decisions.md). Photos need the
// LOADOUT_UPLOADS flag, which is on in local development (.env.local). The builder test account opens without sign-in locally.
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";
const SHOTS = process.env.LOADOUT_SHOT_DIR ?? "C:\\Users\\jerem\\AppData\\Local\\Temp\\loadout-shots";
mkdirSync(SHOTS, { recursive: true });
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const BODY = "Soldered the **header** and checked each pin with a meter.\n\n- Pin 1 is ground\n- Pin 2 is power\n\n<b>not bold</b> [bad](javascript:alert(1))";
const LONG = "Read the log format, wrote a parser for the header lines and checked it against three sample files. The table now prints with aligned columns, a header row and a summary line.";

async function setup(page: Page, width: number, height: number, scheme: "dark" | "light" = "dark") {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
}

async function projectId(page: Page): Promise<string> {
  const match = /\/dashboard\/projects\/([^/?]+)/.exec(page.url());
  if (!match) throw new Error(`no project id in ${page.url()}`);
  return match[1];
}

async function deleteProject(page: Page, name: string) {
  await page.keyboard.press("Escape");
  await openProjectTab(page, "settings");
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name);
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

// A real picture with EXIF data in it, made with sharp (a Next dependency). null when sharp cannot be loaded here.
async function makeJpeg(width = 800, height = 600): Promise<Buffer | null> {
  try {
    const sharp = await loadSharp();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#2b6cb0"/><stop offset="1" stop-color="#f6ad55"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="${width / 4}" y="${height / 4}" width="${width / 2}" height="${height / 2}" fill="#1a202c"/></svg>`;
    return await sharp(Buffer.from(svg)).withExif({ IFD0: { Copyright: "secret-owner" } }).jpeg().toBuffer();
  } catch {
    return null;
  }
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

// Photo uploads are a flag: .env.local turns them on locally and CI runs them off. A test that needs the controls says
// so instead of waiting for a file input this environment never renders.
async function uploadsOn(page: Page): Promise<boolean> {
  const off = page.getByTestId("photos-off");
  const count = page.getByTestId("photos-count");
  // Wait for the Photos section to render before reading which state it is in; an immediate count() can see neither.
  await expect(off.or(count).first()).toBeVisible({ timeout: 30000 });
  return (await off.count()) === 0;
}

async function requireUploads(page: Page) {
  test.skip(!(await uploadsOn(page)), "photo uploads are off here (LOADOUT_UPLOADS is not true)");
}

test("the writer is a full page: the guidelines and counts follow the hours, Preview shows the visitor view, and Ore shows for the owner only", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(120000);
  const name = `Writer check ${Date.now()}`;
  await createProjectViaWizard(page, name);
  const id = await projectId(page);

  await page.getByRole("link", { name: "New journal entry" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${id}/journal/new$`), { timeout: 30000 });
  await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("link", { name: `Back to ${name}` })).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveText("No changes yet");
  await expect(page.getByText("Everything here is public.")).toBeVisible();
  // No hours yet: nothing to estimate.
  await expect(page.getByTestId("ore-line")).toHaveCount(0);

  await expect(page.getByRole("heading", { level: 2, name: "Journal entry guidelines" })).toBeVisible();
  await expect(page.getByTestId("journal-side")).toHaveCount(0);
  // The photo counter only exists when uploads are on; the rest of the writer is checked in both environments.
  const uploads = await uploadsOn(page);
  await page.getByLabel("Hours", { exact: true }).fill("3");
  await expect(page.getByTestId("chars-count")).toContainText("0 of 300");
  if (uploads) await expect(page.getByTestId("photos-count")).toContainText("0 of 1");
  await expect(page.getByTestId("ore-line")).toContainText("About 30 Ore once approved.");
  await expect(page.getByTestId("uncovered-note")).toHaveCount(0);
  await page.getByLabel("Hours", { exact: true }).fill("9");
  await expect(page.getByTestId("chars-count")).toContainText("0 of 900");
  if (uploads) await expect(page.getByTestId("photos-count")).toContainText("0 of 3");
  await expect(page.getByTestId("uncovered-note")).toContainText("1 hour");
  await page.getByLabel("Hours", { exact: true }).fill("2");
  await page.getByLabel("Minutes", { exact: true }).selectOption("30");
  await expect(page.getByTestId("ore-line")).toContainText("About 25 Ore once approved.");
  if (uploads) await expect(page.getByTestId("photos-count")).toContainText("0 of 1");

  await page.getByLabel("Title").fill("Wired the first board");
  await page.getByLabel("What did you work on?").fill(BODY);
  await expect(page.getByTestId("chars-count")).toContainText(/\d+ of 250/);
  await expect(page.getByTestId("save-status")).toContainText("Not saved yet");

  // Preview is a button with a pressed state, and shows the entry as a visitor reads it.
  const toggle = page.getByRole("button", { name: "Preview" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  const preview = page.getByTestId("journal-preview");
  await expect(page.getByRole("button", { name: "Write" })).toHaveAttribute("aria-pressed", "true");
  await expect(preview.getByRole("heading", { level: 3, name: "Wired the first board" })).toBeVisible();
  await expect(preview).toContainText("2.5 hours logged");
  await expect(preview).toContainText("added to the journal");
  await expect(preview.locator("strong")).toHaveText("header");
  await expect(preview.locator("li")).toHaveCount(2);
  await expect(preview).toContainText("<b>not bold</b>");
  await expect(preview.locator("a[href^='javascript']")).toHaveCount(0);
  await expect(preview).not.toContainText("Ore");
  await page.screenshot({ path: join(SHOTS, "journal-look-preview-1440-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "Write" }).click();
  await expect(page.getByLabel("What did you work on?")).toHaveValue(BODY);

  await page.getByRole("button", { name: "Save journal entry" }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${id}$`), { timeout: 15000 });
  await expect(page.getByTestId("journal-entry").getByRole("heading", { level: 3, name: "Wired the first board" })).toBeVisible();

  // The same entry as a visitor reads it: hours and body, no Ore anywhere.
  await page.goto(`/dashboard/explore/${id}`);
  const visitor = page.getByTestId("journal-entry");
  await expect(visitor).toContainText("2.5 hours logged");
  await expect(visitor.locator("strong")).toHaveText("header");
  await expect(page.locator(".pf-spp").getByText(/\bOre\b/)).toHaveCount(0);
  await page.goto(`/dashboard/explore/${id}`);
  await expect(page.getByTestId("journal-entry")).toContainText("2.5 hours logged");
  await expect(page.getByText(/Ore once approved/)).toHaveCount(0);
  await expect(page.locator(".pf-spp").getByText(/\bOre\b/)).toHaveCount(0);

  await page.goto(`/dashboard/projects/${id}`);
  await deleteProject(page, name);
});

test("unsent text comes back after a refresh and is cleared once the entry is saved", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(90000);
  const name = `Draft check ${Date.now()}`;
  await createProjectViaWizard(page, name);
  const id = await projectId(page);

  await page.goto(`/dashboard/projects/${id}/journal/new`);
  await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
  await page.getByLabel("Title").fill("Half written");
  await page.getByLabel("What did you work on?").fill("I was in the middle of this sentence");
  await page.getByLabel("Hours", { exact: true }).fill("1");
  await page.getByLabel("Minutes", { exact: true }).selectOption("15");
  await expect(page.getByTestId("save-status")).toContainText("kept in this tab");
  await page.reload();
  await expect(page.getByLabel("Title")).toHaveValue("Half written", { timeout: 30000 });
  await expect(page.getByLabel("What did you work on?")).toHaveValue("I was in the middle of this sentence");
  await expect(page.getByLabel("Hours", { exact: true })).toHaveValue("1");
  await expect(page.getByLabel("Minutes", { exact: true })).toHaveValue("15");
  await expect(page.getByText("Your unsent text from this tab is back.")).toBeVisible();

  await page.getByLabel("What did you work on?").fill(LONG);
  await page.getByRole("button", { name: "Save journal entry" }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${id}$`), { timeout: 15000 });
  await page.goto(`/dashboard/projects/${id}/journal/new`);
  await expect(page.getByLabel("Title")).toHaveValue("", { timeout: 30000 });
  await expect(page.getByLabel("What did you work on?")).toHaveValue("");

  await page.goto(`/dashboard/projects/${id}`);
  await deleteProject(page, name);
});

test("photos upload, need a description, show on the public entry, and delete", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const jpeg = await makeJpeg();
  test.skip(!jpeg, "needs sharp to make a test picture");
  test.setTimeout(120000);
  const name = `Photo check ${Date.now()}`;
  await createProjectViaWizard(page, name);
  const id = await projectId(page);

  await page.goto(`/dashboard/projects/${id}/journal/new`);
  await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
  await requireUploads(page);
  await expect(page.getByTestId("photos-off")).toHaveCount(0);
  const files = page.locator('input[type="file"][aria-label="Photo files"]');

  // Anything that is not a picture is refused, even with a picture's name.
  await files.setInputFiles({ name: "notes.jpg", mimeType: "image/jpeg", buffer: Buffer.from("these are only words, not a picture") });
  await expect(page.locator("p.pf-error[role=alert]")).toContainText("JPEG, PNG or WebP");
  await files.setInputFiles({ name: "page.png", mimeType: "image/png", buffer: Buffer.from("<!doctype html><script>alert(1)</script>") });
  await expect(page.locator("p.pf-error[role=alert]")).toContainText("JPEG, PNG or WebP");
  await expect(page.getByTestId("photo-list")).toHaveCount(0);

  await files.setInputFiles({ name: "board.jpg", mimeType: "image/jpeg", buffer: jpeg! });
  const list = page.getByTestId("photo-list");
  await expect(list.locator("li")).toHaveCount(1, { timeout: 15000 });
  await expect(page.getByTestId("photos-count")).toContainText("1 of 1");

  await page.getByLabel("Title").fill("Photographed the board");
  await page.getByLabel("What did you work on?").fill(LONG);
  await page.getByLabel("Hours", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Save journal entry" }).click();
  // The description is required, and the error sits next to the field.
  await expect(page.getByText("Describe the photo for people who can't see it.")).toBeVisible();
  await expect(page.getByLabel("Describe photo 1")).toBeFocused();
  await page.getByLabel("Describe photo 1").fill("A red circuit board on a wooden desk");
  await page.screenshot({ path: join(SHOTS, "journal-look-photos-1440-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByTestId("journal-preview").getByRole("img", { name: "A red circuit board on a wooden desk" })).toBeVisible();
  await page.getByRole("button", { name: "Write" }).click();
  await page.getByRole("button", { name: "Save journal entry" }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${id}$`), { timeout: 15000 });

  // The public entry shows the photo, lazy, with its size and its description.
  await page.goto(`/dashboard/explore/${id}`);
  const photo = page.getByTestId("entry-photos").getByRole("img", { name: "A red circuit board on a wooden desk" });
  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute("loading", "lazy");
  await expect(photo).toHaveAttribute("width", "800");
  await expect(photo).toHaveAttribute("height", "600");
  const src = (await photo.getAttribute("src")) ?? "";
  expect(src).toMatch(/^\/api\/journal-media\//);
  await expect.poll(async () => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(800);

  // What was stored is a re-encoded picture: still a JPEG, and the EXIF text from the original is gone.
  const fetched = await page.request.get(src);
  expect(fetched.status()).toBe(200);
  expect(fetched.headers()["content-type"]).toBe("image/jpeg");
  expect(fetched.headers()["x-content-type-options"]).toBe("nosniff");
  const bytes = await fetched.body();
  expect(bytes.subarray(0, 3).toString("hex")).toBe("ffd8ff");
  expect(bytes.includes(Buffer.from("secret-owner"))).toBe(false);
  for (const [width, height] of [[1440, 900], [390, 800]] as const) {
    for (const scheme of ["dark", "light"] as const) {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      await page.evaluate((theme) => localStorage.setItem("loadout-theme", theme), scheme);
      await page.reload();
      await expect(page.getByTestId("entry-photos").getByRole("img")).toBeVisible({ timeout: 30000 });
      await expect.poll(async () => page.getByTestId("entry-photos").getByRole("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(800);
      await page.screenshot({ path: join(SHOTS, `journal-writer-visitor-photo-${width}-${scheme}.png`), fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  // Delete: the owner removes the photo on the edit page; the file is gone and the public entry no longer shows it.
  await page.goto(`/dashboard/projects/${id}`);
  await page.getByTestId("journal-entry").getByRole("link", { name: /^Edit entry/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Edit journal entry" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId("photo-list").locator("li")).toHaveCount(1);
  await page.getByRole("button", { name: "Remove photo 1" }).click();
  await page.getByRole("button", { name: "Remove it" }).click();
  await expect(page.getByTestId("photo-list")).toHaveCount(0);
  expect((await page.request.get(src)).status()).toBe(404);
  await page.goto(`/dashboard/explore/${id}`);
  await expect(page.getByTestId("journal-entry")).toBeVisible();
  await expect(page.getByTestId("entry-photos")).toHaveCount(0);

  await page.goto(`/dashboard/projects/${id}`);
  await deleteProject(page, name);
});

test("a cover uploads, shows on the project and the public page, and can be removed", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const jpeg = await makeJpeg(1200, 900);
  test.skip(!jpeg, "needs sharp to make a test picture");
  test.setTimeout(90000);
  const name = `Cover check ${Date.now()}`;
  await createProjectViaWizard(page, name);
  const id = await projectId(page);

  test.skip((await page.getByTestId("cover-upload").count()) === 0, "cover uploads are off here (LOADOUT_UPLOADS is not true)");
  const cover = page.getByTestId("cover-upload");
  await expect(cover.getByRole("button", { name: "Upload a cover" })).toBeVisible();
  await cover.locator('input[type="file"]').setInputFiles({ name: "cover.jpg", mimeType: "image/jpeg", buffer: jpeg! });
  // The owner's page shows the picture through the project cover (its own small frame is hidden there), at the 16:9 crop.
  const frame = page.locator(".pf-spp-cover .pf-project-cover img");
  await expect(frame).toBeVisible({ timeout: 30000 });
  await expect(frame).toHaveAttribute("alt", `Cover of ${name}`);
  await expect(frame).toHaveAttribute("width", "1280");
  await expect(frame).toHaveAttribute("height", "720");
  await page.goto(`/dashboard/explore/${id}`);
  await expect(page.locator(".pf-spp-cover").getByRole("img", { name: `Cover of ${name}` })).toBeVisible();

  await page.goto(`/dashboard/projects/${id}`);
  await page.getByRole("button", { name: "Remove cover" }).click();
  await expect(page.getByTestId("cover-upload").getByRole("button", { name: "Upload a cover" })).toBeVisible({ timeout: 15000 });
  await deleteProject(page, name);
});

test("the upload route refuses a visitor, an unknown project and a bad kind", async ({ page, request }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  const jpeg = await makeJpeg(40, 30);
  test.skip(!jpeg, "needs sharp to make a test picture");
  const file = { name: "x.jpg", mimeType: "image/jpeg", buffer: jpeg! };
  // The context request shares the signed in builder cookie with the page.
  await page.goto("/dashboard/projects");
  const unknown = await page.request.post("/api/journal-media", { multipart: { file, projectId: "no-such-project", kind: "photo" } });
  // Uploads off: the route refuses every request before it looks at the project or kind, which is not what this test checks.
  test.skip(unknown.status() === 403, "upload route is off here (LOADOUT_UPLOADS is not true)");
  expect(unknown.status()).toBe(404);
  const badKind = await page.request.post("/api/journal-media", { multipart: { file, projectId: "x", kind: "video" } });
  expect(badKind.status()).toBe(400);
  // A request with no session at all.
  const anonymous = await request.post("/api/journal-media", { multipart: { file, projectId: "x", kind: "photo" } });
  expect([401, 404]).toContain(anonymous.status());
  const read = await request.get("/api/journal-media/does-not-exist");
  expect(read.status()).toBe(404);
});

for (const scheme of ["dark", "light"] as const) {
  test(`the writer has no horizontal scroll at 320, 390, 720 and 1440 and no axe violations (${scheme})`, async ({ page }) => {
    test.skip(STAFF_MODE, "participant pages are checked in builder mode");
    test.setTimeout(180000);
    const name = `Layout check ${scheme} ${Date.now()}`;
    await setup(page, 1440, 900, scheme);
    await createProjectViaWizard(page, name);
    const id = await projectId(page);
    const jpeg = await makeJpeg(640, 480);

    for (const [width, height] of [[320, 800], [390, 800], [720, 900], [1440, 900]] as const) {
      await page.setViewportSize({ width, height });
      await page.goto(`/dashboard/projects/${id}/journal/new`);
      await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
      await page.getByLabel("Title").fill("A very long title that has to wrap on a narrow phone screen without any sideways scrolling at all");
      await page.getByLabel("Hours", { exact: true }).fill("2");
      await page.getByLabel("What did you work on?").fill(`${LONG}\n\n${"averyveryverylongwordwithoutanybreaksatallthatkeepsgoing".repeat(3)}`);
      if (jpeg && width === 320 && (await page.locator('input[type="file"][aria-label="Photo files"]').count()) > 0) {
        await page.locator('input[type="file"][aria-label="Photo files"]').setInputFiles({ name: "p.jpg", mimeType: "image/jpeg", buffer: jpeg });
        await expect(page.getByTestId("photo-list").locator("li")).toHaveCount(1, { timeout: 15000 });
        await page.getByLabel("Describe photo 1").fill("A gradient test picture");
      }
      await noHorizontalScroll(page);
      await page.getByRole("button", { name: "Preview" }).click();
      await expect(page.getByTestId("journal-preview")).toBeVisible();
      await noHorizontalScroll(page);
      if (width === 1440 || width === 390) {
        await page.screenshot({ path: join(SHOTS, `journal-look-preview-${width}-${scheme}.png`), fullPage: true });
      }
      await page.getByRole("button", { name: "Write" }).click();
      if (width === 1440 || width === 390) await page.screenshot({ path: join(SHOTS, `journal-look-write-${width}-${scheme}.png`), fullPage: true });
      await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`), `${width}px`).toEqual([]);
    }

    // Keyboard: Shift+Tab from the writing box reaches the Preview toggle, and Space presses it.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/dashboard/projects/${id}/journal/new`);
    await page.getByLabel("What did you work on?").focus();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Preview" })).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Write" })).toHaveAttribute("aria-pressed", "true");

    await page.goto(`/dashboard/projects/${id}`);
    await deleteProject(page, name);
  });
}

// Deterministic edge cases on the full-page writer. Each test owns a project through the wizard and removes it in finally.
async function cleanupProject(page: Page, id: string, name: string) {
  page.setDefaultTimeout(10000);
  await page.goto(`/dashboard/projects/${id}`).catch(() => undefined);
  await deleteProject(page, name).catch(() => undefined);
}

test("a submitted project's journal writer is locked and shows no form", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(120000);
  const name = `Locked writer check ${Date.now()}`;
  await createProjectViaWizard(page, name);
  const id = await projectId(page);
  try {
    // Ship a complete draft through the same UI a builder uses, so the project really is locked.
    await saveProjectSettings(page, {
      description: "A small tool that turns a messy log file into a tidy table for quick reading.",
      // The README gate only reads GitHub sources; another host fails closed and keeps Submit for review disabled.
      repoUrl: "https://github.com/jeremy341/loadout",
      track: "Tools",
    });
    await addJournalEntryViaPage(page, {
      title: "Parsed the first file",
      body: "Read the log format, wrote a parser for the header lines and checked it against three sample files. The table now prints with aligned columns.",
      hours: 1,
    });
    await openProjectTab(page, "ship");
    const submit = page.locator("#ship").getByRole("button", { name: "Submit for review" }).first();
    await expect(submit).toBeEnabled({ timeout: 15000 });
    await submit.click();
    const dialog = page.getByRole("dialog", { name: "Submit for review" });
    await dialog.getByLabel("I confirm this is not school work and not paid Hack Club work.").check();
    await dialog.getByRole("button", { name: "Submit for review" }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
    await expect(page.locator(".pf-column-pill")).toHaveAttribute("data-status", "submitted", { timeout: 15000 });

    // The writer route still opens, but a locked project gets the note instead of an editable form.
    await page.goto(`/dashboard/projects/${id}/journal/new`);
    await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("p.pf-journal-locked")).toContainText("its journal is locked");
    await expect(page.getByRole("link", { name: `Back to ${name}` })).toBeVisible();
    await expect(page.locator("form.pf-jw-form")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Save journal entry" })).toHaveCount(0);
    await expect(page.getByLabel("Title")).toHaveCount(0);
  } finally {
    await cleanupProject(page, id, name);
  }
});

test("an empty title or body is refused beside the field and the text is kept", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(90000);
  const name = `Empty fields check ${Date.now()}`;
  await createProjectViaWizard(page, name);
  const id = await projectId(page);
  try {
    await page.goto(`/dashboard/projects/${id}/journal/new`);
    await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
    const title = page.getByLabel("Title");
    const body = page.getByLabel("What did you work on?");
    // Whitespace is still empty once the server trims it.
    await title.fill("   ");
    await body.fill("   ");
    await page.getByLabel("Hours", { exact: true }).fill("1");
    await page.getByRole("button", { name: "Save journal entry" }).click();
    await expect(page.getByText("Give the entry a title.")).toBeVisible();
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(title).toBeFocused();
    await expect(page.locator(".pf-jw-error")).toHaveCount(0);
    await expect(page.getByTestId("save-status")).toContainText("Not saved. Check the marked fields.");
    await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${id}/journal/new$`));

    // With a title in place, the whitespace-only body is the next field the server rejects.
    await title.fill("A real title");
    await page.getByRole("button", { name: "Save journal entry" }).click();
    await expect(page.getByText("Write what you did in this entry.")).toBeVisible();
    await expect(body).toHaveAttribute("aria-invalid", "true");
    await expect(body).toBeFocused();
    await expect(title).toHaveValue("A real title");

    // Fixing the body clears the error and saves the entry.
    await body.fill(LONG);
    await page.getByRole("button", { name: "Save journal entry" }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${id}$`), { timeout: 15000 });
    await expect(page.getByTestId("journal-entry").getByRole("heading", { level: 3, name: "A real title" })).toBeVisible();
  } finally {
    await cleanupProject(page, id, name);
  }
});

test("the writer accepts only quarter hours from a quarter hour up to twelve", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(90000);
  const name = `Hours boundary check ${Date.now()}`;
  await createProjectViaWizard(page, name);
  const id = await projectId(page);
  try {
    await page.goto(`/dashboard/projects/${id}/journal/new`);
    await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
    const uploads = await uploadsOn(page);
    await page.getByLabel("Title").fill("Boundary check");
    await page.getByLabel("What did you work on?").fill(LONG);
    const hours = page.getByLabel("Hours", { exact: true });
    const minutes = page.getByLabel("Minutes", { exact: true });

    await page.getByRole("button", { name: "Save journal entry" }).click();
    await expect(page.getByText("Enter the hours you worked.")).toBeVisible();
    await expect(hours).toBeFocused();

    // The smallest valid quarter hour sets the smallest text and photo allowances.
    await hours.fill("0");
    await minutes.selectOption("15");
    await expect(page.getByTestId("chars-count")).toHaveAttribute("data-met", "true");
    await expect(page.getByTestId("chars-count")).toContainText(" of 100");
    if (uploads) await expect(page.getByTestId("photos-count")).toContainText("0 of 1");
    await expect(page.getByTestId("ore-line")).toContainText("About 3 Ore once approved.");

    // Just below the minimum and above the maximum are both refused beside the field.
    await hours.fill("0.1");
    await minutes.selectOption("0");
    await page.getByRole("button", { name: "Save journal entry" }).click();
    await expect(page.getByText("Log at least a quarter of an hour.")).toBeVisible();
    await hours.fill("13");
    await page.getByRole("button", { name: "Save journal entry" }).click();
    await expect(page.getByText("One entry covers up to 12 hours. Split longer sessions.")).toBeVisible();

    // Twelve is the largest accepted entry: its counts, advice and Ore line all match the cap.
    await hours.fill("12");
    await minutes.selectOption("0");
    // Twelve hours needs 1200 characters of evidence, so lengthen the entry before saving it.
    await page.getByLabel("What did you work on?").fill(LONG.repeat(8));
    await expect(page.getByTestId("chars-count")).toHaveAttribute("data-met", "true");
    await expect(page.getByTestId("chars-count")).toContainText(" of 1200");
    if (uploads) await expect(page.getByTestId("photos-count")).toContainText("0 of 3");
    await expect(page.getByTestId("ore-line")).toContainText("About 120 Ore once approved.");
    await expect(page.getByText("A session over 7 hours is easier to review with a timelapse.", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Save journal entry" }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${id}$`), { timeout: 15000 });
    await expect(page.getByTestId("journal-entry")).toContainText("12 hours logged");
  } finally {
    await cleanupProject(page, id, name);
  }
});

test("the writing box stops at 5000 characters and the toolbar cannot push it over", async ({ page }) => {
  test.skip(STAFF_MODE, "participant pages are checked in builder mode");
  test.setTimeout(90000);
  const name = `Body cap check ${Date.now()}`;
  await createProjectViaWizard(page, name);
  const id = await projectId(page);
  try {
    await page.goto(`/dashboard/projects/${id}/journal/new`);
    await expect(page.getByRole("heading", { level: 1, name: "New journal entry" })).toBeVisible({ timeout: 30000 });
    await page.getByLabel("Title").fill("Body cap");
    await page.getByLabel("Hours", { exact: true }).fill("1");
    const body = page.getByLabel("What did you work on?");
    await expect(body).toHaveAttribute("maxlength", "5000");

    await body.fill("x".repeat(5000));
    expect(await body.inputValue()).toBe("x".repeat(5000));
    await expect(page.getByTestId("chars-count")).toContainText("5000 of 5000 allowed");
    await expect(page.getByTestId("chars-count")).toHaveAttribute("data-met", "true");

    // At the cap, Bold would add four characters, so the toolbar leaves the text alone.
    await body.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.getByRole("button", { name: "Bold" }).click();
    expect(await body.inputValue()).toBe("x".repeat(5000));

    // One character's worth of room short of the cap, Bold fits exactly.
    await body.fill("x".repeat(4996));
    await body.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.getByRole("button", { name: "Bold" }).click();
    expect(await body.inputValue()).toBe(`**${"x".repeat(4996)}**`);
  } finally {
    await cleanupProject(page, id, name);
  }
});
