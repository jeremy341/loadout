import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { actAs, REVIEW_BASE, type PreviewRole } from "./reviewer-helpers";
import { addJournalEntryViaPage, createProjectViaWizard, openProjectTab, saveProjectSettings } from "./new-project-helper";
import {
  signWebhook,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from "../lib/platform/integrations/webhook-signature";

// The webServer in playwright.config.ts gives the app this test-only secret. It is not a production credential.
const WEBHOOK_SECRET = "loadout-test-webhook-secret-123456";

// The review desk against the database (lib/platform/review-actions.ts). A builder ships a project through the builder pages, a first
// reviewer and a final reviewer (the local test accounts) work it on the review host, and the builder sees the result.
// The test creates its own projects and deletes them through the builder pages at the end. The seeded accounts are untouched.
// Screenshots go to LOADOUT_SHOTS (default: the temp folder) as reviewer-*.png.
const STAFF_MODE = process.env.LOADOUT_E2E_STAFF === "true";
const SHOTS = process.env.LOADOUT_SHOTS ?? "C:/Users/jerem/AppData/Local/Temp/loadout-shots";
test.describe.configure({ mode: "serial" });
test.setTimeout(240_000);
const log = (message: string) => console.log(`[desk ${new Date().toISOString().slice(11, 19)}] ${message}`);

async function createProject(page: Page, name: string) {
  await createProjectViaWizard(page, name);
}

async function shipProject(page: Page, name: string) {
  log(`creating ${name}`);
  await createProject(page, name);
  log("created");
  await saveProjectSettings(page, {
    description: "A small tool that turns a messy log file into a tidy table for quick reading by people.",
    // The README gate only fetches GitHub sources; other hosts fail closed and keep Submit for review disabled.
    repoUrl: "https://github.com/jeremy341/loadout",
    track: "Tools",
  });
  await addJournalEntryViaPage(page, {
    title: "Parsed the log files",
    body: "Read the log format, wrote a parser for the header lines and the body, and checked it against five sample files. The table prints with aligned columns, a header row and a summary line that counts the errors. Then I wrote tests for the odd cases.",
    hours: 2,
  });
  await openProjectTab(page, "ship");
  const submit = page.locator("#ship").getByRole("button", { name: "Submit for review" });
  await expect(submit).toBeEnabled({ timeout: 15000 });
  await submit.click();
  const dialog = page.getByRole("dialog", { name: "Submit for review" });
  await dialog.getByLabel("I confirm this is not school work and not paid Hack Club work.").check();
  await dialog.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.locator("#ship").getByText("Submitted.", { exact: false })).toBeVisible({ timeout: 15000 });
  log("submitted");
}

async function deleteProject(page: Page, name: string) {
  await page.keyboard.press("Escape");
  await openProjectTab(page, "settings");
  await page.getByRole("button", { name: "Delete project..." }).click();
  await page.getByLabel(/to confirm/).fill(name);
  await page.getByRole("button", { name: "Permanently delete project" }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects$/, { timeout: 15000 });
}

async function staffPage(browser: Browser, role: PreviewRole): Promise<{ context: BrowserContext; page: Page }> {
  // Tall, so the desk's internal scroll panes show the whole verdict form in the screenshots.
  const context = await browser.newContext({ baseURL: REVIEW_BASE, viewport: { width: 1440, height: 2400 } });
  await actAs(context, role);
  const page = await context.newPage();
  // Hold and release ask "are you sure" with a browser confirm; accept it.
  page.on("dialog", (dialog) => void dialog.accept());
  return { context, page };
}

