/** Heading, the study data card and three case forms while the admin page streams in. */
function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

export default function EvarAdminLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Bone className="h-8 w-64" />
        <Bone className="mt-8 h-32 w-full" />
        <Bone className="mt-10 h-7 w-56" />
        <Bone className="mt-3 h-4 w-96 max-w-full" />
        <div className="mt-6 space-y-6">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
