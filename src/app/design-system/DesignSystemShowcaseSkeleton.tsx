/**
 * Placeholder shown while the design system showcase content component loads.
 *
 * Mirrors the real layout: a sticky header like PageHeader (h-14, border-b,
 * max-w-5xl), a hero block, and a responsive grid of component-card shimmers so
 * there's no layout shift when the interactive gallery mounts.
 */
export default function DesignSystemShowcaseSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Sticky header — mirrors PageHeader */}
      <div className="sticky top-0 z-20 h-14 border-b border-border">
        <div className="mx-auto flex h-full max-w-5xl items-center gap-4 px-4 sm:px-6">
          <div className="h-4 w-14 animate-pulse rounded-full bg-border" />
          <div className="h-4 w-px bg-border" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-border" />
          <div className="ml-auto h-6 w-6 animate-pulse rounded-full bg-border" />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Hero */}
        <div className="mb-16">
          <div className="mb-3 h-3 w-32 animate-pulse rounded-full bg-border" />
          <div className="h-9 w-2/3 animate-pulse rounded-lg bg-border sm:h-10" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded-full bg-border" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-border" />
          </div>
          <div className="mt-5 flex gap-3">
            <div className="h-10 w-40 animate-pulse rounded-lg bg-border" />
            <div className="h-10 w-40 animate-pulse rounded-lg bg-border" />
          </div>
        </div>

        {/* Component grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-border bg-surface"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
