"use client";

import { useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts, categoryAnchor } from "@/app/_shared/thoughtCategories";
import type { ThoughtItem } from "@/types/hub";

/** A single write-up card, colour-keyed to match its page. */
function ThoughtCard({ thought }: { thought: ThoughtItem }) {
  return (
    <Link
      href={thought.href}
      className={`flex h-full items-start gap-3 rounded-xl border border-border p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm${
        thought.deprecated ? " opacity-70" : ""
      }`}
      style={{ borderLeftWidth: 3, borderLeftColor: thought.color }}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <span className="truncate">{thought.title}</span>
          {thought.deprecated ? (
            <span className="shrink-0 rounded-sm bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
              deprecated
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-muted">{thought.preview}</p>
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
            <section
              key={group.name}
              id={categoryAnchor(group.name)}
              // scroll-mt clears the sticky h-14 header so a deep link from the
              // landing graph lands on the heading, not under the nav.
              className="scroll-mt-20"
            >
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
