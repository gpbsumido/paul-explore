/** Updates feed: heading, controls, then a stack of entry cards. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function UpdatesLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <Bone className="h-9 w-40" />
        <Bone className="mt-3 h-4 w-full max-w-lg" />
        <Bone className="mt-6 h-10 w-full" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <Bone className="h-3 w-32" />
              <Bone className="mt-2 h-4 w-64" />
              <Bone className="mt-2 h-3 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
