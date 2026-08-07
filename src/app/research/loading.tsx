/** Header, tab row, and topic cards while /research streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function ResearchLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-72" />
        <Bone className="mt-3 h-4 w-full max-w-2xl" />

        <div className="mt-6 flex gap-2">
          <Bone className="h-9 w-24 rounded-full" />
          <Bone className="h-9 w-28 rounded-full" />
          <Bone className="h-9 w-36 rounded-full" />
        </div>

        <div className="mt-8 space-y-8">
          {Array.from({ length: 3 }).map((_, section) => (
            <div key={section}>
              <Bone className="h-3 w-40" />
              <div className="mt-3 space-y-3">
                {Array.from({ length: 3 }).map((_, card) => (
                  <div
                    key={card}
                    className="rounded-xl border border-border bg-surface/60 px-4 py-3"
                  >
                    <Bone className="h-4 w-64" />
                    <Bone className="mt-2 h-3 w-full max-w-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
