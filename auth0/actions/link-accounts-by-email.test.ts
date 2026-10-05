import { describe, it, expect, vi, afterEach } from "vitest";
import { onExecutePostLogin } from "./link-accounts-by-email.js";

const DOMAIN = "tenant.example.auth0.com";
const EMAIL = "paul@example.com";

type Identity = { provider: string; user_id: string; connection: string };
type Auth0User = {
  user_id: string;
  email: string;
  email_verified: boolean;
  logins_count: number;
  created_at: string;
  identities: Identity[];
};

const googleUser = (overrides: Partial<Auth0User> = {}): Auth0User => ({
  user_id: "google-oauth2|100",
  email: EMAIL,
  email_verified: true,
  logins_count: 120,
  created_at: "2025-01-10T00:00:00.000Z",
  identities: [
    { provider: "google-oauth2", user_id: "100", connection: "google-oauth2" },
  ],
  ...overrides,
});

const passwordUser = (overrides: Partial<Auth0User> = {}): Auth0User => ({
  user_id: "auth0|abc",
  email: EMAIL,
  email_verified: true,
  logins_count: 3,
  created_at: "2025-05-01T00:00:00.000Z",
  identities: [
    {
      provider: "auth0",
      user_id: "abc",
      connection: "Username-Password-Authentication",
    },
  ],
  ...overrides,
});

const githubUser = (): Auth0User => ({
  user_id: "github|7",
  email: EMAIL,
  email_verified: true,
  logins_count: 1,
  created_at: "2025-06-01T00:00:00.000Z",
  identities: [{ provider: "github", user_id: "7", connection: "github" }],
});

/** The post-login event Auth0 hands the Action for a login as `user`. */
const loginAs = (user: Auth0User) => ({
  user: {
    user_id: user.user_id,
    email: user.email,
    email_verified: user.email_verified,
    identities: user.identities,
  },
  connection: { name: user.identities[0].connection },
  secrets: {
    AUTH0_DOMAIN: DOMAIN,
    MGMT_CLIENT_ID: "client-id",
    MGMT_CLIENT_SECRET: "client-secret",
  },
});

/** The Action `api`, with a working cache and a spy on setPrimaryUser. */
const makeApi = () => {
  const store = new Map<string, string>();
  return {
    cache: {
      get: (key: string) =>
        store.has(key) ? { value: store.get(key) } : undefined,
      set: (key: string, value: string) => {
        store.set(key, value);
        return { type: "success" };
      },
    },
    authentication: { setPrimaryUser: vi.fn() },
  };
};

type Call = { url: string; method: string; body: unknown; auth: string | null };

/**
 * Stands in for Auth0's token endpoint and Management API. Records every call
 * so a test can say exactly which accounts were linked, and into which.
 */
