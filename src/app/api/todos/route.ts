import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";

/**
 * GET /api/todos
 *
 * Proxies the admin to-do list. The caller's own token goes upstream rather
 * than a service secret: the API re-checks that this person is the owner, so
 * the BFF vouching for them would just be a confused deputy.
 */
export const GET = withBackend("todos GET", async ({ token, email }) => {
  const upstreamResult = await fetchUpstream(`${API_URL}/api/todos`, {
    headers: buildHeaders(token, email),
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);

  const res = upstreamResult.response;
  if (!res.ok) {
    console.error("[todos BFF] GET — backend status:", res.status);
    return NextResponse.json(
      { error: "Failed to load todos" },
      { status: res.status },
    );
  }
  return NextResponse.json(await res.json());
});
