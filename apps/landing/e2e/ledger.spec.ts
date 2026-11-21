import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The Ore ledger page and the top bar chip. Local development opens as the builder test account, which has sample entries
// from `bun run db:seed:local` (confirmed and pending, all of kind "dev_seed").
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("the top bar chip shows the confirmed balance and links to the ledger", async ({ page }) => {
  await page.goto("/dashboard/ledger");
  await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });
  const available = (await page.getByTestId("ledger-available").innerText()).replace(/\s*Ore$/, "");
  const chip = page.locator("a.pf-ore");
  await expect(chip).toHaveAttribute("href", "/dashboard/ledger");
  await expect(chip.locator(".pf-ore-value")).toHaveText(available);
  const pending = (await page.getByTestId("ledger-pending").innerText()).replace(/\s*Ore$/, "");
  if (pending !== "0") await expect(chip).toHaveAttribute("title", `Ore, confirmed. ${pending} pending.`);
  await page.goto("/dashboard");
  await page.locator("a.pf-ore").click();
  await expect(page).toHaveURL(/\/dashboard\/ledger$/);
});

test("the account menu lists Ledger with Profile, Orders, Referrals and Settings", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Account" }).click();
  const menu = page.getByRole("navigation", { name: "Account" });
  await expect(menu.getByRole("link")).toHaveText(["Profile", "Ledger", "Notifications", "Orders", "Referrals", "Settings"]);
});

test("the balance block shows what you can spend, what is pending and what pending means", async ({ page }) => {
  await page.goto("/dashboard/ledger");
  const balance = page.getByRole("region", { name: "Balance" });
  await expect(balance.getByText("You can spend")).toBeVisible();
  await expect(page.getByTestId("ledger-available")).toHaveText(/^[\d,]+ Ore$/);
  await expect(balance.getByText("Pending", { exact: true })).toBeVisible();
  await expect(page.getByTestId("ledger-pending")).toHaveText(/^[\d,]+ Ore$/);
  await expect(balance.getByText("Pending Ore is waiting for a reviewer to approve your hours.")).toBeVisible();
  await expect(page.getByTestId("ledger-earned")).toHaveText(/^[\d,]+ Ore$/);
  await expect(page.getByTestId("ledger-spent")).toHaveText(/^[\d,]+ Ore$/);
});

test("each entry shows a date, a kind, a status, a signed amount and the balance for confirmed rows", async ({ page }) => {
  await page.goto("/dashboard/ledger");
  const rows = page.locator("li.pf-ledger-row");
  await expect(rows.first()).toBeVisible();
  await expect(page.locator(".pf-ledger-day h3").first()).toBeVisible();
  for (const row of await rows.all()) {
    await expect(row.locator("time")).toHaveText(/^\d{1,2} [A-Z][a-z]{2}, \d{2}:\d{2}$/);
    await expect(row.locator(".pf-ledger-kind")).not.toBeEmpty();
    await expect(row.locator(".pf-ledger-amount")).toHaveText(/^[+−][\d,]+ Ore$/);
    await expect(row.locator(".pf-ledger-status")).toHaveText(/^(Pending|Confirmed)$/);
    const status = await row.getAttribute("data-status");
    if (status === "confirmed") await expect(row.locator(".pf-ledger-after")).toHaveText(/^Balance [\d,−]+ Ore$/);
    else await expect(row.locator(".pf-ledger-after")).toHaveCount(0);
    // No internal ids in the text.
    expect(await row.innerText()).not.toMatch(/Desk approve|\d{10,}/);
  }
});

