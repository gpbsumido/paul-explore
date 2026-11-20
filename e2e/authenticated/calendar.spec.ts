import { test, expect } from "@playwright/test";
import fs from "fs";

import { STATE_FILE } from "../global-setup";
import { checkA11y } from "../helpers/axe";

/**
 * Calendar CRUD end-to-end flows.
 *
 * Requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD to be set and globalSetup
 * to have created a dedicated test calendar. Tests self-skip without
 * credentials so CI without them stays green. With credentials, a missing
 * calendar is a failure: global setup throws if it can't make one.
 *
 * Event cleanup: every event a test creates is recorded, and afterEach
 * deletes whatever the test didn't get to, so a failure halfway through
 * doesn't leave stale events behind. The test calendar itself is deleted by
 * globalTeardown after the full suite.
 */

function hasCredentials() {
  return !!process.env.E2E_TEST_EMAIL && !!process.env.E2E_TEST_PASSWORD;
}

function testCalendarId(): string {
  const { calendarId } = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as {
    calendarId?: string;
  };
  if (!calendarId) throw new Error(`No test calendar id in ${STATE_FILE}`);
  return calendarId;
}

function uniqueTitle() {
  return `[E2E] Event ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

test.describe("Calendar", () => {
  // Ids of events created in the current test that haven't been deleted yet.
  let createdEventIds: string[] = [];

  test.beforeEach(({}, testInfo) => {
    createdEventIds = [];
    if (!hasCredentials()) {
      testInfo.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");
    }
  });

  test.afterEach(async ({ page }) => {
    for (const eventId of createdEventIds) {
      const status = await page.evaluate(async (id) => {
        const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
        return res.status;
      }, eventId);
      // 404 means the test already deleted it, which is the happy path.
      expect([200, 204, 404]).toContain(status);
    }
  });

  test("create event → verify in month view → delete via UI", async ({
    page,
  }) => {
    const calendarId = testCalendarId();

    const title = uniqueTitle();

    await page.goto("/calendar");

    // The calendar renders in month view by default. Wait for the grid.
    await page.waitForSelector('[class*="border-b"][class*="border-r"]', {
      timeout: 15_000,
    });

    await checkA11y(page, "/calendar (month view)");

    // Click on today's cell. Today's cell has the verdigris top border
    // (border-t-2 border-t-primary-500) which is applied via Tailwind. We can
    // target it by its filled day number, which sits inside a span with
    // bg-primary-600 text-white styles.
    const todayCell = page
      .locator("span")
      .filter({ hasText: /^\d{1,2}$/ })
      .filter({ has: page.locator(".bg-primary-600") })
      .first();

    // Fall back to just clicking the cell containing today's date number
    // if the span-level selector finds nothing.
    if (await todayCell.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await todayCell.click();
    } else {
      // Find today's grid cell (the one with the verdigris top stripe class).
      const todayGridCell = page.locator('[class*="border-t-primary-500"]').first();
      await todayGridCell.click();
    }

    // The EventModal should open — wait for the Title input.
    const titleInput = page.getByLabel("Title");
    await expect(titleInput).toBeVisible({ timeout: 5_000 });

    await titleInput.fill(title);

    // Put the event in the isolated test calendar. This used to click
    // `button[data-calendar-id]`, which nothing renders, behind an
    // isVisible() guard that quietly skipped the click, so every run wrote to
    // the real default calendar. Picking it here fails loudly if it can't.
    await page.getByRole("combobox", { name: "Calendar" }).selectOption(calendarId);

    // Listen for the POST before clicking so we can confirm server-side
    // creation. The optimistic update renders the chip immediately, but
    // staleTime:0 can cause background refetches to briefly overwrite the
    // optimistic cache. Testing the optimistic path is better done at the
    // component level; here we verify the full user-visible round-trip.
    const postResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/calendar/events") &&
        !res.url().includes("/api/calendar/events/") &&
        res.request().method() === "POST",
      { timeout: 10_000 },
    );

    // Save the event.
    await page.getByRole("button", { name: /^create$/i }).click();

    // Wait for the POST to complete and verify the server accepted it.
    const postRes = await postResponse;
    expect(postRes.ok()).toBeTruthy();
    const created = (await postRes.json()) as {
      event: { id: string; calendarId?: string };
    };
    createdEventIds.push(created.event.id);
    expect(created.event.calendarId).toBe(calendarId);

    // Reload so the cache holds real server-assigned IDs (not optimistic
    // temp UUIDs). This also proves the event actually persisted on the
    // backend rather than only living in the client cache.
    await page.reload();
    await page.waitForSelector('[class*="border-b"][class*="border-r"]', {
      timeout: 15_000,
    });
    await expect(
      page.getByText(title, { exact: false }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // --- Delete the event via UI ---
    await page.getByText(title, { exact: false }).first().click();

    // Wait for the EventModal to fully render in edit mode.
    await expect(page.getByLabel("Title")).toHaveValue(title, {
      timeout: 5_000,
    });

    // Listen for the DELETE response to verify it completes.
    const deleteResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/calendar/events/") &&
        res.request().method() === "DELETE",
      { timeout: 15_000 },
    );

    // Click Delete — no confirm step in EventModal.
    await page.getByRole("button", { name: /^delete$/i }).click();

    // Wait for the DELETE to complete and verify it succeeded.
    const res = await deleteResponse;
    expect(res.ok()).toBeTruthy();

    // The event chip should disappear from the grid.
    await expect(
      page.locator("button", { hasText: title }),
    ).toHaveCount(0, { timeout: 10_000 });
  });

  test("create and delete event via API", async ({ page }) => {
    const calendarId = testCalendarId();

    const title = uniqueTitle();

    // Navigate first so page.evaluate has an origin to send fetch from.
    await page.goto("/calendar");
    await page.waitForSelector('[class*="border-b"][class*="border-r"]', {
      timeout: 15_000,
    });

    // Create the event via fetch inside the browser context so the request
    // goes through the proxy middleware with the real session cookies.
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMinutes(0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const event = await page.evaluate(
      async ([title, start, end, calId]) => {
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            startDate: start,
            endDate: end,
            allDay: false,
            color: "#3B82F6",
            calendarId: calId,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`POST /api/calendar/events → ${res.status}: ${body}`);
        }
        const body = (await res.json()) as { event: { id: string } };
        return body.event;
      },
      [title, startDate.toISOString(), endDate.toISOString(), calendarId] as const,
    );
    createdEventIds.push(event.id);

    // Verify the event is queryable via GET.
    const found = await page.evaluate(
      async ([start, end, title]) => {
        const res = await fetch(
          `/api/calendar/events?start=${start}&end=${end}`,
        );
        if (!res.ok) return false;
        const { events } = (await res.json()) as {
          events: Array<{ title: string }>;
        };
        return events.some((e) => e.title === title);
      },
      [startDate.toISOString(), endDate.toISOString(), title] as const,
    );
    expect(found).toBeTruthy();

    // Clean up via DELETE.
    await page.evaluate(async (eventId) => {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`DELETE → ${res.status}`);
    }, event.id);
  });
});
