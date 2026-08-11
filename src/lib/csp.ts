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

const CONNECT_ORIGINS = [
  "https://vitals.vercel-insights.com",
  "https://vercel.live",
  "https://api.open-meteo.com",
  "https://api.paulsumido.com",
  "https://ethereum-rpc.publicnode.com",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "wss://relay.walletconnect.org",
  "https://relay.walletconnect.org",
  "https://explorer-api.walletconnect.com",
  "https://api.web3modal.org",
  "https://pulse.walletconnect.org",
];

/**
 * Normalise a media origin to a bare scheme + host, dropping any path or
 * trailing slash, since CSP wants an origin. Returns null for junk or unset.
 */
export function mediaOrigin(raw: string | undefined): string | null {
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
 * Build the CSP header. `media` is the origin serving user-uploaded photos
 * (`NEXT_PUBLIC_MEDIA_ORIGIN`); when it's absent the policy is unchanged, which
 * means saved gallery walls will not render their photos.
 */
export function buildCsp(
  media?: string,
  { dev = false }: { dev?: boolean } = {},
): string {
  const origin = mediaOrigin(media);
  const img = [...IMG_ORIGINS, ...(origin ? [origin] : [])];
  const connect = [...CONNECT_ORIGINS, ...(origin ? [origin] : [])];

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
