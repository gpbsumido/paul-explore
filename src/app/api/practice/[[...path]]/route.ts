import { NextResponse, type NextRequest } from "next/server";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";

/**
 * Proxies `/api/practice/...` to portfolio_api's `/api/practice/...` with the
 * caller's own token, so interview-prep review progress is stored against the
 * person. withBackend answers 401 when nobody is signed in, which is the
 * playbook's cue to keep progress in localStorage instead.
 */

type Ctx = { params: Promise<{ path?: string[] }> };

// Segments are route words and pattern slugs. Anything else is a malformed
// caller, so reject it rather than forward a traversal attempt.
const SAFE_SEGMENT = /^[a-zA-Z0-9-]+$/;

async function forward(
  method: string,
  backend: { token: string; email: string | null },
  request: NextRequest,
  ctx: Ctx,
): Promise<NextResponse> {
  const { path = [] } = await ctx.params;
  if (path.some((s) => !SAFE_SEGMENT.test(s))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const suffix = path.length ? `/${path.join("/")}` : "";
  const url = `${API_URL}/api/practice${suffix}`;

  const sendsBody = method === "POST" || method === "PUT";
  const body = sendsBody ? await request.text() : undefined;

  const upstream = await fetchUpstream(url, {
    method,
    headers: buildHeaders(
      backend.token,
      backend.email,
      sendsBody ? { "Content-Type": "application/json" } : {},
    ),
    ...(body ? { body } : {}),
  });
  if (!upstream.ok) return upstreamErrorResponse(upstream);

  const res = upstream.response;
  const json = await res.json().catch(() => null);
  return NextResponse.json(json ?? {}, { status: res.status });
}

export const GET = withBackend<Ctx>("practice GET", (b, r, c) =>
  forward("GET", b, r as NextRequest, c),
);
export const PUT = withBackend<Ctx>("practice PUT", (b, r, c) =>
  forward("PUT", b, r as NextRequest, c),
);
export const POST = withBackend<Ctx>("practice POST", (b, r, c) =>
  forward("POST", b, r as NextRequest, c),
);
