import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";

// POST /api/zeroproof/bets — place a bet. Auth required. The body
// ({ walletId, eventId, market, selection, stakeCents }) names the outcome; the
// backend freezes the current line and checks the balance inside the transaction.
export const POST = withBackend("zeroproof place bet", async ({ token }, request) => {
  const body = await request.json().catch(() => ({}));
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/bets`, {
    method: "POST",
    headers: buildHeaders(token, null),
    body: JSON.stringify(body),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  const payload = await result.response.json().catch(() => null);
  if (!result.response.ok) {
    return NextResponse.json(payload ?? { error: "Failed to place bet" }, {
      status: result.response.status,
    });
  }
  return NextResponse.json(payload);
});
