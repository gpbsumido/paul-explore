/**
 * Works out where a login should send the user back to, from the page they
 * clicked "Log in" on. The login links across the app all point at a bare
 * /auth/login with no returnTo, so without this the SDK defaults the post-login
 * redirect to "/" and you always land on the home page. The proxy calls this
 * with the request's Referer to fill in a returnTo before handing off to Auth0.
 *
 * Only same-origin paths are honoured, so a spoofed Referer can't turn login
 * into an open redirect. Auth referers are dropped so we never loop back into
 * the auth routes, and the bare root is dropped because it's the SDK default
 * anyway.
 *
 * @param referer the incoming request's Referer header, or null
 * @param appOrigin this app's own origin, e.g. https://paulsumido.com
 * @returns a same-origin path (with query) to return to, or null
 */
export function loginReturnToFromReferer(
  referer: string | null,
  appOrigin: string,
): string | null {
  if (!referer) return null;

  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return null;
  }

  if (url.origin !== appOrigin) return null;
  if (url.pathname.startsWith("/auth/")) return null;
  if (url.pathname === "/") return null;

  return `${url.pathname}${url.search}`;
}
