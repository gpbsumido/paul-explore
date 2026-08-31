/** Heading, blurb, and the code field while /check-in streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function CheckInLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-40" />
        <Bone className="mt-3 h-4 w-full max-w-md" />
        <Bone className="mt-2 h-4 w-3/4 max-w-sm" />

        <Bone className="mt-8 h-3 w-24" />
        <Bone className="mt-2 h-10 w-full max-w-xs rounded-lg" />
        <Bone className="mt-4 h-10 w-36 rounded-lg" />
      </div>
    </div>
  );
}
