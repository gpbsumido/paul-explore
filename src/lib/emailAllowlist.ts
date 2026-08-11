/**
 * Shared email allowlist for the handful of routes that only a named person
 * should reach — the research ask box (which spends real money) and flag writes
 * (which change what every visitor sees).
 *
 * Kept in config rather than source on purpose: this repo is public, and
 * committing a personal address publishes it to every scraper that walks
 * GitHub, permanently, since it stays in history even after a later removal.
 *
 * Unset means nobody, not everybody. An access list that silently opens up when
 * it is misconfigured is worse than one that locks you out, because only one of
 * those two failures is noisy enough to notice.
 */

/**
 * Splits a comma-separated allowlist into normalised addresses.
 *
 * @param raw - The env var value, e.g. "Ada@Example.com, grace@example.com".
 * @returns Lowercased, trimmed addresses; empty when unset or blank.
 */
export function parseAllowlist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Whether a session's email may use a gated route.
 *
 * The verification check is the point: an email claim is only as trustworthy as
 * the provider's verification of it. An unverified address can be typed in by
 * anyone at signup, so treating it as identity would make the allowlist
 * decorative.
 *
 * @param options.email - The email claim from the session, if any.
 * @param options.emailVerified - Whether the provider verified that address.
 * @param options.allowlist - Raw comma-separated env var value.
 * @returns True only for a verified address that appears on the list.
 */
export function isAllowedEmail({
  email,
  emailVerified,
  allowlist,
}: {
  email: string | undefined;
  emailVerified: boolean;
  allowlist: string | undefined;
}): boolean {
  if (!email || !emailVerified) return false;
  return parseAllowlist(allowlist).includes(email.trim().toLowerCase());
}
