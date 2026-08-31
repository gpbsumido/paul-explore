/** Heading, add-site form, and site cards while /check-in/sites streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function CheckInSitesLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-44" />
        <Bone className="mt-3 h-4 w-full max-w-xl" />

        <div className="mt-6 flex gap-3">
          <Bone className="h-10 w-64 rounded-lg" />
          <Bone className="h-10 w-28 rounded-lg" />
        </div>

        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, card) => (
            <div
              key={card}
              className="rounded-xl border border-border bg-surface/60 p-4"
            >
              <Bone className="h-5 w-56" />
              <Bone className="mt-3 h-3 w-72" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
