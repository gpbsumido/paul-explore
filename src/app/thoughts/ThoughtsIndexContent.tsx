"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { THOUGHTS } from "@/app/_shared/featureData";
import type { ThoughtItem } from "@/types/hub";

/** Ordered groups for the thoughts index. Each slug is the part after /thoughts/. */
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
    slugs: ["react-doctor", "testing", "e2e", "ci-e2e"],
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
 * Group THOUGHTS into the ordered categories above. Anything not assigned to a
 * category falls into a trailing "More" group, so a newly added thought is never
 * hidden just because it hasn't been categorized yet.
 */
function groupThoughts(): { name: string; items: ThoughtItem[] }[] {
  const bySlug = new Map(THOUGHTS.map((t) => [slugOf(t.href), t]));
  const claimed = new Set<string>();

  const groups = CATEGORIES.map((category) => {
    const items = category.slugs
      .map((slug) => bySlug.get(slug))
      .filter((t): t is ThoughtItem => t !== undefined);
    items.forEach((t) => claimed.add(slugOf(t.href)));
    return { name: category.name, items };
  }).filter((group) => group.items.length > 0);

  const leftovers = THOUGHTS.filter((t) => !claimed.has(slugOf(t.href)));
  if (leftovers.length > 0) {
    groups.push({ name: "More", items: leftovers });
  }

  return groups;
}

/** A single write-up card, colour-keyed to match its page. */
function ThoughtCard({ thought }: { thought: ThoughtItem }) {
  return (
    <Link
      href={thought.href}
      className="flex h-full items-start gap-3 rounded-xl border border-border p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: thought.color }}
    >
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{thought.title}</p>
        <p className="mt-1 text-sm text-muted">{thought.preview}</p>
      </div>
    </Link>
  );
}

/** Index for the /thoughts section: write-ups grouped by category so they are easier to scan. */
export default function ThoughtsIndexContent() {
  const groups = groupThoughts();

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Thoughts" },
        ]}
        showLogout={false}
        maxWidth="max-w-5xl"
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <header className="mb-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Dev notes
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Thoughts
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Deep-dives into the architecture decisions, trade-offs, and lessons
            behind everything in this project, grouped by area.
          </p>
        </header>

        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.name}>
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                {group.name}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((thought) => (
                  <ThoughtCard key={thought.href} thought={thought} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
