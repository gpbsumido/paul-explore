import ThemeToggle from "@/components/ThemeToggle";

// Shared pulsing bone — mirrors bg-surface so it adapts to light and dark theme.
function Bone({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--color-surface)",
        borderRadius: 6,
        animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        ...style,
      }}
    />
  );
}

// Skeleton for one metric card — matches the rounded-xl border bg-surface p-4
// layout with label, rating badge, big number, and sample count.
function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {/* Label + rating badge row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Bone style={{ height: 11, width: 32 }} />
          <Bone style={{ height: 10, width: 56 }} />
        </div>
        <Bone style={{ height: 18, width: 52, borderRadius: 999 }} />
      </div>
      {/* P75 value */}
      <Bone style={{ height: 28, width: 72, marginTop: 12 }} />
      {/* Sample count */}
      <Bone style={{ height: 11, width: 88, marginTop: 6 }} />
    </div>
  );
}

// Skeleton for one row in the by-page table.
function TableRowSkeleton({ alt }: { alt: boolean }) {
  return (
    <tr className={alt ? "bg-surface" : "bg-background"}>
      <td className="px-3 py-3">
        <Bone style={{ height: 12, width: "60%" }} />
      </td>
      {/* 5 metric value cells */}
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <Bone style={{ height: 12, width: 36, margin: "0 auto" }} />
        </td>
      ))}
      <td className="px-3 py-3">
        <Bone style={{ height: 12, width: 28, marginLeft: "auto" }} />
      </td>
    </tr>
  );
}

// Skeleton for one improvement note card.
function ImprovementCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <Bone style={{ height: 11, width: 28 }} />
      <Bone style={{ height: 14, width: "70%", marginTop: 8 }} />
      <div className="mt-2 flex flex-col gap-1">
        <Bone style={{ height: 12, width: "95%" }} />
        <Bone style={{ height: 12, width: "85%" }} />
        <Bone style={{ height: 12, width: "75%" }} />
      </div>
    </div>
  );
}

export default function VitalsLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      {/* Sticky nav — same h-14 and structure as VitalsContent */}
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-5xl items-center gap-4 px-4">
          <Bone style={{ height: 14, width: 72 }} />
          <div className="h-4 w-px bg-border" />
          <Bone style={{ height: 12, width: 80 }} />
          <div className="ml-auto flex items-center gap-3">
            <Bone style={{ height: 28, width: 96, borderRadius: 8 }} />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Page heading */}
        <div className="mb-6">
          <Bone style={{ height: 24, width: 180 }} />
          <Bone style={{ height: 13, width: 320, marginTop: 6 }} />
        </div>

        {/* 5 metric cards — same grid as the real layout */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>

        {/* By-page table */}
        <div className="mt-8">
          <Bone style={{ height: 11, width: 56, marginBottom: 12 }} />
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {/* Page header + 5 metric headers + samples header */}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <th key={i} className="px-3 py-2.5">
                      <Bone style={{ height: 11, width: i === 0 ? 36 : 28, margin: i === 0 ? undefined : "0 auto" }} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRowSkeleton key={i} alt={i % 2 !== 0} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Improvement notes */}
        <div className="mt-10">
          <Bone style={{ height: 11, width: 180, marginBottom: 16 }} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ImprovementCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
