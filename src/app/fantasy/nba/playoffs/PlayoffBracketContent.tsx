"use client";

import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { queryKeys } from "@/lib/queryKeys";
import FantasyNav from "../FantasyNav";

// ---- Skeleton ----

function SkeletonRoundCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="h-3 w-20 rounded bg-surface-raised animate-pulse" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-full rounded-lg bg-surface-raised animate-pulse"
        />
      ))}
    </div>
  );
}

function BracketSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-6">
      {/* East */}
      <div className="space-y-4">
        <div className="h-4 w-16 rounded bg-surface-raised animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRoundCard key={i} />
        ))}
      </div>

      {/* Finals */}
      <div className="flex flex-col items-center gap-4 min-w-[160px]">
        <div className="h-4 w-20 rounded bg-surface-raised animate-pulse" />
        <SkeletonRoundCard />
      </div>

      {/* West */}
      <div className="space-y-4">
        <div className="h-4 w-16 rounded bg-surface-raised animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRoundCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ---- Main content ----

export default function PlayoffBracketContent() {
  const bracketQuery = useQuery({
    queryKey: queryKeys.nba.playoffBracket(),
    queryFn: async () => {
      const res = await fetch("/api/nba/playoffs/bracket");
      if (!res.ok) throw new Error("Failed to load bracket");
      return res.json();
    },
    staleTime: 60 * 60_000,
  });

  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Playoffs" }]}
      />
      <FantasyNav />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {bracketQuery.isLoading && <BracketSkeleton />}

        {bracketQuery.isError && (
          <div className="flex items-center justify-center py-20 text-muted text-[15px]">
            {bracketQuery.error instanceof Error
              ? bracketQuery.error.message
              : "Something went wrong"}
          </div>
        )}

        {bracketQuery.data && (
          <pre className="rounded-xl border border-border bg-surface p-4 text-[13px] text-foreground overflow-auto">
            {JSON.stringify(bracketQuery.data, null, 2)}
          </pre>
        )}
      </main>
    </div>
  );
}
