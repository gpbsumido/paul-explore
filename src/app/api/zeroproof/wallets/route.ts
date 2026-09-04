import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";

// POST /api/zeroproof/wallets — open a Season or Challenge wallet.
// Auth required; the body ({ mode, depositCents? }) is validated on the backend.
export const POST = withBackend("zeroproof open wallet", async ({ token }, request) => {
  const body = await request.json().catch(() => ({}));
  const result = await fetchUpstream(`${API_URL}/api/zeroproof/wallets`, {
    method: "POST",
    // The JSON content-type is required: the backend's express.json() only
    // parses the body when it's set, and without it every field reads as
    // missing ("mode is required").
    headers: buildHeaders(token, null, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!result.ok) return upstreamErrorResponse(result);
  const payload = await result.response.json().catch(() => null);
  if (!result.response.ok) {
    return NextResponse.json(payload ?? { error: "Failed to open wallet" }, {
      status: result.response.status,
    });
  }
  return NextResponse.json(payload);
});
