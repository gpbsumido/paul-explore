/**
 * Auth0 post-login Action: one account per verified email.
 *
 * Every feature on the site keys its data by the Auth0 `sub`, and each login
 * method is its own Auth0 connection. Sign in with Google on one device and
 * with email and password on another, and you're two users who happen to
 * share an email, with your calendar and bets on only one of them. This links
 * them into a single user at login, so every method gets the same `sub`.
 *
 * Only verified emails link. If an unverified match counted, anyone could sign
 * up with your address and a password and land in your account. And only
 * connections I trust to verify email take part, so a provider added later
 * can't vouch for an address it never checked.
 *
 * Deploying it (none of this lives in the repo):
 * 1. Applications: a Machine to Machine app authorized for the Auth0
 *    Management API with `read:users` and `update:users`.
 * 2. Actions > Library > Build custom: Login / Post Login, paste this file.
 * 3. Secrets: AUTH0_DOMAIN (the tenant's own *.auth0.com domain, not a custom
 *    domain), MGMT_CLIENT_ID and MGMT_CLIENT_SECRET from step 1.
 * 4. Deploy, then put it first in the post-login flow, ahead of the Action
 *    that adds the email claims.
 */

/** Connections whose `email_verified` I trust enough to link on. */
const TRUSTED_CONNECTIONS = ["google-oauth2", "Username-Password-Authentication"];

const TOKEN_CACHE_KEY = "management-api-token";

/**
 * True when every identity on the user comes through a trusted connection.
 *
 * @param {{ identities: { connection: string }[] }} user
 * @returns {boolean}
 */
const isTrusted = (user) =>
  user.identities.every((identity) =>
    TRUSTED_CONNECTIONS.includes(identity.connection),
  );

/**
 * The user the others get linked into. The one with the most logins is the
 * one actually in use, so it's the one holding the data; ties go to the
 * oldest.
 *
 * @template {{ logins_count: number, created_at: string }} U
 * @param {U[]} users
 * @returns {U}
 */
const pickPrimary = (users) =>
  [...users].sort(
    (a, b) =>
      b.logins_count - a.logins_count ||
      Date.parse(a.created_at) - Date.parse(b.created_at),
  )[0];

/**
 * A Management API token, from the Action cache when there is one. Every login
 * runs this, and asking for a fresh token each time would burn through the
 * tenant's machine-to-machine token quota.
 *
 * @param {Record<string, string>} secrets
 * @param {{ cache: { get(key: string): { value: string } | undefined, set(key: string, value: string, options?: { ttl?: number }): unknown } }} api
 * @returns {Promise<string>}
 */
async function managementToken(secrets, api) {
  const cached = api.cache.get(TOKEN_CACHE_KEY);
  if (cached) return cached.value;

  const res = await fetch(`https://${secrets.AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: secrets.MGMT_CLIENT_ID,
      client_secret: secrets.MGMT_CLIENT_SECRET,
      audience: `https://${secrets.AUTH0_DOMAIN}/api/v2/`,
    }),
  });
  if (!res.ok) throw new Error(`token request failed with ${res.status}`);
  const { access_token, expires_in } = await res.json();
  // Drop it a minute early so a cached token never gets used as it expires.
  api.cache.set(TOKEN_CACHE_KEY, access_token, {
    ttl: Math.max(0, expires_in - 60) * 1000,
  });
  return access_token;
}

/**
 * One Management API call, throwing on anything but a 2xx.
 *
 * @param {Record<string, string>} secrets
 * @param {string} token
 * @param {string} path
 * @param {{ method?: string, body?: string }} [init]
 * @returns {Promise<any>}
 */
async function management(secrets, token, path, init = {}) {
  const res = await fetch(`https://${secrets.AUTH0_DOMAIN}/api/v2${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed with ${res.status}`);
  }
  return res.json();
}

/**
 * @param {{
 *   user: { user_id: string, email?: string, email_verified?: boolean },
 *   connection: { name: string },
 *   secrets: Record<string, string>,
 * }} event
 * @param {{
 *   cache: { get(key: string): { value: string } | undefined, set(key: string, value: string, options?: { ttl?: number }): unknown },
 *   authentication: { setPrimaryUser(userId: string): void },
 * }} api
 * @returns {Promise<void>}
 */
exports.onExecutePostLogin = async (event, api) => {
  const { email, email_verified: emailVerified, user_id: userId } = event.user;
  if (!email || emailVerified !== true) return;
  if (!TRUSTED_CONNECTIONS.includes(event.connection.name)) return;

  try {
    const token = await managementToken(event.secrets, api);
    // Auth0 stores emails lowercased and this lookup is case-sensitive.
    const users = await management(
      event.secrets,
      token,
      `/users-by-email?email=${encodeURIComponent(email.toLowerCase())}`,
    );
    const candidates = users.filter(
      (user) => user.email_verified === true && isTrusted(user),
    );
    if (
      candidates.length < 2 ||
      !candidates.some((user) => user.user_id === userId)
    ) {
      return;
    }

    const primary = pickPrimary(candidates);
    // A user that already has identities linked into it is a primary itself,
    // and Auth0 won't nest one primary inside another.
    const secondaries = candidates.filter(
      (user) => user.user_id !== primary.user_id && user.identities.length === 1,
    );
    for (const secondary of secondaries) {
      const [identity] = secondary.identities;
      await management(
        event.secrets,
        token,
        `/users/${encodeURIComponent(primary.user_id)}/identities`,
        {
          method: "POST",
          body: JSON.stringify({
            provider: identity.provider,
            user_id: identity.user_id,
          }),
        },
      );
      // The user this login started as no longer exists on its own, so the
      // tokens have to be issued for the primary or the login fails.
      if (secondary.user_id === userId) {
        api.authentication.setPrimaryUser(primary.user_id);
      }
    }
  } catch (err) {
    // Linking is a nicety, never a reason to fail someone's login.
    console.log(
      `account linking skipped: ${err instanceof Error ? err.message : err}`,
    );
  }
};
