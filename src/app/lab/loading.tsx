export default function LabLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="h-8 w-40 rounded-lg bg-surface animate-pulse" />
      <div className="mt-4 h-4 w-64 rounded bg-surface animate-pulse" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-surface animate-pulse" />
        ))}
      </div>
    </div>
  );
}
