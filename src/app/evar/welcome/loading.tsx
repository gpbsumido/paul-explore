/** The welcome page: the headline and buttons beside the video, then the study question. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function EvarWelcomeLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <Bone className="h-10 w-80 max-w-full" />
            <Bone className="mt-4 h-5 w-full max-w-[46ch]" />
            <div className="mt-6 flex gap-3">
              <Bone className="h-11 w-40 rounded-lg" />
              <Bone className="h-11 w-32 rounded-lg" />
            </div>
          </div>
          <Bone className="aspect-video w-full rounded-2xl" />
        </div>
        <Bone className="mt-12 h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}