// A first-pass approval parks a real ship in Fraud review. There is no live Robert desk in staging, so the test sends a signed
// outcome to the same webhook the service uses. The desk id in the URL is Project.seq, which our external id carries.
async function scoreParkedShip(page: Page, shipUrl: string) {
  const seq = Number(shipUrl.split("/").pop());
  if (!Number.isSafeInteger(seq) || seq <= 0) throw new Error(`No desk sequence in ${shipUrl}`);
  const raw = JSON.stringify({
    event: "outcome.set",
    externalId: `loadout-${seq}-0`,
    outcome: { trustScore: 8, reviewedAt: new Date().toISOString() },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const response = await page.request.post("/api/fraud-outcome", {
    data: raw,
    headers: {
      "content-type": "application/json",
      [WEBHOOK_TIMESTAMP_HEADER]: timestamp,
      [WEBHOOK_SIGNATURE_HEADER]: signWebhook(WEBHOOK_SECRET, timestamp, raw),
    },
  });
  expect(response.status(), await response.text()).toBe(202);
  expect((await response.json()).advanced).toBe(true);
}

// The ship's row on a queue page, opened. The queue lists the newest waits last, so the test finds it by name.
async function openShip(page: Page, list: string, name: string) {
  log(`open ${list}`);
  // The queue is oldest first and 15 to a page, so a new ship sits on a later page while the sample ships are on.
  for (let number = 1; number <= 8; number += 1) {
    await page.goto(`${list}?page=${number}`);
    // The table streams in after the page loads, so wait for a row (or an empty list) before counting.
    await page.getByRole("row").nth(1).waitFor({ timeout: 15000 }).catch(() => undefined);
    const link = page.getByRole("link", { name });
    if ((await link.count()) > 0) return link.first();
  }
  throw new Error(`${name} is not in ${list}`);
}

async function startReviewing(page: Page) {
  log("start reviewing");
  await page.getByRole("button", { name: "Start reviewing" }).click({ timeout: 15000 });
  await expect(page.getByRole("button", { name: "Stop reviewing" })).toBeVisible({ timeout: 30000 });
}

async function decideEntry(page: Page, hours: string) {
  log("decide entry");
  await page.getByRole("tab", { name: /^Journals/ }).click();
  const credit = page.getByRole("tabpanel").filter({ has: page.getByLabel("Credit") }).getByLabel("Credit").first();
  await credit.fill(hours);
  // The action saves, then the desk reloads the ship's page.
  const saved = page.waitForResponse((response) => response.request().method() === "POST" && /\/review\/\d+$/.test(response.url()), { timeout: 20000 });
  await page.getByRole("button", { name: "Set" }).first().click();
  await saved;
  await page.waitForLoadState("load");
  await expect(page.getByRole("button", { name: "Stop reviewing" })).toBeVisible({ timeout: 30000 });
}

async function writeVerdict(page: Page, opts: { note: string; features?: string; notes?: string; button: RegExp; reason?: string }) {
  if (opts.features) await page.getByLabel("Technical features").fill(opts.features);
  if (opts.notes) await page.getByLabel("Additional notes").fill(opts.notes);
  await page.getByLabel("Note to the builder").fill(opts.note);
  if (opts.reason) await page.getByRole("button", { name: opts.reason }).click();
  await page.getByRole("button", { name: opts.button }).click();
}

test.describe("the review desk against the database", () => {
  test.skip(STAFF_MODE, "the builder pages are checked in builder mode");

  test("a first pass, a scored outcome and a second pass approve a shipped project and confirm its Ore", async ({ page, browser }) => {
    const name = `Desk approve ${Date.now()}`;
    await shipProject(page, name);
    const projectUrl = page.url().split("?")[0];
    const first = await staffPage(browser, "reviewer");
    const final = await staffPage(browser, "final-reviewer");
    try {
      // The reviewer sees the real ship in the queue and picks it up.
      const row = await openShip(first.page, "/review", name);
      await first.page.screenshot({ path: `${SHOTS}/reviewer-queue-real.png`, fullPage: true });
      await row.click();
      await expect(first.page.getByRole("heading", { name })).toBeVisible({ timeout: 30000 });
      const shipUrl = first.page.url();
      await startReviewing(first.page);

      // A verdict is refused until every entry has a decision.
      await writeVerdict(first.page, { note: "Looks like real work and the journal matches the repo.", features: "A log parser with header, body and summary handling and tests.", notes: "Originality fine. Depth fine. Execution fine. Documentation fine.", button: /^Approve$/ });
      await expect(first.page.getByText("Every journal entry needs a decision before a verdict.")).toBeVisible({ timeout: 30000 });
      await decideEntry(first.page, "2");
      await first.page.screenshot({ path: `${SHOTS}/reviewer-desk-verdict.png`, fullPage: true });
      await writeVerdict(first.page, { note: "Looks like real work and the journal matches the repo.", features: "A log parser with header, body and summary handling and tests.", notes: "Originality fine. Depth fine. Execution fine. Documentation fine.", button: /^Approve$/ });
      // The desk moves on to the next ship in the queue (or the queue itself).
      await expect(first.page).not.toHaveURL(shipUrl, { timeout: 30000 });

      // A real score moves the parked ship to Second pass. In staging the outcome comes through the signed webhook.
      await scoreParkedShip(page, shipUrl);

      // The builder sees the second pass, and the Ore is pending, not confirmed.
      await page.goto(`${projectUrl}?tab=ship`);
      await expect(page.locator("#ship").getByText("Second pass", { exact: false })).toBeVisible({ timeout: 15000 });
      await page.goto("/dashboard/ledger");
      // The ledger hides the desk's internal project id ("Desk approve 1794..."), so the reason keeps only the sentence. Rows
      // from earlier runs share that sentence, so the row is found by the project link it carries.
      const pendingRow = page.locator('.pf-ledger-row[data-kind="approved_hours"][data-status="pending"]').filter({ has: page.getByRole("link", { name, exact: true }) });
      await expect(pendingRow).toContainText("Pending: 2 approved hours recommended at the first pass.", { timeout: 30000 });
      await expect(pendingRow).toHaveAttribute("data-status", "pending");

      // The final reviewer: the scored ship is in Second pass and the verdict form is open without a human triage gate.
      const secondRow = await openShip(final.page, "/review/second-pass", name);
      await secondRow.click();
      await expect(final.page.getByRole("heading", { name })).toBeVisible({ timeout: 30000 });
      const secondUrl = final.page.url();
      await expect(final.page.getByRole("heading", { name: "Fraud triage" })).toHaveCount(0);
      await startReviewing(final.page);
      await expect(final.page.getByRole("button", { name: /Approve & credit Ore/ })).toBeVisible();
      await final.page.screenshot({ path: `${SHOTS}/reviewer-second-pass-verdict.png`, fullPage: true });
      await writeVerdict(final.page, { note: "Approved. Clean parser, good tests, tidy output.", features: "A log parser with header, body and summary handling and tests.", notes: "All four dimensions checked on the repo; hours match.", button: /Approve & credit Ore/ });
      await expect(final.page).not.toHaveURL(secondUrl, { timeout: 30000 });

      // The builder sees the approved state with the reviewer's note, and the Ore is confirmed in the ledger.
      await page.goto(`${projectUrl}?tab=ship`);
      await expect(page.locator("#ship [data-ship=approved]")).toBeVisible({ timeout: 15000 });
      await expect(page.locator("#ship").getByText("Approved. Clean parser, good tests, tidy output.")).toBeVisible();
      await page.screenshot({ path: `${SHOTS}/reviewer-builder-approved.png`, fullPage: true });
      await page.goto("/dashboard/ledger");
      const entry = page.locator('.pf-ledger-row[data-kind="approved_hours"][data-status="confirmed"]').filter({ has: page.getByRole("link", { name, exact: true }) });
      await expect(entry).toContainText("Approved: 2 new hours.", { timeout: 30000 });
      await expect(entry).toHaveAttribute("data-status", "confirmed");
      await page.screenshot({ path: `${SHOTS}/reviewer-builder-ledger.png`, fullPage: true });
    } finally {
      await first.context.close();
      await final.context.close();
      await page.goto(`${projectUrl}?tab=ship`);
      await deleteProject(page, name).catch(() => undefined);
    }
  });

  test("a hold blocks a verdict, and a first pass can send the ship back with a reason the builder sees", async ({ page, browser }) => {
    const name = `Desk changes ${Date.now()}`;
    await shipProject(page, name);
    const projectUrl = page.url().split("?")[0];
    const first = await staffPage(browser, "reviewer");
    const final = await staffPage(browser, "final-reviewer");
    try {
      const row = await openShip(first.page, "/review", name);
      await row.click();
      await startReviewing(first.page);
      await decideEntry(first.page, "2");
      const shipUrl = first.page.url();

      // Another reviewer puts the ship on hold: the first reviewer's claim goes with it, and no verdict is possible.
      await final.page.goto(shipUrl);
      await final.page.getByRole("tab", { name: /^Actions/ }).click();
      await final.page.getByText("Put this review on hold").click();
      await final.page.getByPlaceholder(/Why hold this/).fill("Waiting to hear back about the repository owner.");
      await final.page.getByRole("button", { name: "Hold this review" }).click();
      // Wait for the hold to be visible to the holder before the first reviewer reloads: the action's redirect can land
      // before the new desk page has rendered, and a reload in that gap reads the old state.
      await expect(final.page.getByText("On hold, can't be reviewed right now")).toBeVisible({ timeout: 15000 });
      await first.page.goto(shipUrl);
      // The hold is what removes the verdict, so wait for it to show before checking the buttons: a cold desk route can
      // otherwise still render the button from the first reviewer's earlier claim.
      await expect(first.page.getByText("On hold, can't be reviewed right now")).toBeVisible({ timeout: 15000 });
      await expect(first.page.getByRole("button", { name: /^Approve$/ })).toHaveCount(0);
      await expect(first.page.getByRole("button", { name: "Request changes" })).toHaveCount(0);
      await first.page.screenshot({ path: `${SHOTS}/reviewer-desk-held.png`, fullPage: true });

      // The holder releases it; the first reviewer claims it again and asks for changes with a reason code.
      await final.page.goto(shipUrl);
      await final.page.getByRole("tab", { name: /^Actions/ }).click();
      const release = final.page.getByRole("button", { name: "Release hold" });
      await expect(release).toBeVisible({ timeout: 15000 });
      await release.click();
      await expect(final.page.getByText("On hold, can't be reviewed right now")).toHaveCount(0, { timeout: 15000 });
      await first.page.goto(shipUrl);
      await startReviewing(first.page);
      await writeVerdict(first.page, { note: "The README has no run steps, so I could not start it. Add them and ship again.", button: /Request changes/, reason: "README missing steps" });
      await expect(first.page).not.toHaveURL(shipUrl, { timeout: 30000 });

      await page.goto(`${projectUrl}?tab=ship`);
      const note = page.locator("#ship").getByRole("note");
      // The reason label sits in the returned-ship section; the note itself carries the reviewer's words.
      await expect(page.locator("#ship")).toContainText("Reason: README missing steps", { timeout: 15000 });
      await expect(note).toContainText("The README has no run steps");
      await page.screenshot({ path: `${SHOTS}/reviewer-builder-changes.png`, fullPage: true });
    } finally {
      await first.context.close();
      await final.context.close();
      await page.goto(`${projectUrl}?tab=ship`);
      await deleteProject(page, name).catch(() => undefined);
    }
  });
});
