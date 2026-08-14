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

/**
 * Both themes, because they are two different palettes rather than one palette
 * with the lightness flipped. The feature accents in particular are a
 * light/dark pair per token, so a dark-only scan measures exactly half of the
 * colour in the app -- and the light half is the half that sits on near-white,
 * where contrast is hardest to hold.
 */
const THEMES = ["dark", "light"] as const;

test.describe("Public route accessibility", () => {
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
      });

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
      // Same reasoning, one layer down. Every colour on the page comes from a
      // custom property, and the theme that defines them is applied by script.
      // Scanning first reports every muted and foreground element as failing
      // contrast at once -- which is the tell, because if the foreground token
      // really failed the app would be unreadable rather than slightly off.
      await page.waitForFunction(() => {
        const root = document.documentElement;
        if (!root.dataset.theme) return false;
        const fg = getComputedStyle(root)
          .getPropertyValue("--color-foreground")
          .trim();
        return fg.length > 0;
      });
      // And once more for anything still fading in. A contrast rule reads the
      // colour as it is at that instant, so an element mid-transition measures
      // against a background it is only passing through. Waiting for the
      // page's own animations to finish is still a fact about this page, which
      // is the property that matters -- unlike networkidle, nothing here
      // depends on a third party answering.
      await page
        .waitForFunction(
          () =>
            document
              .getAnimations()
              .every((a) => a.playState !== "running"),
          undefined,
          { timeout: 5_000 },
        )
        .catch(() => {
          // Some pages animate forever by design (the particle lab). Those are
          // decorative, so carry on rather than fail a scan on a loop that is
          // never going to stop.
        });
          await checkA11y(page, `${route} (${theme})`);
        });
      }
    });
  }
});
