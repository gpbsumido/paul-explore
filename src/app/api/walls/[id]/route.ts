import { NextResponse } from "next/server";
import { withBackend, buildHeaders, API_URL } from "@/lib/backendFetch";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * GET /api/walls/:id — read one saved wall, state included.
 */
export const GET = withBackend<RouteCtx>(
  "wall GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;
    const res = await fetch(`${API_URL}/api/walls/${encodeURIComponent(id)}`, {
      headers: buildHeaders(token, email),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  },
);

/**
 * PUT /api/walls/:id — rename a wall and/or replace its contents. Multipart, so
 * the body is forwarded verbatim (see the POST in ../route.ts).
 */
export const PUT = withBackend<RouteCtx>(
  "wall PUT",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;
    const body = await request.arrayBuffer();
    const res = await fetch(`${API_URL}/api/walls/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: buildHeaders(token, email, {
        "Content-Type": request.headers.get("content-type") ?? "application/octet-stream",
      }),
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  },
);

/**
 * DELETE /api/walls/:id — delete a saved wall and every photo in it.
 */
export const DELETE = withBackend<RouteCtx>(
  "wall DELETE",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;
    const res = await fetch(`${API_URL}/api/walls/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: buildHeaders(token, email),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  },
);
