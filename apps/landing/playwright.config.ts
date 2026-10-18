import { defineConfig } from "@playwright/test";

const port = process.env.LOADOUT_TEST_PORT ?? "3001";
const baseURL = process.env.LOADOUT_TEST_BASE_URL ?? `http://localhost:${port}`;

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
  workers: 2,
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
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI ? "bun run build && bun run start" : "bun run dev",
    url: baseURL,
    env: { PORT: port },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
