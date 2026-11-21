import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { parseBody } from "@/lib/parseBody";

const confirmSchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().min(1).max(4096),
});

/**
 * POST /api/google/auth/confirm
 *
 * Finishes the Google connect. The API's OAuth callback no longer stores the
 * tokens itself, because it can't tell who is in the browser. It sends the code
 * back to /settings, and this hands it on as the signed-in user, so the API only
 * redeems it for the account that started the flow. The API's error (a 403 for
 * someone else's code, a 400 for a stale one) is passed through as-is.
 */
export const POST = withBackend(
  "google auth confirm",
  async ({ token, email }, request: NextRequest) => {
    const parsed = await parseBody(request, confirmSchema);
    if (!parsed.ok) return parsed.response;

    const upstreamResult = await fetchUpstream(
      `${API_URL}/api/google/auth/confirm`,
      {
        method: "POST",
        headers: buildHeaders(token, email, { "Content-Type": "application/json" }),
        body: JSON.stringify(parsed.data),
      },
    );
    if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
    const res = upstreamResult.response;
    return NextResponse.json(await res.json(), { status: res.status });
  },
);
