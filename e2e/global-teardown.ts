import { request } from "@playwright/test";
import fs from "fs";

import { AUTH_FILE, STATE_FILE } from "./global-setup";

/**
 * Runs once after all E2E tests complete.
 *
 * Deletes the dedicated test calendar that globalSetup created so no
 * test data is left behind in the real user account. Silently skips
 * when no state file is found (credentials were absent).
 */
export default async function globalTeardown() {
  if (!fs.existsSync(STATE_FILE)) return;

  const { calendarId } = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as {
    calendarId: string;
  };

  const ctx = await request.newContext({
    baseURL: "http://localhost:3000",
    storageState: AUTH_FILE,
  });

  try {
    const res = await ctx.delete(`/api/calendar/calendars/${calendarId}`);
    if (res.ok()) {
      console.log(`[E2E] Deleted test calendar ${calendarId}`);
    } else {
      console.warn(
        `[E2E] Could not delete test calendar ${calendarId}: ${res.status()}`,
      );
    }
  } finally {
    await ctx.dispose();
    fs.unlinkSync(STATE_FILE);
  }
}
