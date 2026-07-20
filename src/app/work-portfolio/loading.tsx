/**
 * Route skeleton for /work-portfolio. Mirrors the header-ticker-stage-ticker
 * layout so the loaded page lands without shift.
 */
export default function WorkPortfolioLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="h-14 w-full border-b border-border bg-background" />
      <div className="h-14 w-full animate-pulse border-b border-border bg-surface/50" />
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-4xl flex-col items-center gap-3">
          <div className="h-3 w-28 animate-pulse rounded bg-surface" />
          <div className="h-10 w-72 animate-pulse rounded bg-surface" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="h-14 w-full animate-pulse border-t border-border bg-surface/50" />
    </div>
  );
}
