/** Header and two small table skeletons while the ingest-health streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function IngestHealthLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-48" />
        <Bone className="mt-3 h-4 w-80" />
        {[0, 1].map((s) => (
          <div key={s} className="mt-8">
            <Bone className="h-5 w-28" />
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((i) => (
                <Bone key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
