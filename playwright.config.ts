import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "fs";

// Load E2E credentials from .env.e2e when present (gitignored)
if (existsSync(".env.e2e")) {
  for (const line of readFileSync(".env.e2e", "utf-8").split("\n")) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

/**
 * E2E test configuration.
 *
 * Two projects:
 * - public: no auth, covers smoke + TCG browsing + auth redirect flows
 * - authenticated: uses saved session state, covers calendar CRUD
 *
 * Authenticated tests require E2E_TEST_EMAIL + E2E_TEST_PASSWORD env vars.
 * Without them, globalSetup writes an empty storageState and the calendar
 * tests self-skip via test.skip inside the spec.
 *
 * Run locally:
 *   npm run test:e2e
 *
 * With auth (required for calendar tests):
 *   E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /public\/.+\.spec\.ts/,
    },
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      testMatch: /authenticated\/.+\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
