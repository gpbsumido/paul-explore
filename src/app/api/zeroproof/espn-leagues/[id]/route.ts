import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL, buildHeaders, withAdminBackend } from "@/lib/backendFetch";

type RouteCtx = { params: Promise<{ id: string }> };

// DELETE /api/zeroproof/espn-leagues/:id — unregister a league. Admin only.
export const DELETE = withAdminBackend<RouteCtx>(
  "zeroproof espn-leagues DELETE",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;
    const result = await fetchUpstream(
      `${API_URL}/api/zeroproof/espn-leagues/${encodeURIComponent(id)}`,
      { method: "DELETE", headers: buildHeaders(token, email) },
    );
    if (!result.ok) return upstreamErrorResponse(result);
    if (!result.response.ok) {
      return NextResponse.json(
        { error: "Failed to remove league" },
        { status: result.response.status },
      );
    }
    return new NextResponse(null, { status: 204 });
  },
);
