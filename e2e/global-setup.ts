import { chromium, type FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

export const AUTH_FILE = "e2e/.auth/user.json";
export const STATE_FILE = "e2e/.auth/test-state.json";

const BASE_URL = "http://localhost:3000";

/**
 * Runs once before all E2E tests.
 *
 * When E2E_TEST_EMAIL + E2E_TEST_PASSWORD are set:
 * - Logs in via Auth0 Universal Login
 * - Saves session cookies to e2e/.auth/user.json
 * - Creates a dedicated test calendar and saves its ID to e2e/.auth/test-state.json
 *
 * When credentials are absent an empty storageState is written so the
 * authenticated Playwright project still has a valid file to reference.
 * Calendar tests guard themselves with test.skip and will be skipped.
 */
export default async function globalSetup(_config: FullConfig) {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD) {
    console.log(
      "[E2E] Auth credentials not set — writing empty storageState. Calendar tests will be skipped.",
    );
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to Auth0 login. The middleware redirects /auth/login to
    // Auth0 Universal Login which hosts the email + password form.
    await page.goto(`${BASE_URL}/auth/login`);

    // Auth0 Universal Login — selectors target the standard input attributes
    // used by the default Auth0 template. If the login page shape changes,
    // update these selectors first.
    await page
      .locator('input[name="username"], input[type="email"]')
      .fill(process.env.E2E_TEST_EMAIL);

    // Some Auth0 flows show password on the same page; others require clicking
    // "Continue" first. Handle both.
    const continueBtn = page.getByRole("button", {
      name: /continue/i,
      exact: false,
    });
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click();
    }

    await page
      .locator('input[type="password"]')
      .fill(process.env.E2E_TEST_PASSWORD);
    await page
      .getByRole("button", { name: /log in|sign in|continue/i, exact: false })
      .last()
      .click();

    // Wait until Auth0 redirects back to the app (URL hostname leaves auth0).
    await page.waitForURL((url) => !url.hostname.includes("auth0"), {
      timeout: 20_000,
    });

    await context.storageState({ path: AUTH_FILE });

    // Create a dedicated test calendar so E2E events are isolated and cleaned
    // up by globalTeardown without touching any real user data.
    const res = await context.request.post(
      `${BASE_URL}/api/calendar/calendars`,
      {
        data: {
          name: "[E2E] Test Calendar",
          color: "#3B82F6",
          syncMode: "none",
        },
      },
    );

    if (res.ok()) {
      const calendar = (await res.json()) as { id: string };
      fs.writeFileSync(STATE_FILE, JSON.stringify({ calendarId: calendar.id }));
      console.log(`[E2E] Created test calendar ${calendar.id}`);
    } else {
      console.warn(
        `[E2E] Could not create test calendar: ${res.status()} ${await res.text()}`,
      );
    }
  } finally {
    await browser.close();
  }
}
