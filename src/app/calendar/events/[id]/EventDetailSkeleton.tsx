/** Full-page loading skeleton for the event detail view. */
export default function EventDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="h-4 w-20 rounded bg-surface animate-pulse" />
      <div className="space-y-2">
        <div className="h-6 w-64 rounded bg-surface animate-pulse" />
        <div className="h-4 w-48 rounded bg-surface animate-pulse" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md bg-surface animate-pulse"
            style={{ aspectRatio: "2.5/3.5" }}
          />
        ))}
      </div>
    </div>
  );
}
