import { test } from "@playwright/test";
import { checkA11y } from "../helpers/axe";

/**
 * Accessibility coverage for the public routes, scanned at WCAG 2.1 AA + axe
 * best-practice via checkA11y. Structural fixes (landmarks, control names,
 * focusable regions) plus the colour-contrast pass mean every public route
 * here is clean.
 */
const ROUTES = [
  "/learn",
  "/learn/binary-search",
  "/work-portfolio",
  "/tcg/pocket",
  "/tcg/pokemon/sets",
  "/lab/particles",
  "/lab/motion",
  "/graphql",
  "/operator",
  "/fantasy/nba/court-vision",
  "/fantasy/nba/player/stats",
  "/fantasy/nba/matchups",
  "/fantasy/nba/league-history",
  "/fantasy/nba/playoffs",
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
