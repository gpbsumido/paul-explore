import { NextResponse } from "next/server";
import { buildHeaders, API_URL, withBackend } from "@/lib/backendFetch";
import { updateEventBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/parseBody";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/calendar/events/:id
export const GET = withBackend<RouteCtx>(
  "calendar event GET",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;
    const res = await fetch(`${API_URL}/api/calendar/events/${id}`, {
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.error("[calendar BFF] GET event — backend error:", body);
      return NextResponse.json(
        { error: "Failed to fetch event" },
        { status: res.status },
      );
    }
    return NextResponse.json(await res.json());
  },
);

// PUT /api/calendar/events/:id
export const PUT = withBackend<RouteCtx>(
  "calendar event PUT",
  async ({ token, email }, request, { params }) => {
    const { id } = await params;
    const bodyResult = await parseBody(request, updateEventBodySchema);
    if (!bodyResult.ok) return bodyResult.response;

    const res = await fetch(`${API_URL}/api/calendar/events/${id}`, {
      method: "PUT",
      headers: buildHeaders(token, email, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(bodyResult.data),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to update event" }));
      console.error("[calendar BFF] PUT — backend error body:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return NextResponse.json(await res.json());
  },
);

// DELETE /api/calendar/events/:id
export const DELETE = withBackend<RouteCtx>(
  "calendar event DELETE",
  async ({ token, email }, _request, { params }) => {
    const { id } = await params;
    const res = await fetch(`${API_URL}/api/calendar/events/${id}`, {
      method: "DELETE",
      headers: buildHeaders(token, email),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to delete event" }));
      console.error("[calendar BFF] DELETE — backend error body:", err);
      return NextResponse.json(err, { status: res.status });
    }
    return new NextResponse(null, { status: 204 });
  },
);
