import { chromium } from "@playwright/test";
import fs from "fs";

import { AUTH_FILE, STATE_FILE } from "./global-setup";

/**
 * Runs once after all E2E tests complete.
 *
 * Deletes the dedicated test calendar that globalSetup created so no
 * test data is left behind in the real user account. Silently skips
 * when no state file is found (credentials were absent).
 *
 * Uses a real browser page so the DELETE goes through Next.js middleware
 * (which resolves the Auth0 session). Playwright's request API bypasses
 * middleware, causing missing_session errors.
 */
export default async function globalTeardown() {
  if (!fs.existsSync(STATE_FILE)) return;

  const { calendarId } = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as {
    calendarId: string;
  };

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: "http://localhost:3000",
    storageState: AUTH_FILE,
  });
  const page = await context.newPage();

  try {
    // Navigate to the app first so the browser has the right origin
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    const result = await page.evaluate(async (id: string) => {
      const res = await fetch(`/api/calendar/calendars/${id}`, {
        method: "DELETE",
      });
      return { ok: res.ok, status: res.status };
    }, calendarId);

    if (result.ok) {
      console.log(`[E2E] Deleted test calendar ${calendarId}`);
    } else {
      console.warn(
        `[E2E] Could not delete test calendar ${calendarId}: ${result.status}`,
      );
    }
  } finally {
    await browser.close();
    fs.unlinkSync(STATE_FILE);
  }
}
