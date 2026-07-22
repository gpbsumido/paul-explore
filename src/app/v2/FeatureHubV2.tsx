"use client";

import { useState, useRef } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { staggerContainer } from "@/lib/animations";
import { reveal } from "@/app/landing/Section";
import NavBar from "./landing/NavBar";
import {
  FEATURES,
  THOUGHTS,
  FeatureCard,
  ThoughtCard,
} from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";
import { TEST_COUNT } from "@/app/_shared/testCount.generated";

type MeData = { name: string | null; email: string | null };

const CATEGORIES: ReadonlyArray<{
  label: string;
  ids: ReadonlySet<string> | null;
}> = [
  { label: "All", ids: null },
  {
    label: "Engineering",
    ids: new Set(["vitals", "operator", "ketsup", "work-portfolio"]),
  },
  { label: "Labs", ids: new Set(["particles", "learn"]) },
  { label: "Calendar", ids: new Set(["calendar"]) },
  {
    label: "NBA",
    ids: new Set(["nba", "matchups", "court-vision", "league", "playoffs"]),
  },
  { label: "Pokemon", ids: new Set(["tcg", "pocket", "graphql"]) },
];

export default function FeatureHubV2({ initialMe }: { initialMe?: MeData }) {
  const prefersReduced = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);

  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<MeData> =>
      fetch("/api/me").then((r) => {
        if (!r.ok) throw new Error("Failed to load user");
        return r.json();
      }),
    initialData: initialMe,
    staleTime: 5 * 60_000,
  });
  const userName = meQuery.isLoading ? null : (meQuery.data?.name ?? "there");
  const firstName = userName ? userName.split(" ")[0] : null;

  const selected = CATEGORIES[active];
  const filtered = selected.ids
    ? FEATURES.filter((f) => selected.ids!.has(f.id))
    : FEATURES;

  const thoughtsRef = useRef(null);
  const thoughtsVisible = useInView(thoughtsRef, {
    once: true,
    margin: "-10% 0px",
  });

  return (
    <div className="min-h-dvh bg-background">
      <NavBar authenticated />

      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 pb-8 pt-24 sm:pb-12 sm:pt-28">
        <h1 className="text-4xl font-bold text-foreground">
          Hey {firstName ?? "there"}.
        </h1>
        <p className="mt-2 text-lg text-muted">
          {FEATURES.length} features, all yours.
        </p>
        <p className="mt-1 text-xs text-muted">
          {TEST_COUNT}+ tests &middot; {THOUGHTS.length} write-ups &middot; 5 CWV
          metrics
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* Category filter tabs — horizontal scroll on mobile */}
        <div
          className="-mx-6 mb-8 flex gap-2 overflow-x-auto px-6 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {CATEGORIES.map((cat, i) => (
            <button type="button"
              key={cat.label}
              onClick={() => setActive(i)}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                i === active
                  ? "bg-foreground text-background"
                  : "bg-surface text-muted hover:text-foreground",
              ].join(" ")}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Feature grid */}
        <m.div
          key={active}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          style={{ perspective: "1000px" }}
          variants={staggerContainer(0.07)}
          initial={prefersReduced ? false : "hidden"}
          animate="visible"
        >
          {filtered.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              prefersReduced={prefersReduced}
            />
          ))}
        </m.div>

        {/* Dev thoughts */}
        <div ref={thoughtsRef} className="mt-14">
          <h2
            className={[
              "mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted",
              reveal(thoughtsVisible, ""),
            ].join(" ")}
          >
            Build notes &middot; {THOUGHTS.length}
          </h2>
          <div className="space-y-8">
            {groupThoughts(THOUGHTS).map((group, gi, all) => {
              const startIndex = all
                .slice(0, gi)
                .reduce((n, g) => n + g.items.length, 0);
              return (
                <div key={group.name}>
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/80">
                    {group.name}
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((thought, j) => (
                      <ThoughtCard
                        key={thought.href}
                        thought={thought}
                        delayMs={(startIndex + j) * 75}
                        visible={thoughtsVisible}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
