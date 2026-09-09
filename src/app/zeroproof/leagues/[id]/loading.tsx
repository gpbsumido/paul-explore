/** Header and a standings skeleton while a league detail streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function LeagueLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-64" />
        <Bone className="mt-3 h-4 w-80" />
        <Bone className="mt-8 h-5 w-32" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
