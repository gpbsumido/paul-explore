import { cookies } from "next/headers";

export const VISITOR_COOKIE = "operator_visitor";
export const VISITOR_HEADER = "x-operator-visitor";

/**
 * A stable, meaningless id for one browser.
 *
 * It exists so the API can tell two visitors apart. Every operator request
 * reaches it server-side from this app, so an IP-keyed rate limit put the whole
 * world in one bucket and the audit trail recorded the same hardcoded actor for
 * everybody. A pseudonymous id fixes both without asking anyone to sign in.
 *
 * Deliberately not an identity. Clearing the cookie makes you a stranger, so it
 * cannot carry a security decision -- that is the service token's job, and the
 * service token is what keeps this from being forgeable by anyone outside the
 * app. This only has to tell honest visitors apart, which is all a fairness
 * limit needs.
 *
 * Nothing derived from the person goes into it. No fingerprinting, no IP hash,
 * no name: a random value the server issues and the server reads.
 */
export function newVisitorId(): string {
  return `v_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

/**
 * The current browser's visitor id, or null outside a request.
 *
 * Returns null rather than throwing when there is no request context, so unit
 * tests and any non-request caller keep working without a Next mock.
 */
export async function readVisitorId(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(VISITOR_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}
