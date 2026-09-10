"use client";

/**
 * A failed lobby fetch, said out loud with a way back.
 *
 * The board, leaderboard and profile each poll a backend that can blip. Left as
 * a bare "unavailable" line, a transient failure stranded the reader — their
 * only move was a full reload. This states what failed, shows the server's own
 * reason when it gave one worth showing, and offers the retry that fixes the
 * common case without leaving the page.
 */
export default function QueryError({
  message,
  detail,
  onRetry,
}: {
  /** What couldn't load, in plain words: "The board is unavailable right now." */
  message: string;
  /** The server's own message, when it's worth surfacing. */
  detail?: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-6 rounded-2xl border border-border bg-surface/50 p-5"
    >
      <p className="text-sm text-error-600 dark:text-error-300">{message}</p>
      {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-colors hover:border-primary-500/50 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
      >
        Try again
      </button>
    </div>
  );
}
