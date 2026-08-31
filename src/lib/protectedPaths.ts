/**
 * Top-level routes that require a valid session. The proxy redirects
 * unauthenticated requests to these straight to login (with returnTo).
 *
 * Web Vitals (`/vitals`) is deliberately absent: the dashboard shows
 * site-wide, non-personal aggregate metrics and is public. Keep it that way —
 * gating it is the bug this list exists to prevent regressing.
 *
 * `/to-do` is here so a signed-out visitor lands on login with a returnTo
 * rather than a bare 404. Being signed in is not enough to see it, though: the
 * page itself 404s anyone who is not on the admin allowlist.
 */
const SESSION_PROTECTED_PREFIXES = [
  "/settings",
  "/calendar",
  "/to-do",
  // Organizer surfaces. `/check-in` itself stays public: a volunteer arriving
  // from a poster link should see what the page is for and a sign-in button,
  // not a redirect they cannot place.
  "/check-in/sites",
  "/check-in/display",
] as const;

/** True when a request path must be behind a login. */
export function isSessionProtectedPath(pathname: string): boolean {
  return SESSION_PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}
