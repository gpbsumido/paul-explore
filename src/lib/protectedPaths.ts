/**
 * Top-level routes that require a valid session. The proxy redirects
 * unauthenticated requests to these straight to login (with returnTo).
 *
 * Web Vitals (`/vitals`) is deliberately absent: the dashboard shows
 * site-wide, non-personal aggregate metrics and is public. Keep it that way —
 * gating it is the bug this list exists to prevent regressing.
 */
const SESSION_PROTECTED_PREFIXES = ["/settings", "/calendar"] as const;

/** True when a request path must be behind a login. */
export function isSessionProtectedPath(pathname: string): boolean {
  return SESSION_PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}
