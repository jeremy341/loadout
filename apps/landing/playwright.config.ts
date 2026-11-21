import { defineConfig } from "@playwright/test";

const port = process.env.LOADOUT_TEST_PORT ?? "3001";
const baseURL = process.env.LOADOUT_TEST_BASE_URL ?? `http://localhost:${port}`;
// A local caller may test the already-running preview; CI always starts its isolated server.
const reuseLocalServer = !process.env.CI && process.env.LOADOUT_TEST_REUSE_SERVER === "true";
// The shared test database has one seeded builder identity, and several specs toggle its Saved/kudos/RSVP/API-key rows.
// Two workers is the count those fixtures were sized for; LOADOUT_E2E_WORKERS can raise it, but the mutating specs must be
// isolated first or higher counts trade speed for order-dependent flakes.
const requestedWorkers = Number(process.env.LOADOUT_E2E_WORKERS ?? 2);
const workers = Number.isFinite(requestedWorkers) && requestedWorkers > 0 ? Math.floor(requestedWorkers) : 2;
// next dev compiles a route the first time a test opens it. A full local verification run can use the same built server as
// CI instead: LOADOUT_TEST_PROD=true builds once and serves the build, at the cost of the build step up front.
// CI keeps the dev server: the participant and reviewer suites sign in as local test accounts, which the app disables
// under NODE_ENV=production. The CI job migrates and seeds its own database before Playwright starts this server.
const prodServer = process.env.LOADOUT_TEST_PROD === "true";

export default defineConfig({
  testDir: "./e2e",
  // The browser jobs use these to give the two Orry files their own runners and shard everything
  // else, so no spec can be forgotten. An unset or empty value keeps Playwright's default, which
  // is what the plain local run uses.
  testMatch: process.env.LOADOUT_E2E_MATCH
    ? process.env.LOADOUT_E2E_MATCH.split(",")
    : undefined,
  testIgnore: process.env.LOADOUT_E2E_IGNORE
    ? process.env.LOADOUT_E2E_IGNORE.split(",")
    : undefined,
  fullyParallel: true,
  workers,
  // Orry's tests read a real pointer in real time, so a loaded CI runner can stretch one pointer
  // gap and flip a classification. One retry rides that out, and the run is reported as flaky
  // rather than silently green, so the instability stays visible. The shards, not more workers
  // on one machine, are what make the suite faster.
  retries: process.env.CI ? 1 : 0,
  // A committed `test.only` would leave the other tests unrun; under sharding that can even leave
  // a shard with nothing to do and still green.
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [["list"], ["github"], ["html", { open: "never" }]]
    : "list",
  // Loads the gate unlock cookie from the local env when the password gate is enabled; no password is stored in the artifact.
  globalSetup: "./e2e/global-setup.mts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    storageState: "test-results/storage.json",
  },
  webServer: {
    command: prodServer ? "bun run build && bun run start" : "bun run dev",
    url: baseURL,
    env: { PORT: port, NEXT_PUBLIC_LOADOUT_SITE_URL: "https://loadout.dino.icu" },
    reuseExistingServer: reuseLocalServer,
    // A production build can take longer than the dev server's cold start; give it room before the suite is declared stuck.
    timeout: prodServer ? 300_000 : 120_000,
  },
});
