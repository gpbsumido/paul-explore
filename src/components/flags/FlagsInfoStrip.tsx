"use client";

interface FlagsInfoStripProps {
  /** Whether the visitor is signed in and may change flags. */
  isLoggedIn: boolean;
  /** Whether they are on the server's flag-admin allowlist. */
  isFlagAdmin: boolean;
  /** How long until the next reset, e.g. "2h 14m", from formatResetCountdown. */
  resetLabel: string;
}

/**
 * The honest status line above the console: the flags are stored in a live API
 * and evaluated by a deterministic engine, and the demo resets on a fixed
 * cadence.
 *
 * It states the three access rungs up front rather than leaving someone to
 * discover them by clicking a switch that does not move. Who the viewer is
 * decides which sentence follows.
 */
export default function FlagsInfoStrip({
  isLoggedIn,
  isFlagAdmin,
  resetLabel,
}: FlagsInfoStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-surface-raised/60 px-3 py-2 text-[13px] text-muted">
      <span className="paul-touch-min inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-medium text-success-700 dark:bg-success-950/50 dark:text-success-400">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success-500" />
        Backed by a live API
      </span>
      <span>
        Flags are stored in a live API (<code>portfolio_api</code>) and
        evaluated by a deterministic engine. Resets in {resetLabel}.
      </span>
      <span>
        Flags sit in three groups by who may change them: open to everyone,
        signed-in visitors, and site owner only.
      </span>
      {!isLoggedIn ? (
        <span>
          You can change the open ones right now —{" "}
          <a
            href="/auth/login"
            className="font-medium text-primary-600 underline-offset-2 hover:underline dark:text-primary-400"
          >
            sign in
          </a>{" "}
          for the rest.
        </span>
      ) : isFlagAdmin ? (
        <span>You&rsquo;re an admin here, so every group is yours to change.</span>
      ) : (
        <span>
          You&rsquo;re signed in, so the first two groups are yours to change.
          The last one gates live features.
        </span>
      )}
    </div>
  );
}
