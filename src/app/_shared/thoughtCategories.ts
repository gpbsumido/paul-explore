import type { ThoughtItem } from "@/types/hub";

/** A named, ordered bucket of write-ups shown together. */
export type ThoughtGroup = { name: string; items: ThoughtItem[] };

/** Ordered category definitions. Each slug is the path segment after /thoughts/. */
const CATEGORIES: { name: string; slugs: string[] }[] = [
  {
    name: "Features",
    slugs: [
      "search-bar",
      "tcg",
      "calendar",
      "playoffs",
      "operator-dashboard",
      "work-portfolio",
      "ketsup",
      "ai-agent-patterns",
    ],
  },
  {
    name: "Design & UI",
    slugs: [
      "design-system",
      "styling",
      "landing-page",
      "ui-redesign",
      "v2-redesign",
      "v3-redesign",
      "accessibility",
    ],
  },
  {
    name: "Performance",
    slugs: ["perf", "render-perf", "vitals", "bundle", "tree-shaking"],
  },
  {
    name: "Architecture & Backend",
    slugs: [
      "graphql",
      "routing",
      "improvements",
      "api-backend-overhaul",
      "messenger-auth",
    ],
  },
  {
    name: "Testing & Quality",
    slugs: ["react-doctor", "project-review", "testing", "e2e", "ci-e2e"],
  },
  {
    name: "Security",
    slugs: ["security", "ai-security"],
  },
  {
    name: "Build & Tooling",
    slugs: ["npm-to-pnpm", "bundlers", "deployment"],
  },
];

/** The slug is the path segment after /thoughts/, used to match a thought to a category. */
const slugOf = (href: string): string => href.replace(/^\/thoughts\//, "");

/**
 * Group the given thoughts into the ordered categories above. Anything not
 * assigned to a category falls into a trailing "More" group, so a newly added
 * thought is never hidden just because it hasn't been categorized yet.
 */
export function groupThoughts(thoughts: ThoughtItem[]): ThoughtGroup[] {
  const bySlug = new Map(thoughts.map((t) => [slugOf(t.href), t]));
  const claimed = new Set<string>();

  const groups = CATEGORIES.map((category) => {
    const items = category.slugs
      .map((slug) => bySlug.get(slug))
      .filter((t): t is ThoughtItem => t !== undefined);
    items.forEach((t) => claimed.add(slugOf(t.href)));
    return { name: category.name, items };
  }).filter((group) => group.items.length > 0);

  const leftovers = thoughts.filter((t) => !claimed.has(slugOf(t.href)));
  if (leftovers.length > 0) {
    groups.push({ name: "More", items: leftovers });
  }

  return groups;
}
