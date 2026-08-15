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

test("discover page loads", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/discover");
  await expect(page).toHaveTitle(/Discover/);
});

test(
  "discover page has no axe violations",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await checkA11y(page, "/discover");
  },
);

// The version switcher used to live at /?version=, so the redirect is the only
// thing keeping those links alive. Checked through the proxy for real, since a
// unit test can only prove the rule, not that it is wired up.
test(
  "an old version bookmark still opens that version",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto("/?version=v2");
    await expect(page).toHaveURL(/\/discover\?version=v2$/);
    await expect(page.getByText(/Landing-page history: v2/)).toBeVisible();
  },
);
