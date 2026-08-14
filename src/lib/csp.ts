/**
 * The Content Security Policy, built here rather than inlined so the one part
 * that varies by environment -- where user media is served from -- is testable
 * and can be set without a code change.
 *
 * Saved gallery walls store their photos in S3 and render them straight from
 * the CDN, so that origin has to be in `img-src` or the browser silently blocks
 * every photo and the wall renders blank.
 */

/** Origins allowed to serve images, beyond the app's own. */
const IMG_ORIGINS = [
  "https://assets.tcgdex.net",
  "https://raw.githubusercontent.com",
  "https://a.espncdn.com",
  "https://explorer-api.walletconnect.com",
];

/**
 * Third-party origins the browser talks to. portfolio_api is deliberately not
 * in here: it moves with NEXT_PUBLIC_API_URL, so it is passed in instead.
 */
const CONNECT_ORIGINS = [
  "https://vitals.vercel-insights.com",
  "https://vercel.live",
  "https://api.open-meteo.com",
  "https://ethereum-rpc.publicnode.com",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "wss://relay.walletconnect.org",
  "https://relay.walletconnect.org",
  "https://explorer-api.walletconnect.com",
  "https://api.web3modal.org",
  "https://pulse.walletconnect.org",
  // World presence. Without these the Ably socket is blocked by our own CSP,
  // which would have meant shipping the credential and getting none of the
  // feature -- the failure would have looked like presence simply not working.
  "wss://realtime.ably.io",
  "https://rest.ably.io",
];

/**
 * Normalise a URL to a bare scheme + host, dropping any path or trailing
 * slash, since CSP wants an origin. Returns null for junk or unset.
 */
export function toOrigin(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

/**
 * Build the CSP header.
 *
 * `media` is the origin serving user-uploaded photos
 * (`NEXT_PUBLIC_MEDIA_ORIGIN`); when it's absent the policy is unchanged, which
 * means saved gallery walls will not render their photos.
 *
 * `apiUrl` is where portfolio_api lives (`NEXT_PUBLIC_API_URL`). The browser
 * calls it directly for the referral-links demo, so it has to be in
 * connect-src. It used to be the production hostname written in here, which
 * meant that demo was blocked by our own CSP on every local checkout, since
 * the README points you at localhost:3001. Following the same variable the app
 * fetches from keeps the policy allowing exactly where the app actually goes.
 */
export function buildCsp(
  media?: string,
  { dev = false, apiUrl }: { dev?: boolean; apiUrl?: string } = {},
): string {
  const origin = toOrigin(media);
  const api = toOrigin(apiUrl);
  const img = [...IMG_ORIGINS, ...(origin ? [origin] : [])];
  const connect = [
    ...CONNECT_ORIGINS,
    ...(origin ? [origin] : []),
    ...(api ? [api] : []),
  ];

  // React's development build calls eval() to rebuild callstacks that crossed
  // the server/client boundary, so without this the dev overlay throws instead
  // of showing the error you were trying to read. React never calls eval() in
  // production, so this stays off there rather than being a permanent hole.
  // 'wasm-unsafe-eval' is separate and needed in both: it is the Draco decoder
  // for the landing page's 3D models.
  const evalSource = dev ? ` 'unsafe-eval'` : "";

  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${evalSource} https://vercel.live https://va.vercel-scripts.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: ${img.join(" ")}`,
    `font-src 'self'`,
    `connect-src 'self' blob: ${connect.join(" ")}`,
    // 'self' lets the résumé page embed its own PDF in an iframe; frame-ancestors
    // below still stops anyone else from framing us.
    `frame-src 'self' https://vercel.live https://verify.walletconnect.org https://verify.walletconnect.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // 'self' (not 'none') so the résumé page can frame its own PDF; cross-origin
    // framing -- the actual clickjacking risk -- is still blocked.
    `frame-ancestors 'self'`,
  ].join("; ");
}
