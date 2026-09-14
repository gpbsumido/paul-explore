/** Budget page skeleton: the add bar, then the analytics cards. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function BudgetLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Bone className="h-8 w-40" />
      <Bone className="h-4 w-full max-w-md" />
      <Bone className="h-12 w-44 rounded-xl" />
      <Bone className="h-16 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
