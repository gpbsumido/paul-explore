import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Authenticated fetch to the portfolio API.
 *
 * Attaches the Auth0 Bearer token. Email is now included directly in the
 * access token via an Auth0 post-login Action, so the backend upsertUser
 * middleware reads it from req.auth.payload.email without needing a header.
 *
 * Throws if the token can't be retrieved (caller should return 401).
 */
export async function getBackendAuth(): Promise<{
  token: string;
  email: null;
}> {
  const { token } = await auth0.getAccessToken();
  return { token, email: null };
}

export function buildHeaders(
  token: string,
  _email: string | null,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

export { API_URL };
