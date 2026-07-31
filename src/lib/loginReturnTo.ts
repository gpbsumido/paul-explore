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
 * One-shot cookie that tells the proxy to force a specific OIDC prompt on the
 * very next /auth/login, then it's cleared. Its value is the prompt to force:
 * "login" after a denied consent (re-ask who's logging in), "consent" after a
 * session timeout (re-enter permissions). Without it Auth0 reuses the still-live
 * session and skips straight past those screens.
 */
export const LOGIN_PROMPT_COOKIE = "auth_login_prompt";

/** OIDC prompt values we're willing to force, so a stray cookie can't inject. */
const ALLOWED_PROMPTS = new Set(["login", "consent", "select_account"]);

/** Query params the proxy should add to an /auth/login request. */
export type LoginRedirectAdditions = {
  returnTo?: string;
  prompt?: string;
};

/**
 * Works out what an /auth/login request is missing: a returnTo so the user
 * lands back where they started, and a prompt (from the one-shot cookie) so
 * Auth0 re-asks who's logging in or re-shows the permission screen. Neither is
 * added when the request already carries it, so an explicit param always wins,
 * and the prompt is only honoured for an allow-listed value.
 */
export function loginRedirectAdditions(opts: {
  searchParams: URLSearchParams;
  referer: string | null;
  origin: string;
  promptCookie: string | undefined;
}): LoginRedirectAdditions {
  const additions: LoginRedirectAdditions = {};

  if (!opts.searchParams.has("returnTo")) {
    const returnTo = loginReturnToFromReferer(opts.referer, opts.origin);
    if (returnTo) additions.returnTo = returnTo;
  }

  if (
    opts.promptCookie &&
    ALLOWED_PROMPTS.has(opts.promptCookie) &&
    !opts.searchParams.has("prompt")
  ) {
    additions.prompt = opts.promptCookie;
  }

  return additions;
}
