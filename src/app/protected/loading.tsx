import ThemeToggle from "@/components/ThemeToggle";

// Shared pulsing bone — mirrors the bg-surface token so it adapts to theme.
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

// Skeleton for a single feature card — preview block on top, body below.
function FeatureCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Preview area */}
      <div
        className="bg-neutral-100 dark:bg-neutral-950"
        style={{ height: 112 }}
      />

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Title row: dot + name */}
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--color-surface)",
              flexShrink: 0,
              animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          />
          <Bone style={{ height: 14, width: "55%" }} />
        </div>

        {/* Description lines */}
        <Bone style={{ height: 10, width: "95%" }} />
        <Bone style={{ height: 10, width: "78%" }} />

        {/* Footer links */}
        <div className="mt-2 flex items-center justify-between">
          <Bone style={{ height: 11, width: 36 }} />
          <Bone style={{ height: 11, width: 52 }} />
        </div>
      </div>
    </div>
  );
}

// Skeleton for a single thought/dev-note card.
function ThoughtCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
      <div
        style={{
          width: 8,
          height: 8,
          marginTop: 2,
          borderRadius: "50%",
          flexShrink: 0,
          background: "var(--color-surface)",
          animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        }}
      />
      <div className="flex flex-1 flex-col gap-1.5">
        <Bone style={{ height: 12, width: "65%" }} />
        <Bone style={{ height: 10, width: "88%" }} />
      </div>
    </div>
  );
}

export default function ProtectedLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      {/* Sticky header — matches FeatureHub's sticky header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Bone style={{ height: 16, width: 96 }} />

          <div className="flex items-center gap-3">
            {/* User info block — hidden on small screens same as real header */}
            <div className="hidden flex-col items-end gap-1 sm:flex">
              <Bone style={{ height: 11, width: 88 }} />
              <Bone style={{ height: 10, width: 120 }} />
            </div>
            <ThemeToggle />
            <Bone style={{ height: 11, width: 44 }} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {/* Page heading */}
        <div className="mb-8">
          <Bone style={{ height: 28, width: 320 }} />
          <Bone style={{ height: 13, width: 240, marginTop: 10 }} />
        </div>

        {/* Feature card grid — 7 cards to match FEATURES.length */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <FeatureCardSkeleton key={i} />
          ))}
        </div>

        {/* Dev notes section */}
        <div className="mt-14">
          <Bone style={{ height: 11, width: 72, marginBottom: 12 }} />
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ThoughtCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
