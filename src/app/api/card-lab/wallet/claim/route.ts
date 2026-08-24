import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";

// POST /api/card-lab/wallet/claim — grant the daily coins (idempotent per day).
export const POST = withBackend("card-lab claim", async ({ token }) => {
  const result = await fetchUpstream(`${API_URL}/api/tcg/wallet/claim`, {
    method: "POST",
    headers: buildHeaders(token, null, { "Content-Type": "application/json" }),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to claim" },
      { status: result.response.status },
    );
  }
  return NextResponse.json(await result.response.json());
});
