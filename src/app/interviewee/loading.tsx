/** Header and a couple of rows of topic cards while the deck resolves. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function IntervieweeLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <Bone className="h-9 w-56" />
        <Bone className="mt-3 h-4 w-full max-w-md" />

        <Bone className="mt-8 h-3 w-24" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, card) => (
            <div
              key={card}
              className="rounded-xl border border-border bg-surface/60 px-4 py-4"
            >
              <Bone className="h-4 w-40" />
              <Bone className="mt-2 h-3 w-full max-w-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
