import { isSessionProtectedPath } from "./protectedPaths";

/**
 * The routes a crawler should be told about.
 *
 * Kept as a literal rather than read off the filesystem at request time: the
 * sitemap runs in the Next runtime, where walking `src/app` is not something
 * to rely on. The drift is covered instead — publicRoutes.test.ts walks the app
 * directory and fails if this list and the pages on disk disagree, so adding a
 * page without listing it here breaks a test rather than quietly going
 * unindexed.
 */

/**
 * Whether a route belongs in the sitemap.
 *
 * Three things are excluded. A dynamic segment has no single URL to publish.
 * The `/dev` skeleton pages are build tooling, not content. And anything behind
 * a login only ever hands a crawler a redirect, so listing it advertises a
 * private area and wastes the crawl.
 *
 * @param route - A URL path, e.g. "/thoughts/security".
 * @returns True when the route should be listed.
 */
export function isIndexableRoute(route: string): boolean {
  if (route.includes("[")) return false;
  if (route === "/dev" || route.startsWith("/dev/")) return false;
  return !isSessionProtectedPath(route);
}

/** Every indexable page, newest content first is not meaningful here — sorted. */
export const PUBLIC_ROUTES: readonly string[] = [
  "/",
  "/craft",
  "/design-system",
  "/discover",
  "/fantasy/nba",
  "/fantasy/nba/court-vision",
  "/fantasy/nba/league-history",
  "/fantasy/nba/matchups",
  "/fantasy/nba/player/stats",
  "/fantasy/nba/playoffs",
  "/flags",
  "/gallery-wall",
  "/graphql",
  "/lab",
  "/lab/motion",
  "/lab/particles",
  "/learn",
  "/learn/ai-agent-patterns",
  "/learn/async-patterns",
  "/learn/binary-search",
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
  "/operator",
  "/operator/finance",
  "/operator/loss",
  "/operator/planner",
  "/operator/products",
  "/operator/search",
  "/pokemon",
  "/research",
  "/resume",
  "/tcg/pocket",
  "/tcg/pokemon",
  "/tcg/pokemon/sets",
  "/thoughts",
  "/thoughts/accessibility",
  "/thoughts/ai-agent-patterns",
  "/thoughts/ai-security",
  "/thoughts/security-audit",
  "/thoughts/api-backend-overhaul",
  "/thoughts/bundle",
  "/thoughts/bundlers",
  "/thoughts/calendar",
  "/thoughts/ci-e2e",
  "/thoughts/command-palette",
  "/thoughts/craft",
  "/thoughts/crawlers",
  "/thoughts/database-networking",
  "/thoughts/deployment",
  "/thoughts/design-system",
  "/thoughts/design-system-charts",
  "/thoughts/design-system-showcase",
  "/thoughts/e2e",
  "/thoughts/feature-flags",
  "/thoughts/gallery-wall",
  "/thoughts/graphql",
  "/thoughts/harness-visual-plan",
  "/thoughts/hybrid-rendering",
  "/thoughts/improvements",
  "/thoughts/ketsup",
  "/thoughts/landing-page",
  "/thoughts/learn",
  "/thoughts/login-redirect",
  "/thoughts/to-do",
  "/thoughts/mac-menu-bar",
  "/thoughts/messenger-auth",
  "/thoughts/motion-components",
  "/thoughts/npm-to-pnpm",
  "/thoughts/operator-dashboard",
  "/thoughts/particles",
  "/thoughts/perf",
  "/thoughts/playoffs",
  "/thoughts/pr-screenshots",
  "/thoughts/project-review",
  "/thoughts/react-doctor",
  "/thoughts/refactor-pass",
  "/thoughts/render-perf",
  "/thoughts/research-explorer",
  "/thoughts/routing",
  "/thoughts/search-bar",
  "/thoughts/security",
  "/thoughts/styling",
  "/thoughts/tcg",
  "/thoughts/test-tiers",
  "/thoughts/testing",
  "/thoughts/tree-shaking",
  "/thoughts/tree-shaking-2",
  "/thoughts/typescript-7",
  "/thoughts/ui-redesign",
  "/thoughts/v2-redesign",
  "/thoughts/v3-redesign",
  "/thoughts/v4-redesign",
  "/thoughts/v5-redesign",
  "/thoughts/vitals",
  "/thoughts/work-portfolio",
  "/thoughts/world",
  "/vitals",
  "/work-portfolio",
  "/world",
];
