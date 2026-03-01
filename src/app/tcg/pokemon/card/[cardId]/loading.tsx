import ThemeToggle from "@/components/ThemeToggle";

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}

export default function CardDetailLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-20 h-14 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
          <Bone className="h-4 w-20" />
          <div className="h-4 w-px bg-border" />
          <Bone className="h-4 w-36" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Card image placeholder */}
          <div className="lg:sticky lg:top-20 lg:self-start flex justify-center shrink-0">
            <div
              className="w-72 lg:w-80 rounded-2xl bg-surface animate-pulse"
              style={{ aspectRatio: "2.5/3.5" }}
            />
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Name + HP */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <Bone className="h-10 w-56" />
                <Bone className="h-8 w-16 shrink-0" />
              </div>

              {/* Type pills */}
              <div className="flex gap-2">
                <Bone className="h-6 w-16" />
                <Bone className="h-6 w-16" />
              </div>
            </div>

            {/* Meta grid */}
            <div className="rounded-xl border border-border bg-surface p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <Bone className="h-2.5 w-16" />
                  <Bone className="h-[14px] w-24" />
                </div>
              ))}
            </div>

            {/* Abilities section */}
            <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
              <Bone className="h-2.5 w-20" />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Bone className="h-5 w-16" />
                  <Bone className="h-4 w-28" />
                </div>
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-4/5" />
              </div>
            </div>

            {/* Attacks section */}
            <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
              <Bone className="h-2.5 w-16" />
              {[1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bone className="h-4 w-10" />
                      <Bone className="h-4 w-28" />
                    </div>
                    <Bone className="h-6 w-10 shrink-0" />
                  </div>
                  <Bone className="h-3 w-3/4" />
                </div>
              ))}
            </div>

            {/* Legality badges */}
            <div className="flex gap-2 pt-1">
              <Bone className="h-7 w-24" />
              <Bone className="h-7 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
