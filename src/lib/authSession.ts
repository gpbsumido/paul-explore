/**
 * How long an authenticated session lives before the user is logged out and has
 * to sign in again. A hard six-hour cap measured from login.
 *
 * With the SDK's rolling sessions the cookie's expiry is
 * min(now + inactivityDuration, createdAt + absoluteDuration), so pinning both
 * windows to the same six hours means the session always expires at login + 6h
 * whether or not the user stays active. Come back after six hours and the
 * cookie is gone, so getSession() returns nothing and the login flow starts
 * over.
 */
export const SESSION_DURATION_SECONDS = 6 * 60 * 60;

/** Session config passed to the Auth0 client. */
export const sessionConfig = {
  rolling: true,
  absoluteDuration: SESSION_DURATION_SECONDS,
  inactivityDuration: SESSION_DURATION_SECONDS,
} as const;
