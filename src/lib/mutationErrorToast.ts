import { toast } from "@paul-portfolio/react";
import { userFacingErrorMessage } from "@/lib/userFacingError";

/**
 * The app's global handler for a failed write (mutation): surface the error as a
 * toast so no API failure is silent, wherever it happens. The app's mutations
 * throw an Error carrying the backend's own message ("You already have an active
 * season wallet"), so that's what a person sees. Anything without a usable
 * message, and anything that is really a diagnostic (a schema failure, a
 * rejected fetch), shows a plain apology instead; see userFacingErrorMessage.
 *
 * A screen that shows its own error inline can opt out with `meta: { silent: true }`
 * on the mutation, so it isn't double-reported.
 */
export function notifyMutationError(
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  if (meta?.silent) return;
  toast.error(
    userFacingErrorMessage(error, "Something went wrong. Please try again."),
  );
}

/**
 * The rejection handler for a caller that awaits a mutation but has nothing of
 * its own to do when it fails. notifyMutationError above has already shown the
 * toast, so the failure is handled; naming that here beats a bare `catch` that
 * reads like an error being swallowed, and beats leaving the promise rejected
 * with nobody listening.
 */
export function failureAlreadyToasted(): void {}
