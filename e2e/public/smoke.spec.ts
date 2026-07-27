import { test, expect } from "@playwright/test";
import { checkA11y } from "../helpers/axe";

// Tagged @smoke so they run as the thin subset on every push and PR, while the
// full public suite runs nightly. See .github/workflows/ci.yml and the
// tiered-testing-strategy write-up under /thoughts/test-tiers.
test("root page loads", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Paul Sumido/);
});

test("root page has no axe violations", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/");
  // Wait for the hero to finish rendering before scanning — the WebGL shader
  // gradient mounts asynchronously.
  await page.waitForLoadState("networkidle");
  await checkA11y(page, "/ (landing)");
});
