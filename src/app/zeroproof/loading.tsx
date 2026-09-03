/** Header and a couple of board cards while /zeroproof streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function ZeroProofLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Bone className="h-9 w-48" />
        <Bone className="mt-3 h-4 w-full max-w-2xl" />

        <Bone className="mt-10 h-6 w-32" />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border p-5">
              <Bone className="h-5 w-40" />
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Bone className="h-9 w-full" />
                <Bone className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
