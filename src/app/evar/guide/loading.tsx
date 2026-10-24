/** The guide: its heading and lead, the video, then the first step's text beside its picture. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function EvarGuideLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Bone className="h-9 w-80 max-w-full" />
        <Bone className="mt-4 h-4 w-full max-w-prose" />
        <Bone className="mt-2 h-4 w-5/6 max-w-prose" />
        <Bone className="mt-8 aspect-video w-full rounded-2xl" />
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div>
            <Bone className="h-7 w-64" />
            <Bone className="mt-4 h-24 w-full" />
          </div>
          <Bone className="aspect-square w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
