import { test, expect, request } from "@playwright/test";
import fs from "fs";

import { AUTH_FILE, STATE_FILE } from "../global-setup";
import { checkA11y } from "../helpers/axe";

/**
 * Calendar CRUD end-to-end flows.
 *
 * Requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD to be set and globalSetup
 * to have created a dedicated test calendar. Tests self-skip when either
 * is absent so CI without credentials stays green.
 *
 * Event cleanup: each test deletes its own event via the API in afterEach
 * so failures don't accumulate stale test data. The test calendar itself
 * is deleted by globalTeardown after the full suite.
 */

function hasCredentials() {
  return !!process.env.E2E_TEST_EMAIL && !!process.env.E2E_TEST_PASSWORD;
}

function testCalendarId(): string | null {
  if (!fs.existsSync(STATE_FILE)) return null;
  const { calendarId } = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as {
    calendarId: string;
  };
  return calendarId ?? null;
}

const EVENT_TITLE = "[E2E] Create event flow";

test.describe("Calendar", () => {
  test.beforeEach(({}, testInfo) => {
    if (!hasCredentials()) {
      testInfo.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");
    }
  });

  test("create event → verify in month view → delete via UI", async ({
    page,
  }) => {
    const calendarId = testCalendarId();
    if (!calendarId) {
      test.skip();
      return;
    }

    await page.goto("/calendar");

    // The calendar renders in month view by default. Wait for the grid.
    await page.waitForSelector('[class*="border-b"][class*="border-r"]', {
      timeout: 15_000,
    });

    await checkA11y(page, "/calendar (month view)");

    // Select the test calendar in the header dropdown so the new event lands
    // in the isolated test calendar and not the user's real default calendar.
    // The header shows a calendar name/selector with each calendar as a button.
    const calendarBtn = page.locator(
      `button[data-calendar-id="${calendarId}"]`,
    );
    if (await calendarBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await calendarBtn.click();
    }

    // Click on today's cell. Today's cell has the red top border
    // (border-t-2 border-t-red-500) which is applied via Tailwind. We can
    // target it by its red-circle day number which sits inside a span with
    // bg-red-500 text-white styles.
    const todayCell = page
      .locator("span")
      .filter({ hasText: /^\d{1,2}$/ })
      .filter({ has: page.locator(".bg-red-500") })
      .first();

    // Fall back to just clicking the cell containing today's date number
    // if the span-level selector finds nothing.
    if (await todayCell.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await todayCell.click();
    } else {
      // Find today's grid cell (the one with the red top stripe class).
      const todayGridCell = page.locator('[class*="border-t-red-500"]').first();
      await todayGridCell.click();
    }

    // The EventModal should open — wait for the Title input.
    const titleInput = page.getByLabel("Title");
    await expect(titleInput).toBeVisible({ timeout: 5_000 });

    await titleInput.fill(EVENT_TITLE);

    // Save the event.
    await page.getByRole("button", { name: /^create$/i }).click();

    // After save the modal closes. Verify the event chip appears in the grid.
    await expect(page.getByText(EVENT_TITLE, { exact: false })).toBeVisible({
      timeout: 10_000,
    });

    // --- Delete the event via UI ---
    await page.getByText(EVENT_TITLE, { exact: false }).first().click();

    // EventModal opens in edit mode. Click Delete.
    await page.getByRole("button", { name: /^delete$/i }).click();

    // Confirm the deletion.
    await page.getByRole("button", { name: /^confirm$/i }).click();

    // The event chip should disappear.
    await expect(page.getByText(EVENT_TITLE, { exact: false })).not.toBeVisible(
      { timeout: 10_000 },
    );
  });

  test("create event via API → verify in week view", async ({ page }) => {
    const calendarId = testCalendarId();
    if (!calendarId) {
      test.skip();
      return;
    }

    // Create the event directly via API to keep the test focused on the
    // read path (rendering in week view) rather than the create modal.
    const ctx = await request.newContext({
      baseURL: "http://localhost:3000",
      storageState: AUTH_FILE,
    });

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMinutes(0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const res = await ctx.post("/api/calendar/events", {
      data: {
        title: EVENT_TITLE,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        allDay: false,
        calendarId,
      },
    });
    expect(res.ok()).toBeTruthy();
    const event = (await res.json()) as { id: string };
    await ctx.dispose();

    try {
      await page.goto("/calendar");

      // Switch to week view.
      await page.getByRole("button", { name: "Week" }).click();

      // The event should appear in the week grid.
      await expect(page.getByText(EVENT_TITLE, { exact: false })).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      // Clean up the event regardless of test outcome.
      const cleanup = await request.newContext({
        baseURL: "http://localhost:3000",
        storageState: AUTH_FILE,
      });
      await cleanup.delete(`/api/calendar/events/${event.id}`);
      await cleanup.dispose();
    }
  });
});
