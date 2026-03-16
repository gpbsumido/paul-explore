export default function MotionLabLoading() {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      {/* Page header skeleton */}
      <div className="mx-auto mb-10 max-w-4xl space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-white/6" />
      </div>

      {/* 6 demo section skeletons */}
      <div className="mx-auto max-w-4xl space-y-6">
        {/* SpringPlayground — tall (controls + arena) */}
        <div
          className="animate-pulse rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            height: "22rem",
          }}
        />

        {/* StaggerGrid — medium */}
        <div
          className="animate-pulse rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            height: "18rem",
          }}
        />

        {/* ReorderList — medium */}
        <div
          className="animate-pulse rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            height: "18rem",
          }}
        />

        {/* ScrollParallax — shorter */}
        <div
          className="animate-pulse rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            height: "16rem",
          }}
        />

        {/* GestureCard — medium */}
        <div
          className="animate-pulse rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            height: "18rem",
          }}
        />

        {/* SharedLayout — tall (3-column grid + expanded overlay space) */}
        <div
          className="animate-pulse rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            height: "22rem",
          }}
        />
      </div>
    </div>
  );
}
