import PageShell from "@/components/PageShell";

/** Skeleton grid shown while the league loads and cards are minted. */
export default function CardLabLoading() {
  return (
    <PageShell
      colorA="var(--color-feature-nba)"
      colorB="var(--color-feature-tcg)"
      className="font-sans"
    >
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="mb-6 space-y-2">
          <div className="h-7 w-40 animate-pulse rounded bg-surface" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-surface" />
        </div>
        <div className="mb-6 flex flex-wrap gap-2" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-surface" />
          ))}
        </div>
        <ul
          aria-label="Loading cards"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <div className="glass-card overflow-hidden rounded-xl border border-border">
                <div className="aspect-[2.5/3.5] w-full animate-pulse bg-surface" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-surface" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-surface" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </PageShell>
  );
}
