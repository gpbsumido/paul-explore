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
      // Deliberately not networkidle. These pages poll and fetch from a third
      // party, so "no requests for 500ms" is a promise about someone else's
      // infrastructure, not about this page. When stats.nba.com stopped
      // answering, two of these routes went red with nothing wrong in the diff
      // -- and a check that fails for reasons unrelated to the change gets
      // ignored, which is worse than not having it. The page's own main
      // landmark is what an accessibility scan actually needs.
      await page.waitForLoadState("load");
      await page.locator("main").first().waitFor({ state: "visible" });
      // Fonts change computed colours, and axe's contrast rule reads them, so
      // scanning before they settle reports violations that do not exist.
      await page.evaluate(() => document.fonts.ready);
      await checkA11y(page, route);
    });
  }
});