const stubAuth0 = (users: Auth0User[], { failSearch = false } = {}) => {
  const calls: Call[] = [];
  const fetchStub = vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = String(input);
    const method = init.method ?? "GET";
    const headers = new Headers(init.headers);
    calls.push({
      url,
      method,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
      auth: headers.get("authorization"),
    });
    if (url === `https://${DOMAIN}/oauth/token`) {
      return Response.json({ access_token: "mgmt-token", expires_in: 86400 });
    }
    if (url.startsWith(`https://${DOMAIN}/api/v2/users-by-email`)) {
      if (failSearch) return new Response("rate limited", { status: 429 });
      return Response.json(users);
    }
    if (method === "POST" && url.endsWith("/identities")) {
      return Response.json([], { status: 201 });
    }
    return new Response("unexpected", { status: 500 });
  });
  vi.stubGlobal("fetch", fetchStub);
  const links = () =>
    calls
      .filter((c) => c.method === "POST" && c.url.endsWith("/identities"))
      .map((c) => ({
        primary: decodeURIComponent(
          c.url.split("/api/v2/users/")[1].replace("/identities", ""),
        ),
        secondary: c.body,
        auth: c.auth,
      }));
  return { calls, links };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("linking accounts that share a verified email", () => {
  it("does nothing for an unverified email, without calling Auth0 at all", async () => {
    const phone = passwordUser({ email_verified: false });
    const { calls } = stubAuth0([googleUser(), phone]);
    const api = makeApi();

    await onExecutePostLogin(loginAs(phone), api);

    expect(calls).toEqual([]);
    expect(api.authentication.setPrimaryUser).not.toHaveBeenCalled();
  });

  it("does nothing when no other user shares the email", async () => {
    const desktop = googleUser();
    const { links } = stubAuth0([desktop]);
    const api = makeApi();

    await onExecutePostLogin(loginAs(desktop), api);

    expect(links()).toEqual([]);
    expect(api.authentication.setPrimaryUser).not.toHaveBeenCalled();
  });

  it("links a verified password user into the Google user you log in with", async () => {
    const desktop = googleUser();
    const { links } = stubAuth0([desktop, passwordUser()]);
    const api = makeApi();

    await onExecutePostLogin(loginAs(desktop), api);

    expect(links()).toEqual([
      {
        primary: "google-oauth2|100",
        secondary: { provider: "auth0", user_id: "abc" },
        auth: "Bearer mgmt-token",
      },
    ]);
    // This login already is the primary, so its sub doesn't change.
    expect(api.authentication.setPrimaryUser).not.toHaveBeenCalled();
  });

  it("logging in with the newer password account links it into the Google user and switches the sub", async () => {
    const phone = passwordUser();
    const { links } = stubAuth0([googleUser(), phone]);
    const api = makeApi();

    await onExecutePostLogin(loginAs(phone), api);

    expect(links()).toEqual([
      {
        primary: "google-oauth2|100",
        secondary: { provider: "auth0", user_id: "abc" },
        auth: "Bearer mgmt-token",
      },
    ]);
    expect(api.authentication.setPrimaryUser).toHaveBeenCalledWith(
      "google-oauth2|100",
    );
  });

  it("keeps the most-used account as primary even when it is the newer one", async () => {
    const older = passwordUser({
      logins_count: 2,
      created_at: "2024-01-01T00:00:00.000Z",
    });
    const desktop = googleUser({ created_at: "2025-01-10T00:00:00.000Z" });
    const { links } = stubAuth0([older, desktop]);
    const api = makeApi();

    await onExecutePostLogin(loginAs(older), api);

    expect(links().map((l) => l.primary)).toEqual(["google-oauth2|100"]);
    expect(api.authentication.setPrimaryUser).toHaveBeenCalledWith(
      "google-oauth2|100",
    );
  });

  it("never links a user whose email is unverified", async () => {
    const desktop = googleUser();
    const { links } = stubAuth0([
      desktop,
      passwordUser({ email_verified: false }),
    ]);
    const api = makeApi();

    await onExecutePostLogin(loginAs(desktop), api);

    expect(links()).toEqual([]);
  });

  it("never links through a connection it doesn't trust to verify email", async () => {
    const desktop = googleUser();
    const { links } = stubAuth0([desktop, githubUser()]);
    const api = makeApi();

    await onExecutePostLogin(loginAs(desktop), api);
    await onExecutePostLogin(loginAs(githubUser()), api);

    expect(links()).toEqual([]);
    expect(api.authentication.setPrimaryUser).not.toHaveBeenCalled();
  });

  it("lets the login through when the Management API fails", async () => {
    const phone = passwordUser();
    const { links } = stubAuth0([googleUser(), phone], { failSearch: true });
    const api = makeApi();

    await expect(onExecutePostLogin(loginAs(phone), api)).resolves.toBeUndefined();

    expect(links()).toEqual([]);
    expect(api.authentication.setPrimaryUser).not.toHaveBeenCalled();
  });

  it("asks for a Management API token once and reuses it", async () => {
    const desktop = googleUser();
    const { calls } = stubAuth0([desktop]);
    const api = makeApi();

    await onExecutePostLogin(loginAs(desktop), api);
    await onExecutePostLogin(loginAs(desktop), api);

    const tokenRequests = calls.filter((c) => c.url.endsWith("/oauth/token"));
    expect(tokenRequests).toHaveLength(1);
    expect(tokenRequests[0].body).toEqual({
      grant_type: "client_credentials",
      client_id: "client-id",
      client_secret: "client-secret",
      audience: `https://${DOMAIN}/api/v2/`,
    });
  });

  it("searches by the lowercased email, since Auth0 matches case-sensitively", async () => {
    const desktop = googleUser();
    const { calls } = stubAuth0([desktop]);
    const api = makeApi();
    const event = loginAs(desktop);

    await onExecutePostLogin(
      { ...event, user: { ...event.user, email: "Paul@Example.com" } },
      api,
    );

    const search = calls.find((c) => c.url.includes("users-by-email"));
    expect(search?.url).toBe(
      `https://${DOMAIN}/api/v2/users-by-email?email=paul%40example.com`,
    );
  });
});
