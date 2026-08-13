/**
 * Loading shape for /to-do. Matches the real layout closely enough that the
 * page does not jump when the data lands.
 */
export default function TodoSkeleton() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12" aria-busy="true">
      <div className="h-8 w-32 animate-pulse rounded bg-surface" />
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-16 animate-pulse rounded bg-surface" />
        <div className="h-5 w-16 animate-pulse rounded bg-surface" />
      </div>
      {[0, 1].map((section) => (
        <section key={section} className="mt-8">
          <div className="h-6 w-48 animate-pulse rounded bg-surface" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-surface" />
          <ul className="mt-4 space-y-3">
            {[0, 1, 2].map((row) => (
              <li
                key={row}
                className="h-20 animate-pulse rounded border border-border bg-surface"
              />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
