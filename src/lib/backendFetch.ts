import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** The auth context handed to a wrapped BFF handler. */
export type BackendContext = { token: string; email: string | null };

type BackendHandler<Ctx> = (
  backend: BackendContext,
  request: NextRequest,
  routeCtx: Ctx,
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a BFF route handler with the shared plumbing every proxy route repeats:
 * resolve the backend token (401 if it can't), run the handler, and turn any
 * thrown backend/network error into a clean 502 with consistent logging.
 *
 * Routes keep only their own logic (the fetch, the status mapping); the auth
 * and failure handling live here, so every route fails the same way. `label`
 * prefixes the logs (e.g. "calendars GET").
 */
export function withBackend<Ctx = unknown>(
  label: string,
  handler: BackendHandler<Ctx>,
) {
  return async (request: NextRequest, routeCtx: Ctx): Promise<NextResponse> => {
    let backend: BackendContext;
    try {
      backend = await getBackendAuth();
    } catch (err) {
      console.error(`[${label}] auth failed:`, err);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    try {
      return await handler(backend, request, routeCtx);
    } catch (err) {
      console.error(`[${label}] backend unavailable:`, err);
      return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
    }
  };
}

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
