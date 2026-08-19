import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { NextResponse } from "next/server";

/**
 * GET /api/google/auth/url
 *
 * Asks the backend to generate the Google OAuth authorization URL for the
 * current user. The frontend redirects to that URL to kick off the connect flow.
 *
 * Forwards the ?origin param so the backend can embed it in the signed state
 * and redirect back to the right environment after OAuth completes.
 */
export const GET = withBackend(
  "google auth url",
  async ({ token, email }, request) => {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get("origin");

    if (origin !== null) {
      let parsedOrigin: URL;
      try {
        parsedOrigin = new URL(origin);
      } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
      }
      if (
        parsedOrigin.protocol !== "http:" &&
        parsedOrigin.protocol !== "https:"
      ) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
      }
    }

    const backendUrl = new URL(`${API_URL}/api/google/auth/url`);
    if (origin) backendUrl.searchParams.set("origin", origin);

    const upstreamResult = await fetchUpstream(backendUrl.toString(), {
      headers: buildHeaders(token, email),
    });
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      console.error(
        "[google BFF] GET /auth/url — backend returned",
        res.status,
      );
      return NextResponse.json(
        { error: "Failed to generate URL" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);
