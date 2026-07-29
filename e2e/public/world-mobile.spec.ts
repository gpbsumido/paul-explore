import { test, expect, type Page } from "@playwright/test";

/**
 * The world's HUD on a phone. Everything here is geometry, so it can only be
 * checked in a real browser: the bug this guards against was the exhibit
 * placard, the site menu and the joystick all landing in the same corner.
 *
 * The contract is three bands. The top 64px holds the site menu and the HUD
 * toggle, the bottom 144px holds the touch controls, and the middle is left
 * alone for the placard and the other bottom-centre cards.
 */

const VIEWPORT = { width: 390, height: 844 };
const TOP_BAND = 64;
const CONTROLS_BAND = 144;

test.use({ viewport: VIEWPORT, hasTouch: true, isMobile: true });

const boxOf = async (page: Page, selector: string) => {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${selector} should be on screen`).not.toBeNull();
  return box!;
};

const openWorld = async (page: Page) => {
  await page.goto("/world");
  await expect(page.getByRole("button", { name: "Site menu" })).toBeVisible();
};

test.describe("world HUD on a phone", () => {
  test("fills the viewport — there is no header to make room for", async ({ page }) => {
    await openWorld(page);

    const main = await boxOf(page, "main");
    expect(main.height).toBe(VIEWPORT.height);
  });

  test("keeps the site menu and the HUD toggle in the top band", async ({ page }) => {
    await openWorld(page);

    const menu = await boxOf(page, "button[aria-label='Site menu']");
    const toggle = await boxOf(page, "button[aria-controls='world-hud-panel']");

    expect(menu.y + menu.height).toBeLessThanOrEqual(TOP_BAND);
    expect(toggle.y + toggle.height).toBeLessThanOrEqual(TOP_BAND);
    expect(menu.x + menu.width).toBeLessThanOrEqual(toggle.x);
  });

  test("keeps the touch controls in the bottom band, clear of the card space", async ({ page }) => {
    await openWorld(page);

    for (const selector of [
      "[aria-label='Movement joystick']",
      "button[aria-label='Interact']",
      "button[aria-label='Jump']",
    ]) {
      const box = await boxOf(page, selector);
      expect(box.y, `${selector} should stay in the bottom band`).toBeGreaterThanOrEqual(
        VIEWPORT.height - CONTROLS_BAND,
      );
    }
  });

  test("puts the joystick and the buttons on opposite thumbs", async ({ page }) => {
    await openWorld(page);

    const joystick = await boxOf(page, "[aria-label='Movement joystick']");
    const interact = await boxOf(page, "button[aria-label='Interact']");

    expect(joystick.x).toBeLessThan(VIEWPORT.width / 2);
    expect(interact.x).toBeGreaterThan(VIEWPORT.width / 2);
  });

  test("hides the rail behind the toggle and shows it on tap", async ({ page }) => {
    await openWorld(page);

    const fidelity = page.getByRole("slider", { name: /fidelity/i });
    await expect(fidelity).toBeHidden();

    await page.getByRole("button", { name: "World settings" }).tap();
    await expect(fidelity).toBeVisible();

    await page.getByRole("button", { name: "Close world settings" }).tap();
    await expect(fidelity).toBeHidden();
  });

  test("leaves the bottom-centre card space free while the rail is closed", async ({ page }) => {
    await openWorld(page);

    const cardBand = {
      top: TOP_BAND,
      bottom: VIEWPORT.height - CONTROLS_BAND,
    };
    for (const selector of [
      "button[aria-label='Site menu']",
      "button[aria-controls='world-hud-panel']",
      "[aria-label='Movement joystick']",
      "button[aria-label='Jump']",
    ]) {
      const box = await boxOf(page, selector);
      const overlaps = box.y < cardBand.bottom && box.y + box.height > cardBand.top;
      expect(overlaps, `${selector} should not sit in the card band`).toBe(false);
    }
  });
});
