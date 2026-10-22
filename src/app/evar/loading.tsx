/** EVAR sizing: intro, then the slice viewer beside the measurement list. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function EvarLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <Bone className="h-12 w-64" />
        <Bone className="mt-4 h-4 w-full max-w-2xl" />
        <Bone className="mt-2 h-4 w-full max-w-xl" />
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,576px)_1fr]">
          <Bone className="aspect-square w-full rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bone key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
