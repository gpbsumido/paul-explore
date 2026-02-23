function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

export default function HomeLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans flex flex-col">
      {/* Hero skeleton */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-32 gap-6 text-center">
        <Bone className="h-12 w-72 sm:w-96" />
        <Bone className="h-5 w-64 sm:w-80" />
        <Bone className="h-4 w-48 sm:w-64" />
        <div className="flex gap-3 mt-2">
          <Bone className="h-10 w-28" />
          <Bone className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}
