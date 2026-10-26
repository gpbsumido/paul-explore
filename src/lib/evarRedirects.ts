/**
 * EVAR Sizing moved to its own project at medical.paulsumido.com, where the
 * routes drop the /evar prefix: the welcome page is the homepage and the
 * practice is /practice. Applied in next.config.ts `redirects()`, so an old
 * link never reaches a page here.
 */

const MEDICAL = "https://medical.paulsumido.com";

/** A redirect, in the shape next.config `redirects()` wants. */
export type MovedRoute = { source: string; destination: string; permanent: boolean };

/**
 * Every /evar path to its page on the new domain. First match wins, so the
 * two pages that changed name come before the catch-all that keeps the path.
 */
export function evarRedirects(): MovedRoute[] {
  return [
    { source: "/evar", destination: `${MEDICAL}/practice`, permanent: true },
    { source: "/evar/welcome", destination: `${MEDICAL}/`, permanent: true },
    { source: "/evar/:path*", destination: `${MEDICAL}/:path*`, permanent: true },
  ];
}
