import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { API_URL } from "@/lib/apiUrl";
import { InvalidSegmentError } from "@/lib/safeSegment";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";

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
      // A rejected path segment is the caller sending something malformed, not
      // the backend being down. 502 would be a lie and would page on someone
      // else's bad request.
      if (err instanceof InvalidSegmentError) {
        return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
      }
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

/**
 * Public GET proxy that forwards the visitor's token when they have one and goes
 * through unauthenticated otherwise. Fetches `${API_URL}${path}`, and on success
 * returns `{ [key]: data[key] ?? [] }`. Transport failures map to the standard
 * 504/502, a non-2xx upstream to `{ error: errorLabel }` at its status, and a
 * malformed body to 502. Used by the public vitals list endpoints, which are
 * identical apart from the path, label and response key.
 */
export async function proxyPublicList(
  path: string,
  { errorLabel, key }: { errorLabel: string; key: string },
): Promise<NextResponse> {
  let token: string | undefined;
  try {
    ({ token } = await auth0.getAccessToken());
  } catch {
    token = undefined;
  }

  try {
    const result = await fetchUpstream(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!result.ok) return upstreamErrorResponse(result);

    const res = result.response;
    if (!res.ok) {
      console.error(`[BFF] GET ${path} — backend error:`, res.status);
      return NextResponse.json({ error: errorLabel }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ [key]: data[key] ?? [] });
  } catch (err) {
    console.error(`[BFF] GET ${path} — fetch threw:`, err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
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
