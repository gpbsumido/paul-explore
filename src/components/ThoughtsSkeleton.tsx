/**
 * One shimmer line at a given Tailwind width, sized like a paragraph row.
 */
function Line({ w }: { w: string }) {
  return (
    <div
      className={`h-4 ${w} animate-pulse rounded-full bg-border`}
      style={{ opacity: 0.7 }}
    />
  );
}

/**
 * A section placeholder: a heading bar followed by a few paragraph lines.
 * Widths vary per section so the block reads as prose rather than a grid.
 */
function Section({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-3">
      <div className="h-5 w-1/3 animate-pulse rounded-full bg-border" />
      {lines.map((w, i) => (
        <Line key={i} w={w} />
      ))}
    </div>
  );
}

/**
 * Skeleton placeholder shown while a thoughts-page content component loads.
 *
 * Thoughts pages open on the Summary view (an article), so this mirrors that
 * layout: a sticky header bar like PageHeader, then a title block and a stack
 * of section shimmers. Matching the default view is what stops the page from
 * flashing the chat layout first and then snapping to the summary once the real
 * content mounts. Used as the route-level `loading` fallback for all thoughts
 * pages.
 */
export default function ThoughtsSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Sticky header — mirrors PageHeader (h-14, border-b, max-w-3xl) */}
      <div className="sticky top-0 z-20 h-14 border-b border-border">
        <div className="mx-auto flex h-full max-w-3xl items-center gap-4 px-4 sm:px-6">
          {/* Breadcrumb placeholder */}
          <div className="h-4 w-14 animate-pulse rounded-full bg-border" />
          <div className="h-4 w-px bg-border" />
          <div className="h-4 w-28 animate-pulse rounded-full bg-border" />

          {/* Right: view toggle + menu placeholders */}
          <div className="ml-auto flex items-center gap-3">
            <div className="h-6 w-28 animate-pulse rounded-md bg-border" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-border" />
          </div>
        </div>
      </div>

      {/* Article — mirrors the summary <main> */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-10">
          {/* Eyebrow label */}
          <div className="mb-3 h-3 w-20 animate-pulse rounded-full bg-border" />
          {/* Title */}
          <div className="h-9 w-3/4 animate-pulse rounded-lg bg-border sm:h-10" />
          {/* Subtitle, two lines */}
          <div className="mt-4 space-y-2">
            <Line w="w-full" />
            <Line w="w-5/6" />
          </div>
        </header>

        <div className="space-y-10">
          <Section lines={["w-full", "w-full", "w-11/12", "w-2/3"]} />
          <Section lines={["w-full", "w-10/12", "w-full", "w-1/2"]} />
          <Section lines={["w-11/12", "w-full", "w-3/4"]} />
          <Section lines={["w-full", "w-full", "w-5/6", "w-2/5"]} />
        </div>
      </main>
    </div>
  );
}
