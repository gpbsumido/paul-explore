import ThemeToggle from "@/components/ThemeToggle";

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

export default function SetDetailLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Bone className="h-4 w-10" />
          <div className="h-4 w-px bg-border" />
          <Bone className="h-4 w-36" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Set header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center gap-6">
          <Bone className="h-14 w-40" />
          <div className="flex flex-col gap-2">
            <Bone className="h-7 w-48" />
            <div className="flex items-center gap-4">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-3.5 w-10" />
              <Bone className="h-3.5 w-16" />
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <Bone className="h-7 w-24" />
            <Bone className="h-7 w-24" />
          </div>
        </div>
      </div>

      {/* Card grid skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-surface animate-pulse"
              style={{ aspectRatio: "2.5/3.5" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
