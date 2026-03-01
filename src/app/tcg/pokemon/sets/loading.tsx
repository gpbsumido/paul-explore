import ThemeToggle from "@/components/ThemeToggle";

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

function SetCardSkeleton() {
  return <div className="rounded-lg bg-surface animate-pulse h-[88px]" />;
}

export default function SetsLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Bone className="h-4 w-16" />
          <div className="h-4 w-px bg-border" />
          <Bone className="h-4 w-10" />
          <div className="ml-auto flex items-center gap-5">
            <Bone className="h-4 w-12" />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
        <Bone className="h-9 w-32" />

        {[6, 4, 5].map((count, i) => (
          <section key={i}>
            <div className="flex items-center gap-3 mb-4">
              <Bone className="h-7 w-28" />
              <Bone className="h-4 w-12" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: count }).map((_, j) => (
                <SetCardSkeleton key={j} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
