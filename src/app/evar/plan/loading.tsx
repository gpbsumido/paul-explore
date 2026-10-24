/** The plan page: the heading and lead, the estimate's sliders and total, then the range table. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function EvarPlanLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-72 max-w-full" />
        <Bone className="mt-4 h-4 w-full max-w-prose" />
        <Bone className="mt-2 h-4 w-5/6 max-w-prose" />
        <Bone className="mt-12 h-7 w-56" />
        <Bone className="mt-4 h-24 w-full max-w-prose" />
        <Bone className="mt-12 h-7 w-40" />
        {/* The estimate: six sliders in two columns, the total, and its breakdown. */}
        <Bone className="mt-4 h-[28rem] w-full rounded-2xl" />
        <Bone className="mt-8 h-48 w-full" />
      </div>
    </div>
  );
}
