import ThemeToggle from "@/components/ThemeToggle";

function Bone({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />
  );
}

function BoneLight({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

export default function PocketLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <BoneLight className="h-4 w-10" />
          <div className="h-4 w-px bg-border" />
          <BoneLight className="h-4 w-20" />
          <div className="ml-auto flex items-center gap-5">
            <BoneLight className="h-4 w-12" />
            <BoneLight className="h-4 w-10" />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary-950 via-primary-950/60 to-background">
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-14 flex flex-col items-start gap-6">
          <Bone className="h-12 w-52" />
          <div className="flex flex-col gap-2">
            <Bone className="h-3.5 w-80" />
            <Bone className="h-3.5 w-64" />
          </div>
          <div className="flex gap-8 items-center">
            <div className="flex flex-col gap-1">
              <Bone className="h-8 w-8" />
              <Bone className="h-2.5 w-8" />
            </div>
            <div className="w-px bg-primary-500/20 h-8" />
            <div className="flex flex-col gap-1">
              <Bone className="h-8 w-16" />
              <Bone className="h-2.5 w-10" />
            </div>
            <div className="w-px bg-primary-500/20 h-8" />
            <div className="flex flex-col gap-1">
              <Bone className="h-8 w-8" />
              <Bone className="h-2.5 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Expansion groups skeleton */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">
        {[3, 2, 4].map((count, i) => (
          <section key={i}>
            {/* header height matches the real h2 (text-xs), not a taller bar */}
            <BoneLight className="h-4 w-32 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Primary set card — px-5 py-6 around an h-14 logo, so ~104px */}
              <BoneLight className="col-span-1 h-[104px] rounded-xl" />
              {/* Mini-sets — p-4 around an h-8 logo plus a count row, ~96px */}
              {Array.from({ length: count - 1 }).map((_, j) => (
                <BoneLight key={j} className="h-24 rounded-xl" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
