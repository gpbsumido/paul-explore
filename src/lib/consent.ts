// Cookie-consent for the one non-essential cookie the site sets (visitor_id).
// The consent choice itself is recorded in a first-party cookie, which is
// strictly necessary (it remembers the visitor's decision) and so needs no
// consent of its own.

/** The cookie holding the visitor's consent choice. */
export const CONSENT_COOKIE = "cookie_consent";

/** Stored when the visitor accepts the functional cookie. */
export const CONSENT_ACCEPTED = "accepted";

/** Stored when the visitor declines it. */
export const CONSENT_DECLINED = "declined";

export type ConsentValue = typeof CONSENT_ACCEPTED | typeof CONSENT_DECLINED;

/** How long the consent choice is remembered — a year, matching visitor_id. */
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Whether the stored value is an explicit acceptance. Anything else — declined,
 * absent, empty, or a near-miss — is treated as "not accepted", so a
 * non-essential cookie is only ever set on a clear yes.
 */
export function hasAcceptedConsent(value: string | undefined | null): boolean {
  return value === CONSENT_ACCEPTED;
}
