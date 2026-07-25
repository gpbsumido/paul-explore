import { chromium, type BrowserContext, type FullConfig, type Page } from "@playwright/test";
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
    await loginAndSetup(page, context);
  } catch (err) {
    // Capture a screenshot before re-throwing so CI artifacts show exactly
    // what Auth0 rendered (CAPTCHA, changed DOM, error page, etc.).
    const screenshotDir = path.dirname(AUTH_FILE);
    await page
      .screenshot({
        path: path.join(screenshotDir, "auth-failure.png"),
        fullPage: true,
      })
      .catch(() => {});

    throw err;
  } finally {
    await browser.close();
  }
}

/** Logs in via Auth0 (with a retry) and creates the test calendar. */
async function loginAndSetup(page: Page, context: BrowserContext) {
  await performLogin(page);

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
    const body = (await res.json()) as { calendar: { id: string } };
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ calendarId: body.calendar.id }),
    );
    console.log(`[E2E] Created test calendar ${body.calendar.id}`);
  } else {
    console.warn(
      `[E2E] Could not create test calendar: ${res.status()} ${await res.text()}`,
    );
  }
}

/**
 * Runs the Auth0 login, retrying once on a transient failure. The login ->
 * callback -> app redirect is the flakiest step in CI (Auth0 latency, an
 * occasional consent screen), so a single clean retry from the login page
 * removes most of the flakiness.
 */
async function performLogin(page: Page) {
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await attemptLogin(page);
      return;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw err;
      console.warn(
        `[E2E] login attempt ${attempt} failed, retrying: ${(err as Error).message}`,
      );
    }
  }
}

/** A single Auth0 Universal Login attempt: email, password, then wait for the
 *  redirect back to the app. */
async function attemptLogin(page: Page) {
  // Navigate to Auth0 login. The middleware redirects /auth/login to
  // Auth0 Universal Login which hosts the email + password form.
  await page.goto(`${BASE_URL}/auth/login`);

  // Auth0 Universal Login is a small HTML shell that renders the login form
  // via client-side JS. networkidle can fire before the form hydrates, so
  // wait explicitly for any input element to appear in the DOM.
  const emailInput = page
    .locator('input[name="username"], input[name="email"], input[type="email"]')
    .first();
  await emailInput.waitFor({ state: "visible", timeout: 30_000 });
  await emailInput.fill(process.env.E2E_TEST_EMAIL!);

  // Some Auth0 flows show password on the same page; others require clicking
  // "Continue" first. Handle both. Use exact name match to avoid hitting
  // "Continue with Google" social login button.
  const continueBtn = page.getByRole("button", { name: /^continue$/i });
  if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await continueBtn.click();
  }

  await page
    .locator('input[type="password"]')
    .fill(process.env.E2E_TEST_PASSWORD!);

  // Target the submit button for the email/password form, not social login
  // buttons like "Continue with Google". The form submit button typically
  // says just "Continue" or "Log In".
  await page
    .getByRole("button", { name: /^(log in|sign in|continue)$/i })
    .last()
    .click();

  // Some tenants show a consent / authorize screen on the way back; accept it
  // so the redirect to the app can complete instead of stalling there.
  const consentBtn = page.getByRole("button", {
    name: /^(accept|allow|authorize)$/i,
  });
  if (await consentBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await consentBtn.click();
  }

  // Wait until Auth0 redirects back to the app AND the callback finishes
  // processing. The callback URL is on localhost so we can't just check
  // "hostname doesn't contain auth0" — that fires too early on /auth/callback
  // before the session cookie is set. Wait for the final redirect to land on
  // a non-callback page. Generous timeout: this hop is slow in CI.
  await page.waitForURL(
    (url) =>
      !url.hostname.includes("auth0") && !url.pathname.startsWith("/auth/"),
    { timeout: 45_000 },
  );
  await page.waitForLoadState("networkidle");
}
