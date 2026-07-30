/**
 * Helpers for the Auth0 callback. Kept as pure functions here so they can be
 * unit tested without pulling next/server and the whole Auth0 client into the
 * test, which auth0.ts does.
 */

const ACCESS_DENIED = "access_denied";

/** Reads a string `code` off an unknown value, or undefined if it hasn't one. */
function readCode(value: unknown): string | undefined {
  if (value && typeof value === "object" && "code" in value) {
    const code = (value as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

/**
 * True when a callback error is the user declining the Auth0 consent screen.
 * Auth0 hands onCallback an AuthorizationError whose cause is an OAuth2Error
 * carrying the access_denied code, so we check both the error and its cause.
 * Everything else (misconfig, network, token exchange) is left to 500 so real
 * failures stay visible.
 */
export function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (readCode(error) === ACCESS_DENIED) return true;
  return readCode((error as { cause?: unknown }).cause) === ACCESS_DENIED;
}

/**
 * Builds the absolute URL to send someone back to after they decline consent:
 * the page they started on, flagged so AuthErrorToast knows to explain why they
 * bounced. Falls back to the root when there's no returnTo.
 *
 * @param returnTo the path the login flow captured, if any
 * @param baseUrl the app's base URL, e.g. https://paulsumido.com
 */
export function permissionDeniedReturnTo(
  returnTo: string | undefined | null,
  baseUrl: string,
): string {
  const dest = new URL(returnTo || "/", baseUrl);
  dest.searchParams.set("authError", "permissions");
  return dest.toString();
}
