import { defineConfig } from "@playwright/test";

const port = process.env.LOADOUT_TEST_PORT ?? "3001";
const baseURL = process.env.LOADOUT_TEST_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 2,
  reporter: "list",
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
