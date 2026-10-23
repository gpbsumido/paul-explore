import { NextResponse } from "next/server";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";
import { API_URL, buildHeaders, withAdminBackend } from "@/lib/backendFetch";

/**
 * GET /api/evar/admin/export — every participant and attempt in the EVAR
 * study, pseudonymous. Admin only here, and the API checks again with the
 * caller's token. Never cached: it's the live dataset.
 */
export const GET = withAdminBackend("evar study export GET", async ({ token, email }) => {
  const upstreamResult = await fetchUpstream(`${API_URL}/api/evar/admin/export`, {
    headers: buildHeaders(token, email),
    cache: "no-store",
  });
  if (!upstreamResult.ok) return upstreamErrorResponse(upstreamResult);
  const res = upstreamResult.response;
  return NextResponse.json(await res.json(), { status: res.status });
});