test("the kind filter is one select, narrows the list and an empty kind shows what to do", async ({ page }) => {
  await page.goto("/dashboard/ledger");
  const select = page.getByLabel("Show");
  await expect(select).toHaveValue("");
  await expect(page.locator(".pf-ledger-filter select")).toHaveCount(1);
  await select.selectOption({ label: "Starting balance" });
  await expect(page).toHaveURL(/\?kind=dev_seed$/);
  await expect(page.locator("li.pf-ledger-row")).not.toHaveCount(0);
  for (const kind of await page.locator("li.pf-ledger-row").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-kind")))) expect(kind).toBe("dev_seed");
  await page.getByLabel("Show").selectOption({ label: "Shop refund" });
  await expect(page).toHaveURL(/\?kind=shop_refund$/);
  await expect(page.getByRole("heading", { name: "No entries of this kind" })).toBeVisible();
  await expect(page.getByText("You have no Shop refund entries yet.")).toBeVisible();
  await expect(page.locator("li.pf-ledger-row")).toHaveCount(0);
  await page.getByRole("link", { name: "Show all entries" }).click();
  await expect(page).toHaveURL(/\/dashboard\/ledger$/);
});

test("a bad kind or page in the address falls back to the full first page", async ({ page }) => {
  await page.goto("/dashboard/ledger?kind=nope&page=-4");
  await expect(page.getByLabel("Show")).toHaveValue("");
  await page.goto("/dashboard/ledger?page=99");
  await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible();
});

for (const width of [320, 390, 720, 1440]) {
  test(`the ledger has no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard/ledger");
    await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

for (const scheme of ["dark", "light"] as const) {
  for (const width of [390, 1440]) {
    test(`the ledger has no axe violations in ${scheme} at ${width}px and a screenshot is taken`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/dashboard/ledger");
      await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations).toEqual([]);
      await page.screenshot({ path: `C:/Users/jerem/AppData/Local/Temp/loadout-shots/ledger-new-${width}-${scheme}.png`, fullPage: true });
    });
  }
}

// Edge cases below use only the preview-role cookie (an isolated browser context per test) or ?kind=/?page= addresses, so
// they never write to the shared database. The "none" test account has no ledger entries; the builder account has the four
// fixed "dev_seed" sample rows (lib/platform/local-ledger.ts), all on separate UTC days. Nothing here needs a dev server
// started by this agent, and no Playwright artifact is written to Git.

test("an account with no entries sees the honest empty state with zero balances", async ({ page, baseURL }) => {
  const context = page.context();
  await context.addCookies([{ name: "loadout_preview_role", value: "none", url: baseURL ?? "http://localhost:3001" }]);
  try {
    await page.goto("/dashboard/ledger");
    await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });

    // The balance block still renders, with honest zeros rather than a blank page.
    await expect(page.getByTestId("ledger-available")).toHaveText("0 Ore");
    await expect(page.getByTestId("ledger-pending")).toHaveText("0 Ore");
    await expect(page.getByTestId("ledger-earned")).toHaveText("0 Ore");
    await expect(page.getByTestId("ledger-spent")).toHaveText("0 Ore");

    // The no-entries-at-all branch, which is different from the "no entries of this kind" branch.
    const empty = page.locator(".pf-empty");
    await expect(empty.getByRole("heading", { name: "No Ore yet" })).toBeVisible();
    await expect(empty).toContainText("Log hours on a project.");
    await expect(empty.getByRole("link", { name: "Go to Projects" })).toHaveAttribute("href", "/dashboard");
    await expect(empty.getByRole("link", { name: /explore what others build/ })).toHaveAttribute("href", "/dashboard/explore");
    await expect(page.locator("li.pf-ledger-row")).toHaveCount(0);
    await expect(page.locator(".pf-ledger-day")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Ledger pages" })).toHaveCount(0);

    // The same account with a kind filter gets the other, still honest, empty branch.
    await page.goto("/dashboard/ledger?kind=approved_hours");
    await expect(page.getByRole("heading", { name: "No entries of this kind" })).toBeVisible();
    await expect(page.getByText("You have no Approved hours entries yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Show all entries" })).toHaveAttribute("href", "/dashboard/ledger");
    await expect(page.locator("li.pf-ledger-row")).toHaveCount(0);
  } finally {
    await context.clearCookies();
  }
});

test("an unknown kind in the address is ignored and the full ledger is shown", async ({ page }) => {
  await page.goto("/dashboard/ledger");
  await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });
  const allCount = await page.locator("li.pf-ledger-row").count();
  expect(allCount).toBeGreaterThan(0);

  await page.goto("/dashboard/ledger?kind=not_a_real_kind");
  await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(/\?kind=not_a_real_kind$/);
  await expect(page.getByLabel("Show")).toHaveValue("");
  await expect(page.locator("li.pf-ledger-row")).toHaveCount(allCount);
  await expect(page.locator(".pf-empty")).toHaveCount(0);
  await expect(page.locator(".pf-ledger-note")).toHaveCount(0);
  // No kind filter means balances are still shown against the whole history.
  await expect(page.locator(".pf-ledger-after").first()).toBeVisible();
});

test("bad page values fall back to page one without blanking the list", async ({ page }) => {
  // Every value here is either non-numeric or outside the accepted 1-6 digit range, so parsing always yields page 1.
  for (const value of ["0", "-4", "abc", "2.5", "%2B2", "9999999"]) {
    await page.goto(`/dashboard/ledger?page=${value}`);
    await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("li.pf-ledger-row").first()).toBeVisible();
    await expect(page.getByLabel("Show")).toHaveValue("");
    const pager = page.getByRole("navigation", { name: "Ledger pages" });
    if (await pager.count()) await expect(pager).toContainText("Page 1 of ");
  }
});

test("a valid kind survives an out-of-range page", async ({ page }) => {
  await page.goto("/dashboard/ledger?kind=dev_seed&page=999999");
  await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByLabel("Show")).toHaveValue("dev_seed");
  await expect(page.locator(".pf-ledger-note")).toBeVisible();
  for (const kind of await page.locator("li.pf-ledger-row").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-kind")))) expect(kind).toBe("dev_seed");
  const pager = page.getByRole("navigation", { name: "Ledger pages" });
  if (await pager.count()) await expect(pager).toContainText("Page 1 of ");
});

test("entries are grouped by UTC day with newest day and newest row first", async ({ page }) => {
  await page.goto("/dashboard/ledger");
  await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible({ timeout: 30000 });
  const groups = page.locator(".pf-ledger-day");
  await expect(groups.first()).toBeVisible();
  expect(await groups.count()).toBeGreaterThan(0);

  const daysInOrder: string[] = [];
  for (const group of await groups.all()) {
    await expect(group.locator("h3")).toBeVisible();
    // textContent keeps the source casing; innerText would apply the heading's uppercase text-transform.
    await expect(group).toHaveAttribute("aria-label", (await group.locator("h3").textContent())?.trim() ?? "");
    const rows = group.locator("li.pf-ledger-row");
    expect(await rows.count()).toBeGreaterThan(0);

    // The <time> datetime is the UTC ISO string, so string sorting is chronological sorting.
    const times = await rows.locator("time").evaluateAll((els) => els.map((el) => el.getAttribute("datetime") ?? ""));
    expect(times.length).toBeGreaterThan(0);
    expect(times.every((value) => /^\d{4}-\d{2}-\d{2}T/.test(value))).toBe(true);
    expect(times).toEqual([...times].sort().reverse());

    // A group holds exactly one UTC day, and the groups themselves run newest day first.
    const groupDays = new Set(times.map((value) => value.slice(0, 10)));
    expect(groupDays.size).toBe(1);
    daysInOrder.push([...groupDays][0]);
  }
  expect(new Set(daysInOrder).size).toBe(daysInOrder.length);
  expect(daysInOrder).toEqual([...daysInOrder].sort().reverse());
});
