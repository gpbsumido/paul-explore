import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { NextResponse } from "next/server";

/**
 * DELETE /api/google/auth/disconnect
 *
 * Stops the user's Google Calendar watch channel and removes their stored
 * tokens. After this their events will no longer sync with Google Calendar.
 * Returns 204 on success.
 */
export const DELETE = withBackend(
  "google auth disconnect",
  async ({ token, email }) => {
    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/google/auth/disconnect`,
      {
        method: "DELETE",
        headers: buildHeaders(token, email),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    if (!res.ok) {
      console.error(
        "[google BFF] DELETE /auth/disconnect — backend returned",
        res.status,
      );
      return NextResponse.json(
        { error: "Failed to disconnect" },
        { status: res.status },
      );
    }
    return new NextResponse(null, { status: 204 });
  },
);
