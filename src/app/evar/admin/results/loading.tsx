/** Heading, the filters panel, the per-measurement table and the attempts table while the page streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function EvarAdminResultsLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-64" />
        <Bone className="mt-6 h-56 w-full rounded-xl" />
        <Bone className="mt-6 h-4 w-48" />
        <Bone className="mt-4 h-48 w-full" />
        <Bone className="mt-8 h-64 w-full" />
      </div>
    </div>
  );
}
