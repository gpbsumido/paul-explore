import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "fs";

// Load E2E credentials from .env.e2e when present (gitignored)
if (existsSync(".env.e2e")) {
  for (const line of readFileSync(".env.e2e", "utf-8").split("\n")) {
    const match = line.match(/^(\w+)=(.+)$/);
    // Presence, not truthiness. Checking the value meant an explicit empty
    // override got clobbered by the file, so there was no way to say "run the
    // public project without touching Auth0" short of moving the file aside.
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
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
      use: {
        ...devices["Desktop Chrome"],
        // Start already consented: no cookie banner obscuring lower-page
        // controls, and visitor_id gets minted so operator writes aren't
        // rate-limited onto one shared CI IP. Written by global-setup.
        storageState: "e2e/.auth/public-state.json",
      },
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
  /**
   * CI drives a production build; locally it drives the dev server.
   *
   * Two reasons, and the second is the one that matters.
   *
   * The dev server compiles with Turbopack, which panicked mid-run on a release
   * PR and took the whole job down with `Process from config.webServer was not
   * able to start`. No test failed. Re-running the same commit passed. A
   * pre-release gate that fails for reasons unrelated to the code is worse than
   * no gate, because the next red one gets waved through.
   *
   * More importantly, a dev build is not the artifact that ships. Different
   * compiler, different bundling, no production minification or tree shaking —
   * so anything that only breaks once compiled for production passed this tier
   * happily. Testing what actually deploys is the point of an end-to-end tier.
   *
   * Locally it stays on the dev server, because waiting for a build to check
   * one spec is how a suite stops being run.
   */
  webServer: {
    command: process.env.CI ? "pnpm build && pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    // A build is minutes, not seconds. The old 120s was sized for `next dev`
    // booting, and would time out here for no reason worth debugging.
    timeout: process.env.CI ? 600_000 : 120_000,
  },
});
