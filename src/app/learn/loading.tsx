/** Algorithm walkthrough: title, controls, then the visualiser stage. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function LearnLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Bone className="h-8 w-64" />
        <Bone className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <Bone className="mt-6 h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}
