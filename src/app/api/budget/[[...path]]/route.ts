import { NextResponse, type NextRequest } from "next/server";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";
import { fetchUpstream, upstreamErrorResponse } from "@/lib/upstream";

/**
 * One proxy for the whole budgets domain rather than a file per endpoint. Every
 * `/api/budget/...` request forwards to `${API_URL}/api/budgets/...` with the
 * caller's own token attached, so the backend attributes the write to the
 * person, not to the BFF. withBackend supplies the token (401 if signed out),
 * which is why the page keeps its localStorage budget for anonymous visitors
 * and only syncs once someone is signed in.
 */

type Ctx = { params: Promise<{ path?: string[] }> };

// Path segments are route words and UUIDs. Anything else is a malformed caller,
// not a real path — reject it rather than forward a traversal attempt.
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

  const search = new URL(request.url).search;
  const suffix = path.length ? `/${path.join("/")}` : "";
  const url = `${API_URL}/api/budgets${suffix}${search}`;

  const sendsBody = method === "POST" || method === "PATCH";
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

export const GET = withBackend<Ctx>("budget GET", (b, r, c) =>
  forward("GET", b, r as NextRequest, c),
);
export const POST = withBackend<Ctx>("budget POST", (b, r, c) =>
  forward("POST", b, r as NextRequest, c),
);
export const PATCH = withBackend<Ctx>("budget PATCH", (b, r, c) =>
  forward("PATCH", b, r as NextRequest, c),
);
export const DELETE = withBackend<Ctx>("budget DELETE", (b, r, c) =>
  forward("DELETE", b, r as NextRequest, c),
);
