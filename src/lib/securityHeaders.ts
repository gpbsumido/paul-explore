/**
 * Static security response headers, applied to every route via next.config.ts
 * `headers()`. Kept here rather than inlined so the set is testable and lives
 * next to its sibling policy code in src/lib/csp.ts.
 *
 * These are the belt-and-suspenders headers a CSP does NOT cover. The dynamic
 * Content-Security-Policy is set per-response in src/proxy.ts (it depends on the
 * media origin); framing and object embedding are already handled there by
 * `frame-ancestors 'self'` and `object-src 'none'`, so X-Frame-Options would
 * only restate a weaker version and is deliberately left out. HSTS is added by
 * Vercel by default, so it is not repeated here either.
 */

/** A single `key: value` header, matching the shape next.config `headers()` wants. */
export type HttpHeader = { key: string; value: string };

/**
 * The static headers to apply site-wide.
 *
 * - `X-Content-Type-Options: nosniff` stops a browser from second-guessing a
 *   response's declared content type, which is how a served asset gets coerced
 *   into executing as script.
 * - `Referrer-Policy: strict-origin-when-cross-origin` sends the full path to
 *   our own origin but only the bare origin to third parties, so outbound links
 *   never leak the page someone was on.
 * - `Permissions-Policy` denies camera, microphone, and geolocation outright:
 *   nothing in the app uses those browser APIs, so the safe default is off.
 */
export function securityHeaders(): HttpHeader[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    // Vercel sets this for custom domains, so today this is belt and braces.
    // Nothing in the repo asserts it though, and a deploy anywhere else would
    // lose it silently -- which is the kind of protection you only notice is
    // missing after it mattered.
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
  ];
}
