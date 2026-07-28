// A stable, anonymous per-visitor identity. Set once as a first-party cookie in
// middleware, it gives server-side flag evaluation a fixed key so a percentage
// rollout lands the same visitor in the same bucket on every request.

/** The first-party cookie holding the visitor's stable key. */
export const VISITOR_COOKIE = "visitor_id";

/** A year, so a visitor's rollout bucket does not drift between visits. */
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Mints a fresh, opaque visitor id. Anonymous — it identifies a browser, not a person. */
export function newVisitorId(): string {
  return crypto.randomUUID();
}
