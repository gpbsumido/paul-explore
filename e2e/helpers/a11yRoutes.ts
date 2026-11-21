/**
 * The public routes the axe scans visit, kept out of the spec so a vitest
 * guard (e2e/a11yRoutes.test.ts) can read it. That guard fails when a public
 * page exists that is neither listed here nor excused in the exclusions below,
 * so a new page cannot quietly go unscanned.
 *
 * Fetch-on-mount pages are scanned as whatever they show once their main
 * landmark is up, so a slow backend scans the loading state rather than
 * failing the route.
 */
export const A11Y_ROUTES = [
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
  "/mind-reader",
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
  "/learn/interview-prep",
  "/learn/interview-prep/drill",
  "/learn/interview-prep/plan",
  "/learn/interview-prep/toolkit",
  "/learn/interview-prep/sliding-window",
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

/** A public page deliberately left out of the scan, and why that is safe. */
export type A11yExclusion = { route: string; reason: string };

/** Single pages excused from the scan. */
export const A11Y_EXCLUDED_ROUTES: readonly A11yExclusion[] = [
  {
    route: "/discover",
    reason:
      "Scanned by smoke.spec.ts ('discover page has no axe violations') on every PR, in the default theme.",
  },
  {
    route: "/tcg/pokemon",
    reason:
      "Scanned by tcg.spec.ts ('browse page has no axe violations') against a stubbed card list, so it never waits on TCGdex.",
  },
];

/** Whole sections excused from the scan, matched as a path prefix. */
export const A11Y_EXCLUDED_PREFIXES: readonly { prefix: string; reason: string }[] = [
  {
    prefix: "/dev/",
    reason:
      "Skeleton previews that 404 in production, and CI scans a production build.",
  },
  {
    prefix: "/thoughts/",
    reason:
      "Every write-up shares ThoughtLayout, so /thoughts and /thoughts/zeroproof (a long page with updates, code and screenshots) stand in for the rest. A write-up with its own bespoke markup is not covered by this.",
  },
];
