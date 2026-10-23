/** Heading, three level cards, the chart and the attempts table while the results page streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function EvarResultsLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-64" />
        <Bone className="mt-3 h-4 w-96 max-w-full" />
        <Bone className="mt-8 h-7 w-32" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Bone className="mt-8 h-72 w-full rounded-xl" />
        <Bone className="mt-8 h-48 w-full" />
      </div>
    </div>
  );
}
