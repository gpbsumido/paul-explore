/** Trait matrix: heading then the rows of the table. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function CraftLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Bone className="h-8 w-56" />
        <Bone className="mt-3 h-4 w-full max-w-lg" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <Bone className="h-4 w-48" />
              <Bone className="mt-2 h-3 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
