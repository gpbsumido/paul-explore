import Bone from "@/components/operator/Bone";

function StoreCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <Bone style={{ height: 14, width: 140 }} />
          <Bone style={{ height: 12, width: 100 }} />
        </div>
        <Bone style={{ height: 20, width: 64, borderRadius: 999 }} />
      </div>
      <div className="flex gap-4">
        <Bone style={{ height: 12, width: 60 }} />
        <Bone style={{ height: 12, width: 40 }} />
        <Bone style={{ height: 12, width: 48 }} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <Bone style={{ height: 11, width: 52 }} />
          <Bone style={{ height: 11, width: 28 }} />
        </div>
        <Bone style={{ height: 6, width: "100%", borderRadius: 999 }} />
      </div>
      <Bone style={{ height: 12, width: 80 }} />
    </div>
  );
}

export default function OperatorLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      {/* Stats bar skeleton */}
      <div className="flex flex-wrap items-center justify-center gap-px rounded-xl border border-border bg-surface divide-x divide-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 px-4 py-3">
            <Bone style={{ height: 20, width: 36 }} />
            <Bone style={{ height: 11, width: 72 }} />
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} style={{ height: 30, width: 64, borderRadius: 8 }} />
          ))}
        </div>
        <div className="sm:ml-auto">
          <Bone style={{ height: 32, width: 224, borderRadius: 8 }} />
        </div>
      </div>

      {/* Store grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StoreCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
