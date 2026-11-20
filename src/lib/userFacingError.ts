/** What to say when a request never reached the server (fetch rejected). */
export const CONNECTION_ERROR_MESSAGE =
  "Couldn't reach the server. Check your connection and try again.";

/**
 * A failed zod parse, checked by name rather than with `instanceof ZodError`.
 * The toast and every query error read this file, so importing zod here put it
 * in the shared chunk on every page and over the bundle budget.
 */
function isSchemaFailure(error: unknown): boolean {
  return error instanceof Error && error.name === "ZodError";
}

/**
 * Turns a thrown value into a sentence a person can read.
 *
 * Most errors in this app are `new Error("...")` with a message somebody wrote
 * for the screen ("You already have an active season wallet"), and those pass
 * through. A few are really diagnostics: a `ZodError` carries a JSON dump of
 * the schema issues, a `SyntaxError` quotes the HTML an error page sent where
 * JSON was expected, and a `TypeError` is what a rejected `fetch` throws. None
 * of those mean anything to the person who clicked, and they describe how the
 * code is built. They go to the console with the original error and the caller's
 * fallback is shown instead.
 */
export function userFacingErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    console.error("[request failed]", error);
    return CONNECTION_ERROR_MESSAGE;
  }
  if (isSchemaFailure(error) || error instanceof SyntaxError) {
    console.error("[unexpected response]", error);
    return fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
