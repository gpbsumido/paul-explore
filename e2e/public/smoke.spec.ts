import { test, expect } from "@playwright/test";
import { checkA11y } from "../helpers/axe";

test("root page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Paul Sumido/);
});

test("root page has no axe violations", async ({ page }) => {
  await page.goto("/");
  // Wait for the hero to finish rendering before scanning — the WebGL shader
  // gradient mounts asynchronously.
  await page.waitForLoadState("networkidle");
  await checkA11y(page, "/ (landing)");
});
