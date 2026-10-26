import { test } from "@playwright/test";
import { checkA11y } from "../helpers/axe";
import { disableTours } from "../helpers/tours";
import { waitForPageToSettle } from "../helpers/settle";

/**
 * Accessibility coverage for the public routes, scanned at WCAG 2.1 AA + axe
 * best-practice via checkA11y. Structural fixes (landmarks, control names,
 * focusable regions) plus the colour-contrast pass mean every public route
 * here is clean.
 */
const ROUTES = [
  // The landing itself. It was only ever covered by the smoke axe scan, in
  // whichever theme happened to be default, and it is now the page carrying the
  // most new colour on the site.
  "/",
  "/learn",
  // Public volunteer entry point. The organizer surfaces sit behind a session
  // and are covered by the authenticated suite instead.
  "/check-in",
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
  "/fantasy/nfl/matchups",
  "/fantasy/nfl/trade",
  // Every public feature page below was missing from the scan. Most of them
  // fetch on mount, and the scan reads whatever the page shows by the time its
  // main landmark is up, so a slow backend scans the loading state rather
  // than failing the route.
  "/zeroproof",
  "/fantasy/nba",
  "/fantasy/nba/cards",
  "/fantasy/nba/cards/collection",
  "/fantasy/nfl",
  "/budget",
  "/craft",
  "/design-system",
  "/flags",
  "/gallery-wall",
  "/lab",
  "/pokemon",
  "/research",
  "/resume",
  "/surprise",
  "/vitals",
  "/world",
  "/updates",
  "/updates/tickets",
  "/privacy",
  "/operator/finance",
  "/operator/loss",
  "/operator/planner",
  "/operator/products",
  "/operator/search",
  "/learn/ai-agent-patterns",
  "/learn/async-patterns",
  "/learn/debounce-throttle",
  "/learn/dynamic-programming",
  "/learn/event-delegation",
  "/learn/from-scratch",
  "/learn/hash-maps",
  "/learn/memoization",
  "/learn/recursion-backtracking",
  "/learn/sliding-window",
  "/learn/stacks-queues",
  "/learn/trees-graphs",
  "/learn/two-pointers",
  // Every write-up shares ThoughtLayout, so the index and one long page with
  // updates, code and screenshots stand in for the rest.
  "/thoughts",
  "/thoughts/zeroproof",
];

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

      for (const route of ROUTES) {
        test(`${route} has no axe violations`, async ({ page }) => {
          await page.goto(route);
          await waitForPageToSettle(page);
          await checkA11y(page, `${route} (${theme})`);
        });
      }
    });
  }
});
