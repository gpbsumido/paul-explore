"use client";

import { useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PageIntro from "@/components/PageIntro";
import { THOUGHTS } from "@/app/_shared/featureData.data";
import { groupThoughts, categoryAnchor } from "@/app/_shared/thoughtCategories";
import type { ThoughtItem } from "@/types/hub";

/** A single write-up card, colour-keyed to match its page. The first card of
 *  the first group renders `featured` — a wider bento tile that breaks the
 *  uniform three-up grid. */
function ThoughtCard({
  thought,
  featured = false,
  wide = false,
}: {
  thought: ThoughtItem;
  featured?: boolean;
  wide?: boolean;
}) {
  return (
    <Link
      href={thought.href}
      className={`glass-card flex h-full items-start gap-3 rounded-xl p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm${
        featured ? " sm:col-span-2 sm:p-6" : wide ? " sm:col-span-2" : ""
      }${thought.deprecated ? " opacity-70" : ""}`}
    >
      <span
        aria-hidden
        className={`mt-1.5 shrink-0 rounded-full ${featured ? "h-3 w-3" : "h-2.5 w-2.5"}`}
        style={{ backgroundColor: thought.color }}
      />
      <div className="min-w-0">
        <p
          className={`flex items-center gap-2 font-semibold text-foreground${featured ? " text-lg" : ""}`}
        >
          <span className="truncate">{thought.title}</span>
          {thought.deprecated ? (
            <span className="shrink-0 rounded-sm bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
              deprecated
            </span>
          ) : null}
        </p>
        <p className={`mt-1 text-muted${featured ? " text-[15px]" : " text-sm"}`}>
          {thought.preview}
        </p>
      </div>
    </Link>
  );
}

/** Index for the /thoughts section: write-ups grouped by category so they are easier to scan. */
export default function ThoughtsIndexContent() {
  const groups = groupThoughts(THOUGHTS);

  // Jump to the #category section on load. The browser's own hash scroll misses
  // it because the content is client-rendered (and the loading.tsx skeleton
  // shows first), so the target isn't in the DOM when the native jump fires and
  // Next's router never retries. scrollIntoView honours the section's scroll-mt.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Thoughts" }]}
        maxWidth="max-w-5xl"
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <PageIntro
          eyebrow="Dev notes"
          title="Thoughts"
          lede="Deep-dives into the architecture decisions, trade-offs, and lessons behind everything in this project, grouped by area."
        />

        <div className="space-y-12">
          {groups.map((group, i) => (
            <section
              key={group.name}
              id={categoryAnchor(group.name)}
              // scroll-mt clears the sticky h-14 header so a deep link from the
              // landing graph lands on the heading, not under the nav.
              className="scroll-mt-20"
            >
              <h2 className="mb-4 flex items-baseline gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                <span className="tabular-nums text-primary-600 dark:text-primary-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span aria-hidden className="text-muted/40">
                  /
                </span>
                {group.name}
              </h2>
              {/* grid-flow-dense + a repeating wide tile turns the rigid
                  three-up into an irregular bento so the index stops reading as
                  a perfectly even grid. */}
              <div className="grid grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((thought, j) => {
                  const isFeatured = i === 0 && j === 0;
                  return (
                    <ThoughtCard
                      key={thought.href}
                      thought={thought}
                      featured={isFeatured}
                      wide={!isFeatured && j % 4 === 0}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
