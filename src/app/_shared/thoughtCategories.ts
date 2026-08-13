import type { ThoughtItem } from "@/types/hub";

/** A named, ordered bucket of write-ups shown together. */
export type ThoughtGroup = { name: string; items: ThoughtItem[] };

/** Ordered category definitions. Each slug is the path segment after /thoughts/. */
const CATEGORIES: { name: string; slugs: string[] }[] = [
  {
    name: "Features",
    slugs: [
      "research-explorer",
      "learn",
      "particles",
      "world",
      "gallery-wall",
      "feature-flags",
      "to-do",
      "search-bar",
      "tcg",
      "calendar",
      "playoffs",
      "operator-dashboard",
      "work-portfolio",
      "ketsup",
      "ai-agent-patterns",
      "mac-menu-bar",
      "craft",
      "command-palette",
    ],
  },
  {
    name: "Design & UI",
    slugs: [
      "design-system",
      "design-system-charts",
      "design-system-showcase",
      "motion-components",
      "styling",
      "landing-page",
      "ui-redesign",
      "v2-redesign",
      "v3-redesign",
      "v4-redesign",
      "accessibility",
    ],
  },
  {
    name: "Performance",
    slugs: [
      "perf",
      "render-perf",
      "vitals",
      "bundle",
      "tree-shaking",
      "tree-shaking-2",
    ],
  },
  {
    name: "Architecture & Backend",
    slugs: [
      "graphql",
      "routing",
      "hybrid-rendering",
      "improvements",
      "api-backend-overhaul",
      "login-redirect",
      "messenger-auth",
    ],
  },
  {
    name: "Testing & Quality",
    slugs: [
      "react-doctor",
      "project-review",
      "refactor-pass",
      "testing",
      "e2e",
      "ci-e2e",
      "test-tiers",
    ],
  },
  {
    name: "Security",
    slugs: ["security", "ai-security", "security-audit"],
  },
  {
    name: "Build & Tooling",
    slugs: [
      "npm-to-pnpm",
      "bundlers",
      "deployment",
      "pr-screenshots",
      "typescript-7",
      "harness-visual-plan",
      "crawlers",
    ],
  },
];

/** The slug is the path segment after /thoughts/, used to match a thought to a category. */
const slugOf = (href: string): string => href.replace(/^\/thoughts\//, "");

/**
 * A URL-fragment id for a category, e.g. "Design & UI" -> "design-ui". The
 * /thoughts index tags each category section with this id, and the landing
 * graph's category nodes link to `/thoughts#<anchor>` so a click lands on the
 * matching section rather than the top of the page.
 */
export const categoryAnchor = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Name of the trailing group for write-ups whose feature no longer applies. */
export const DEPRECATED_GROUP = "Deprecated";

/**
 * Group the given thoughts into the ordered categories above. Anything not
 * assigned to a category falls into a trailing "More" group, so a newly added
 * thought is never hidden just because it hasn't been categorized yet.
 * Deprecated write-ups are pulled out of the categories into a final
 * "Deprecated" group.
 */
export function groupThoughts(thoughts: ThoughtItem[]): ThoughtGroup[] {
  const active = thoughts.filter((t) => !t.deprecated);
  const deprecated = thoughts.filter((t) => t.deprecated);

  const bySlug = new Map(active.map((t) => [slugOf(t.href), t]));
  const claimed = new Set<string>();

  const groups = CATEGORIES.map((category) => {
    const items = category.slugs
      .map((slug) => bySlug.get(slug))
      .filter((t): t is ThoughtItem => t !== undefined);
    items.forEach((t) => claimed.add(slugOf(t.href)));
    return { name: category.name, items };
  }).filter((group) => group.items.length > 0);

  const leftovers = active.filter((t) => !claimed.has(slugOf(t.href)));
  if (leftovers.length > 0) {
    groups.push({ name: "More", items: leftovers });
  }

  if (deprecated.length > 0) {
    groups.push({ name: DEPRECATED_GROUP, items: deprecated });
  }

  return groups;
}
