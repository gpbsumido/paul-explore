import { cookies } from "next/headers";

import { VISITOR_COOKIE } from "@/lib/visitor";

/** The header carrying the visitor id to portfolio_api. */
export const VISITOR_HEADER = "x-operator-visitor";

/**
 * The current browser's visitor id, or null outside a request.
 *
 * This deliberately reuses the app-wide `visitor_id` cookie the proxy already
 * mints on first contact rather than issuing an operator-specific one. A second
 * cookie would have meant two ids for one browser, two lifetimes to keep in
 * step, and a second thing to explain -- for no gain, since what the API needs
 * is a stable way to tell visitors apart and this already is one.
 *
 * What it buys the API: every operator request arrives there server-side from
 * this app, so an IP-keyed rate limit put the whole world in one bucket, and
 * the restock audit trail recorded the same hardcoded actor for everybody. A
 * pseudonymous id fixes both without asking anyone to sign in.
 *
 * Deliberately not an identity. Clearing the cookie makes you a stranger, so it
 * cannot carry a security decision -- that is the service token's job. This
 * only has to tell honest visitors apart, which is all a fairness limit needs.
 *
 * Returns null rather than throwing outside a request context, so unit tests
 * and any non-request caller keep working without a Next mock.
 */
export async function readVisitorId(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(VISITOR_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}
