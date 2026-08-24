import { POKEMON_TYPES } from "@/types/graphql";

/**
 * Placeholder shown by the Suspense boundary while the first page of Pokémon
 * streams in. It reserves the same rows the real content renders — search, the
 * full type-filter row, the results-meta line, then the card grid — so nothing
 * shifts when the data drops in. The filter row uses the real type list at the
 * real pill size (text hidden), so it wraps to exactly the same height, and the
 * card bones match the intrinsic size the real cards reserve (200px).
 */
export default function GraphQLSkeleton() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      {/* nav height placeholder — matches PageHeader's h-14 */}
      <div className="h-14 border-b border-border bg-background/95" />
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5" aria-hidden>
        {/* search */}
        <div className="h-10 rounded-lg bg-surface animate-pulse" />
        {/* type filter pills — the real list at the real size, so the row
            reserves the exact height it will take once interactive */}
        <div className="flex flex-wrap gap-1.5">
          <span className="px-3 py-1 rounded-full text-xs font-semibold border border-border bg-surface text-transparent">
            All
          </span>
          {POKEMON_TYPES.map((type) => (
            <span
              key={type}
              className="px-3 py-1 rounded-full text-xs font-semibold border border-border bg-surface capitalize text-transparent"
            >
              {type}
            </span>
          ))}
        </div>
        {/* results meta + query toggle */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-surface animate-pulse" />
          <div className="h-4 w-24 rounded bg-surface animate-pulse" />
        </div>
        {/* card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface h-[200px] animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
