import { test } from "@playwright/test";
import { checkA11y } from "../helpers/axe";

/**
 * Accessibility coverage for the public routes whose only issues were
 * structural (missing landmark, unnamed control, non-focusable region) and are
 * now fixed. Each is scanned at WCAG 2.1 AA + axe best-practice via checkA11y.
 *
 * Routes that also have colour-contrast work pending (graphql, operator,
 * lab/motion, some fantasy pages) are intentionally not here yet — they land
 * once the contrast pass ships.
 */
const ROUTES = [
  "/learn",
  "/learn/binary-search",
  "/work-portfolio",
  "/tcg/pocket",
  "/tcg/pokemon/sets",
  "/lab/particles",
  "/fantasy/nba/court-vision",
  "/fantasy/nba/player/stats",
];

test.describe("Public route accessibility", () => {
  for (const route of ROUTES) {
    test(`${route} has no axe violations`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await checkA11y(page, route);
    });
  }
});
