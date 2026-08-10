/** Wall arranger: toolbar, then the canvas the photos land on. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function GalleryWallLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="h-14 border-b border-border" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-52" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} className="h-9 w-32 rounded-full" />
          ))}
        </div>
        <Bone className="mt-6 h-[26rem] w-full rounded-xl" />
      </div>
    </div>
  );
}
