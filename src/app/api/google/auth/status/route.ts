import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { NextResponse } from "next/server";

/**
 * GET /api/google/auth/status
 *
 * Returns { connected: boolean } indicating whether the current user has
 * linked their Google Calendar. Used by the settings page on mount.
 */
export const GET = withBackend(
  "google auth status",
  async ({ token, email }) => {
    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/google/auth/status`,
      {
        headers: buildHeaders(token, email),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      console.error(
        "[google BFF] GET /auth/status — backend returned",
        res.status,
      );
      return NextResponse.json(
        { error: "Failed to fetch status" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);
