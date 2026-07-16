import { test, expect } from "@playwright/test";
import { checkA11y } from "../helpers/axe";

/**
 * Axe accessibility scans for authenticated routes.
 *
 * Requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD. Tests self-skip when
 * credentials are absent so CI without secrets stays green.
 */

function hasCredentials() {
  return !!process.env.E2E_TEST_EMAIL && !!process.env.E2E_TEST_PASSWORD;
}

test.describe("Authenticated route accessibility", () => {
  test.beforeEach(({}, testInfo) => {
    if (!hasCredentials()) {
      testInfo.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");
    }
  });

  test("calendar page has no axe violations", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForSelector('[class*="border-b"][class*="border-r"]', {
      timeout: 15_000,
    });
    await checkA11y(page, "/calendar (authenticated)");
  });

  test("vitals page has no axe violations", async ({ page }) => {
    await page.goto("/vitals");
    await expect(
      page.getByRole("heading", { name: "Core Web Vitals" }),
    ).toBeVisible({ timeout: 15_000 });
    await checkA11y(page, "/vitals");
  });

  test("settings page has no axe violations", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({
      timeout: 15_000,
    });
    await checkA11y(page, "/settings");
  });
});
