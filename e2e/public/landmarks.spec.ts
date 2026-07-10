import { test, expect } from "@playwright/test";

test.describe("Skip link and landmarks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("skip-to-content link exists and targets #main-content", async ({
    page,
  }) => {
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveText("Skip to content");
  });

  test("skip link is visually hidden until focused", async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]');

    const boxBefore = await skipLink.boundingBox();
    expect(
      boxBefore === null || boxBefore.width <= 1 || boxBefore.height <= 1,
    ).toBe(true);

    await skipLink.focus();

    const boxAfter = await skipLink.boundingBox();
    expect(boxAfter).not.toBeNull();
    expect(boxAfter!.width).toBeGreaterThan(1);
    expect(boxAfter!.height).toBeGreaterThan(1);
  });

  test("#main-content target exists", async ({ page }) => {
    const target = page.locator("#main-content");
    await expect(target).toBeAttached();
  });

  test("page has a navigation landmark", async ({ page }) => {
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
  });

  test("page has a main landmark", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.first()).toBeVisible();
  });
});
