/** Interview prep: the playbook nav, a title and intro, then stacked sections. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function InterviewPrepLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="flex gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-4 w-16" />
          ))}
        </div>
        <Bone className="mt-10 h-9 w-72" />
        <Bone className="mt-4 h-4 w-full max-w-xl" />
        <Bone className="mt-2 h-4 w-full max-w-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mt-14">
            <Bone className="h-3 w-28" />
            <Bone className="mt-4 h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
