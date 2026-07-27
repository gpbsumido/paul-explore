"use client";

interface FlagsInfoStripProps {
  /** Whether the visitor is signed in and may change flags. */
  isLoggedIn: boolean;
  /** How long until the next reset, e.g. "2h 14m", from formatResetCountdown. */
  resetLabel: string;
}

/**
 * The honest status line above the console: the flags are stored in a live API
 * and evaluated by a deterministic engine, the demo flags are open to everyone
 * while the one real flag needs a sign-in, and the demo resets on a fixed
 * cadence. It replaces the old "demo data" framing now that the store is really
 * persisted in portfolio_api.
 */
export default function FlagsInfoStrip({
  isLoggedIn,
  resetLabel,
}: FlagsInfoStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-surface-raised/60 px-3 py-2 text-[13px] text-muted">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-medium text-success-700 dark:bg-success-950/50 dark:text-success-400">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success-500" />
        Backed by a live API
      </span>
      <span>
        Flags are stored in a live API (<code>portfolio_api</code>) and evaluated
        by a deterministic engine. Resets in {resetLabel}.
      </span>
      {!isLoggedIn && (
        <span>
          Demo flags are open to everyone —{" "}
          <a
            href="/auth/login"
            className="font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
          >
            sign in to change the real flag
          </a>
          .
        </span>
      )}
    </div>
  );
}
