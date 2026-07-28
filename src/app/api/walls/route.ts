import { NextResponse } from "next/server";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";

/**
 * GET /api/walls — list the signed-in user's saved gallery walls.
 */
export const GET = withBackend("walls GET", async ({ token, email }) => {
  const res = await fetch(`${API_URL}/api/walls`, {
    headers: buildHeaders(token, email),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
});

/**
 * POST /api/walls — save a new wall. The body is multipart (name, state, and a
 * file per freshly added photo keyed by its image id), so it's forwarded byte
 * for byte with its original content type to keep the boundary intact.
 */
export const POST = withBackend("walls POST", async ({ token, email }, request) => {
  const body = await request.arrayBuffer();
  const res = await fetch(`${API_URL}/api/walls`, {
    method: "POST",
    headers: buildHeaders(token, email, {
      "Content-Type": request.headers.get("content-type") ?? "application/octet-stream",
    }),
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
});
