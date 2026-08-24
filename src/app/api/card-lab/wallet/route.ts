import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";

// GET /api/card-lab/wallet — the signed-in user's coin balance.
export const GET = withBackend("card-lab wallet", async ({ token }) => {
  const result = await fetchUpstream(`${API_URL}/api/tcg/wallet`, {
    headers: buildHeaders(token, null),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to load wallet" },
      { status: result.response.status },
    );
  }
  return NextResponse.json(await result.response.json());
});
