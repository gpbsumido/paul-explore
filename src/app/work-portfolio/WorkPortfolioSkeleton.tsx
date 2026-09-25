/**
 * Stands in for the remote while it loads: both tickers and the stage, in the
 * same flex boxes the mounted portfolio uses, so nothing jumps when it swaps in.
 */
export default function WorkPortfolioSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-label="Loading the work portfolio">
      <div className="h-10 animate-pulse bg-surface/30" />
      <div className="flex min-h-0 flex-1 items-center gap-1 px-1 py-1.5">
        <div className="h-full w-full animate-pulse rounded-xl border border-border bg-surface/40" />
      </div>
      <div className="h-10 animate-pulse bg-surface/30" />
    </div>
  );
}
