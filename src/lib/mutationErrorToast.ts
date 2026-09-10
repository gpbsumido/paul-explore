import { toast } from "@paul-portfolio/react";

/**
 * The app's global handler for a failed write (mutation): surface the error as a
 * toast so no API failure is silent, wherever it happens. The app's mutations
 * throw an Error carrying the backend's own message ("You already have an active
 * season wallet"), so that's what a person sees; anything without a usable
 * message falls back to a plain apology.
 *
 * A screen that shows its own error inline can opt out with `meta: { silent: true }`
 * on the mutation, so it isn't double-reported.
 */
export function notifyMutationError(
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  if (meta?.silent) return;
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Something went wrong. Please try again.";
  toast.error(message);
}
