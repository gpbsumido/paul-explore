/**
 * Session lifetime. The session is rolling, so being on the site and doing
 * things pushes the idle window forward and keeps you signed in. Sit idle for
 * six hours and it expires; come back after that and you're logged out and have
 * to sign in again (and re-grant permissions).
 *
 * With the SDK's rolling sessions the cookie expiry is
 * min(now + inactivityDuration, createdAt + absoluteDuration). Keeping the idle
 * window well under the absolute means each request refreshes it to now + 6h,
 * while the absolute is just an upper bound so a session can't live forever.
 */
export const SESSION_IDLE_SECONDS = 6 * 60 * 60;
export const SESSION_ABSOLUTE_SECONDS = 7 * 24 * 60 * 60;

/** Session config passed to the Auth0 client. */
export const sessionConfig = {
  rolling: true,
  inactivityDuration: SESSION_IDLE_SECONDS,
  absoluteDuration: SESSION_ABSOLUTE_SECONDS,
} as const;

/**
 * A long-lived marker cookie set on every authenticated response. Once the
 * session cookie itself has expired we can no longer tell a timed-out user from
 * one who was never logged in — this marker outlives the session and bridges
 * that gap, so its presence alongside a missing session means "timed out".
 */
export const SESSION_MARKER_COOKIE = "auth_active";

/**
 * The SDK's logout route. Matched exactly rather than by prefix so a path that
 * merely starts with it -- /auth/logout-everywhere -- is not mistaken for it.
 */
const LOGOUT_PATH = "/auth/logout";

/**
 * Whether this request is a deliberate logout.
 *
 * It matters because the marker outlives the session cookie on purpose, and
 * after a logout that is indistinguishable from a session that expired. Left
 * alone, choosing to sign out told you your session had timed out.
 */
export function isLogoutPath(pathname: string): boolean {
  return pathname === LOGOUT_PATH;
}

/** True when the session is gone but the marker says there recently was one. */
export function isSessionTimeout(
  hasSession: boolean,
  markerCookie: string | undefined,
): boolean {
  return !hasSession && Boolean(markerCookie);
}
