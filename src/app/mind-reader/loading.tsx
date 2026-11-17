/** Intro block, then the card the game mounts into. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function MindReaderLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Bone className="h-8 w-56" />
        <Bone className="mt-3 h-4 w-full max-w-lg" />
        <Bone className="mx-auto mt-10 h-64 w-full max-w-xl rounded-xl" />
      </div>
    </div>
  );
}
