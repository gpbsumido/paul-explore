export default function FlagsLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded bg-surface" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-surface" />
      </div>
      <div className="h-9 w-64 animate-pulse rounded-lg bg-surface" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl border border-border bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
