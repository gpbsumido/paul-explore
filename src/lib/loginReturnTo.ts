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

/**
 * One-shot cookie set when a login is declined at the consent screen. Its
 * presence tells the proxy to force a fresh "who's logging in" prompt on the
 * very next /auth/login, then it's cleared. Without it Auth0 reuses the still-
 * live session and jumps straight back to the permission screen.
 */
export const REAUTH_COOKIE = "auth_reauth";

/** Query params the proxy should add to an /auth/login request. */
export type LoginRedirectAdditions = {
  returnTo?: string;
  prompt?: string;
};

/**
 * Works out what an /auth/login request is missing: a returnTo so the user
 * lands back where they started, and a prompt=login after a denied consent so
 * Auth0 asks who's logging in again instead of silently reusing the session.
 * Neither is added when the request already carries it, so an explicit param
 * always wins.
 */
export function loginRedirectAdditions(opts: {
  searchParams: URLSearchParams;
  referer: string | null;
  origin: string;
  reauthCookie: string | undefined;
}): LoginRedirectAdditions {
  const additions: LoginRedirectAdditions = {};

  if (!opts.searchParams.has("returnTo")) {
    const returnTo = loginReturnToFromReferer(opts.referer, opts.origin);
    if (returnTo) additions.returnTo = returnTo;
  }

  if (opts.reauthCookie && !opts.searchParams.has("prompt")) {
    additions.prompt = "login";
  }

  return additions;
}
