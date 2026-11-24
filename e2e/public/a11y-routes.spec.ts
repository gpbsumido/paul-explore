import { test } from "@playwright/test";
import { checkA11y } from "../helpers/axe";
import { disableTours } from "../helpers/tours";
import { waitForPageToSettle } from "../helpers/settle";
import { A11Y_ROUTES } from "../helpers/a11yRoutes";

/**
 * Accessibility coverage for the public routes, scanned at WCAG 2.1 AA + axe
 * best-practice via checkA11y. Structural fixes (landmarks, control names,
 * focusable regions) plus the colour-contrast pass mean every public route
 * in the list is clean. The list lives in helpers/a11yRoutes.ts.
 */

/**
 * Both themes, because they are two different palettes rather than one palette
 * with the lightness flipped. The feature accents in particular are a
 * light/dark pair per token, so a dark-only scan measures exactly half of the
 * colour in the app -- and the light half is the half that sits on near-white,
 * where contrast is hardest to hold.
 */
const THEMES = ["dark", "light"] as const;

// Tagged so the per-PR smoke job can pick these up by grep. They ride that
// job's existing build rather than starting a second server, which is the only
// reason running them on every PR is affordable.
test.describe("Public route accessibility @a11y", () => {
  for (const theme of THEMES) {
    test.describe(theme, () => {
      // Pin the theme before anything renders. Every colour on the site comes
      // from a custom property, and which set is live depends on a preference
      // read at runtime -- so an unpinned scan races the theme system and
      // intermittently measures muted text against the other theme's surface.
      // That produced contrast failures on whichever route happened to lose the
      // race, which is the worst kind of red: real-looking, unreproducible, and
      // not a bug. Same mechanism the PR-screenshot workflow already uses.
      test.beforeEach(async ({ page }) => {
        await page.addInitScript((preference) => {
          window.localStorage.setItem("theme-preference", preference);
        }, theme);
        // First-run tours would auto-open a modal over the page these scans are
        // about; the tours have their own a11y coverage in the unit suite.
        await disableTours(page);
      });

      for (const route of A11Y_ROUTES) {
        test(`${route} has no axe violations`, async ({ page }) => {
          await page.goto(route);
          await waitForPageToSettle(page);
          await checkA11y(page, `${route} (${theme})`);
        });
      }
    });
  }
});
