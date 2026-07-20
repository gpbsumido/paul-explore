/** Loading state while a demo chunk streams in. Matches the stage box. */
export default function DemoSkeleton() {
  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-6">
      <div className="h-4 w-40 animate-pulse rounded bg-surface" />
      <div className="flex-1 animate-pulse rounded-lg bg-surface" />
      <div className="h-3 w-56 animate-pulse rounded bg-surface" />
    </div>
  );
}
