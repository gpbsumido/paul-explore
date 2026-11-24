import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { DEFAULT_MAX_BYTES, parseBody } from "@/lib/parseBody";
import { placeBetBodySchema } from "@/lib/zeroproof/schemas";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";

// POST /api/zeroproof/bets — place a bet. Auth required. The body
// ({ walletId, eventId, market, selection, stakeCents }) names the outcome; the
// backend freezes the current line and checks the balance inside the transaction.
export const POST = withBackend("zeroproof place bet", async ({ token }, request) => {
  const parsed = await parseBody(request, placeBetBodySchema, DEFAULT_MAX_BYTES, { explainFirstIssue: true });
  if (!parsed.ok) return parsed.response;
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/bets`, {
    method: "POST",
    // JSON content-type required, or the backend's express.json() leaves the
    // body unparsed and every field reads as missing.
    headers: buildHeaders(token, null, { "Content-Type": "application/json" }),
    body: JSON.stringify(parsed.data),
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

// GET /api/zeroproof/bets — the signed-in player's bet history, newest first.
// Auth required; withBackend answers 401 when there's no session.
export const GET = withBackend("zeroproof bet history", async ({ token }) => {
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/bets`, {
    headers: buildHeaders(token, null),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  if (!result.response.ok) {
    return NextResponse.json(
      { error: "Failed to load bet history" },
      { status: result.response.status },
    );
  }
  return NextResponse.json(await result.response.json());
});
