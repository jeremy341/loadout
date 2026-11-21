import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Hack Club Auth sign-in. These checks run with HCA_CLIENT_ID unset (the default in development), where the page says
// sign-in is not set up and the start route makes no outside call. Local test accounts keep working. The test runner does
// not read the app's .env.local, so the running server is asked instead of the runner's environment.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function serverHasAuthKeys(request: import("@playwright/test").APIRequestContext) {
  const response = await request.get("/api/auth/hackclub/start", { maxRedirects: 0 });
  return (response.headers().location ?? "").includes("auth.hackclub.com");
}

test("sign-in page shows the not-connected block when the app keys are missing", async ({ page, request }) => {
  test.skip(await serverHasAuthKeys(request), "the running server has the Hack Club Auth app keys");
  await page.goto("/dashboard/sign-in");
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible({ timeout: 30000 });
  const block = page.getByRole("group", { name: /Sign in with Hack Club Auth, Not connected/ });
  await expect(block).toBeVisible();
  await expect(block.getByText("Not set up yet. The Hack Club Auth app is not configured on this server.")).toBeVisible();
  await expect(block.getByRole("button", { name: "Sign in with Hack Club Auth" })).toBeDisabled();
});

test("start route does not call out when the app keys are missing", async ({ request }) => {
  test.skip(await serverHasAuthKeys(request), "the running server has the Hack Club Auth app keys");
  const response = await request.get("/api/auth/hackclub/start", { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toContain("/dashboard/sign-in");
  expect(response.headers().location).not.toContain("auth.hackclub.com");
});

test("an error code shows a plain message and unknown codes show nothing", async ({ page }) => {
  await page.goto("/dashboard/sign-in?error=expired_state");
  // Scope to the page: Next's route announcer also has role="alert" once a client navigation has happened.
  const alert = page.locator("main [role='alert']");
  await expect(alert).toHaveText("Sign-in took too long. Start again.");
  await page.goto("/dashboard/sign-in?error=%3Cscript%3E");
  await expect(alert).toHaveCount(0);
});

test("the shell still opens for the local test builder", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Your account is eligible.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Notifications" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Display" })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`sign-in page passes axe at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/dashboard/sign-in?error=denied");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible({ timeout: 30000 });
    const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(result.violations).toEqual([]);
  });
}

// Edge cases around the local preview role and the redirect target. The preview cookie selects a local test account for one
// request (lib/platform/session.ts); each case clears it in a finally block so it cannot leak into another test.
async function withPreviewRole<T>(
  context: import("@playwright/test").BrowserContext,
  baseURL: string | undefined,
  role: string,
  run: () => Promise<T>,
): Promise<T> {
  await context.addCookies([{ name: "loadout_preview_role", value: role, url: baseURL ?? "http://localhost:3001" }]);
  try {
    return await run();
  } finally {
    await context.clearCookies();
  }
}

test("a visitor preview role still reaches the public sign-in page", async ({ page, context, baseURL }) => {
  await withPreviewRole(context, baseURL, "visitor", async () => {
    // An error code keeps this route public even when the app is configured, so the assertions hold in either setup.
    await page.goto("/dashboard/sign-in?error=denied");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible({ timeout: 30000 });
    await expect(page.locator("main [role='alert']")).toHaveText("Hack Club Auth did not give access, so you are not signed in.");
    await expect(page.getByRole("navigation", { name: "Participant" })).toHaveCount(0);
  });
});

test("an unknown preview role falls back to the builder test account", async ({ page, context, baseURL }) => {
  await withPreviewRole(context, baseURL, "not-a-real-role", async () => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Your account is eligible.")).toBeVisible();
  });
});

test("the start route ignores redirect-target parameters when the app keys are missing", async ({ request }) => {
  test.skip(await serverHasAuthKeys(request), "the running server has the Hack Club Auth app keys");
  const response = await request.get(
    "/api/auth/hackclub/start?next=https%3A%2F%2Fevil.example%2Fsteal&return_to=https%3A%2F%2Fevil.example%2Fsteal",
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(303);
  expect(response.headers().location).toContain("/dashboard/sign-in");
  expect(response.headers().location).not.toContain("evil.example");
});

test("a repeated error code uses the first value", async ({ page }) => {
  await page.goto("/dashboard/sign-in?error=expired_state&error=denied");
  await expect(page.locator("main [role='alert']")).toHaveText("Sign-in took too long. Start again.");
});
