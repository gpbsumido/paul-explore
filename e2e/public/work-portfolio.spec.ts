import { test, expect } from "@playwright/test";

/**
 * Public smoke coverage for the work-portfolio page: the tickers, stage
 * navigation (arrows + keyboard), deep links, and the explainer window.
 */
/** Hard-stop every CSS animation so the marquee can't move mid-click. */
async function freezeAnimations(page: import("@playwright/test").Page) {
  await page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; }",
  });
}

test.describe("work portfolio", () => {
  // The tickers auto-scroll via requestAnimationFrame, so under normal motion a
  // chip never settles long enough for Playwright to click it. Under reduced
  // motion the app renders a static, scrollable ticker, so emulate it before
  // each navigation. (Set here, not in the config's use block, which did not
  // apply to matchMedia in this setup.)
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("opens on the intro and both tickers are present", async ({ page }) => {
    await page.goto("/work-portfolio");
    await expect(page.getByRole("region", { name: "Projects ticker" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Features ticker" })).toBeVisible();
    await expect(page.getByText(/feature demos/)).toBeVisible();
  });

  test("clicking a feature chip loads its demo on the stage", async ({ page }) => {
    await page.goto("/work-portfolio");
    await freezeAnimations(page);
    const ticker = page.getByRole("region", { name: "Features ticker" });
    await ticker.getByRole("button", { name: "Feature: Chart Library" }).first().click();
    await expect(page.getByRole("heading", { name: "Chart Library" })).toBeVisible();
  });

  test("a project chip jumps to that project's first feature", async ({ page }) => {
    await page.goto("/work-portfolio");
    await freezeAnimations(page);
    const ticker = page.getByRole("region", { name: "Projects ticker" });
    await ticker.getByRole("button", { name: "Project: Content Engine" }).first().click();
    await expect(page.getByRole("heading", { name: "Campaign Manager" })).toBeVisible();
  });

  test("arrow keys move through features", async ({ page }) => {
    await page.goto("/work-portfolio");
    await page.getByRole("button", { name: "Next feature" }).click();
    const first = page.getByRole("main").getByRole("heading");
    await expect(first).toBeVisible();
    await page.keyboard.press("ArrowRight");
    // still showing some feature heading, and the url now carries a slug
    await expect(page).toHaveURL(/feature=/);
  });

  test("deep link selects a feature on load", async ({ page }) => {
    await page.goto("/work-portfolio?feature=wallet-lookup");
    await expect(page.getByRole("heading", { name: "Wallet Lookup" })).toBeVisible();
  });

  test("the explainer window opens and closes", async ({ page }) => {
    await page.goto("/work-portfolio?feature=chart-library");
    await page
      .getByRole("main")
      .getByRole("button", { name: "About Chart Library" })
      .click();
    const dialog = page.getByRole("dialog", { name: "About Chart Library" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
